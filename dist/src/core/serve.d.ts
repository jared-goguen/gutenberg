import { ServeOptions } from "./types.js";
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
export declare function serve(options: ServeOptions): Promise<void>;
//# sourceMappingURL=serve.d.ts.map