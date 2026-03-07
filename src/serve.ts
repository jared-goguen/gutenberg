import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

interface ToolEntry {
  name: string;
  description: string;
  inputSchema: object;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

interface ServeOptions {
  name: string;
  version: string;
  /** Absolute path to the tools directory. Defaults to <projectRoot>/tools */
  toolsDir?: string;
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
      (v): v is (...args: any[]) => Promise<unknown> =>
        typeof v === "function",
    );
    if (!handler) {
      console.warn(`[serve] No exported function in ${indexPath}, skipping`);
      continue;
    }

    // Load description from purpose.md (optional)
    let description = "";
    const purposePath = join(dir, "purpose.md");
    if (await fileExists(purposePath)) {
      const raw = await readFile(purposePath, "utf8");
      // Use the first line (or first sentence) as the short description
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

export async function createConventionServer(
  options: ServeOptions,
): Promise<Server> {
  // Resolve tools directory
  const projectRoot = options.toolsDir
    ? join(options.toolsDir, "..")
    : join(import.meta.dir, "..");
  const toolsDir = options.toolsDir ?? join(projectRoot, "tools");

  const tools = await discoverTools(toolsDir);

  const server = new Server(
    { name: options.name, version: options.version },
    { capabilities: { tools: { listChanged: true } } },
  );

  // ── tools/list ─────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  // ── tools/call ─────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = tools.find((t) => t.name === toolName);
    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${toolName}`,
      );
    }

    const args = (request.params.arguments ?? {}) as Record<
      string,
      unknown
    >;

    try {
      const result = await tool.handler(args);
      // Handlers already return MCP-formatted { content: [...] }
      return result as {
        content: Array<{ type: string; text: string }>;
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  });

  return server;
}

export async function startServer(options: ServeOptions): Promise<void> {
  const server = await createConventionServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
