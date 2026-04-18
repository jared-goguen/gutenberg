import * as readline from "readline";
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { Tool, ToolRegistry, ToolHandler, ServeOptions } from "./types.js";
import { toolHooks, ToolResultEvent } from "./hooks.js";
import { enforcementHooks } from "./enforcement.js";

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: Record<string, unknown>;
  };
}

interface ToolEntry {
  name: string;
  description: string;
  inputSchema: object;
  handler: ToolHandler;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function discoverTools(toolsDir: string): Promise<ToolEntry[]> {
  if (!(await fileExists(toolsDir))) return [];

  const entries = await readdir(toolsDir, { withFileTypes: true });
  const tools: ToolEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dir = join(toolsDir, entry.name);
    const indexPath = join(dir, "index.ts");

    if (!(await fileExists(indexPath))) continue;

    // Load handler: find the first exported function
    const mod = await import(indexPath);
    const handler = Object.values(mod).find(
      (v): v is ToolHandler => typeof v === "function"
    );
    if (!handler) {
      console.warn(`[serve] No exported function in ${indexPath}, skipping`);
      continue;
    }

    // Load description from AGENTS.md or purpose.md (optional)
    let description = "";
    const agentsPath = join(dir, "AGENTS.md");
    const purposePath = join(dir, "purpose.md");
    if (await fileExists(agentsPath)) {
      const raw = await readFile(agentsPath, "utf8");
      // Extract first heading or first non-empty line
      const lines = raw.split("\n").filter(l => l.trim());
      description = lines[0]?.replace(/^#\s+/, "").trim() || "";
    } else if (await fileExists(purposePath)) {
      const raw = await readFile(purposePath, "utf8");
      description = raw.split("\n")[0].trim();
    }

    // Load input schema from schema.json (optional)
    let inputSchema: object = { type: "object" };
    const schemaPath = join(dir, "schema.json");
    if (await fileExists(schemaPath)) {
      try {
        const raw = JSON.parse(await readFile(schemaPath, "utf8"));
        if (raw.input) inputSchema = raw.input;
      } catch (err) {
        console.warn(`[serve] Bad schema.json in ${dir}:`, err);
      }
    }

    tools.push({ name: entry.name, description, inputSchema, handler });
  }

  return tools;
}

/**
 * Convention-based MCP server runtime.
 *
 * Discovers tools from the file system and handles JSON-RPC 2.0 protocol.
 * Expects tools to be in the following structure:
 *   - tools/<tool-name>/index.ts -> exports handler function
 *   - tools/<tool-name>/schema.json -> contains inputSchema
 *   - tools/<tool-name>/AGENTS.md -> contains description
 *
 * Tool names are derived from directory names.
 *
 * Emits tool call events through the toolHooks system for tracking and monitoring.
 */
export async function serve(options: ServeOptions) {
  // Resolve tools directory relative to caller's serverDir
  const projectRoot = join(options.serverDir, "..");
  const toolsDir = options.toolsDir ?? join(projectRoot, "tools");

  // Discover and load all tools
  const toolEntries = await discoverTools(toolsDir);
  
  // Build tool registry and tools array
  const toolRegistry: ToolRegistry = {};
  const tools: Tool[] = [];
  
  for (const entry of toolEntries) {
    toolRegistry[entry.name] = entry.handler;
    tools.push({
      name: entry.name,
      description: entry.description,
      inputSchema: entry.inputSchema,
    });
  }

  // Start JSON-RPC server
  await runServer(toolRegistry, tools, options);
}

async function runServer(
  toolRegistry: ToolRegistry,
  tools: Tool[],
  options: ServeOptions
) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (!line.trim()) {
      continue;
    }

    let request: JSONRPCRequest;
    try {
      request = JSON.parse(line);
    } catch (e) {
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
        },
      };
      console.log(JSON.stringify(response));
      continue;
    }

    // Handle initialization
    if (request.method === "initialize") {
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          serverInfo: {
            name: options.name,
            version: options.version,
          },
        },
      };
      console.log(JSON.stringify(response));
      continue;
    }

    // Handle listing tools
    if (request.method === "tools/list") {
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: tools,
        },
      };
      console.log(JSON.stringify(response));
      continue;
    }

    // Handle tool calls
    if (request.method === "tools/call") {
      const { name, arguments: args } = request.params as {
        name: string;
        arguments: Record<string, unknown>;
      };

      if (!toolRegistry[name]) {
        const response: JSONRPCResponse = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: "Method not found",
          },
        };
        console.log(JSON.stringify(response));
        continue;
      }

      // Check enforcement limits before executing tool
      const enforcementCheck = await enforcementHooks.check({
        tool_name: name,
        input: args,
        timestamp: Date.now(),
      });

      if (!enforcementCheck.allowed) {
        const response: JSONRPCResponse = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: "Tool execution blocked",
            data: {
              details: enforcementCheck.reason || "Limit exceeded",
              limit_type: enforcementCheck.limit_type,
            },
          },
        };
        console.log(JSON.stringify(response));
        continue;
      }

      // Track execution with hooks
      const startTime = Date.now();
      let error: string | undefined;
      let result: { content: Array<{ type: string; text: string }> } | undefined;
      let success = false;

      try {
        result = await toolRegistry[name](args);
        success = true;

        const response: JSONRPCResponse = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: result.content,
          },
        };

        // Emit hook for successful execution
        const duration = Date.now() - startTime;
        await toolHooks.emit({
          tool_name: name,
          input: args,
          timestamp: startTime,
          duration_ms: duration,
          success: true,
          result,
        } as ToolResultEvent);

        console.log(JSON.stringify(response));
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);

        const response: JSONRPCResponse = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: "Internal error",
            data: {
              details: error,
            },
          },
        };

        // Emit hook for failed execution
        const duration = Date.now() - startTime;
        await toolHooks.emit({
          tool_name: name,
          input: args,
          timestamp: startTime,
          duration_ms: duration,
          success: false,
          error,
        } as ToolResultEvent);

        console.log(JSON.stringify(response));
      }
      continue;
    }

    // Unknown method
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32601,
        message: "Method not found",
      },
    };
    console.log(JSON.stringify(response));
  }
}
