export interface ToolEntry {
    name: string;
    description: string;
    inputSchema: object;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
}
export interface ServeOptions {
    name: string;
    version: string;
    /** Absolute path to the server's src directory (typically import.meta.dir from caller) */
    serverDir: string;
    /** Optional: override tools directory. Defaults to <serverDir>/../tools */
    toolsDir?: string;
}
export interface Tool {
    name: string;
    description: string;
    inputSchema: object;
}
export type ToolHandler = (args: Record<string, unknown>) => Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
export interface ToolRegistry {
    [toolName: string]: ToolHandler;
}
//# sourceMappingURL=types.d.ts.map