import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "path";

export interface TestServer {
  client: Client;
  call: (tool: string, args?: Record<string, unknown>) => Promise<string>;
  listTools: () => Promise<string[]>;
  close: () => Promise<void>;
}

export async function spawnServer(): Promise<TestServer> {
  const serverPath = join(new URL("../../src/index.ts", import.meta.url).pathname);

  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", serverPath],
    env: { ...process.env },
  });

  const client = new Client({ name: "gutenberg-test", version: "0.0.1" });
  await client.connect(transport);

  const call = async (tool: string, args: Record<string, unknown> = {}): Promise<string> => {
    const result = await client.callTool({ name: tool, arguments: args });
    const content = result.content as Array<{ type: string; text: string }>;
    if (!content[0]) throw new Error(`No content returned from tool: ${tool}`);
    if (result.isError) throw new Error(content[0].text);
    return content[0].text;
  };

  const listTools = async (): Promise<string[]> => {
    const result = await client.listTools();
    return result.tools.map(t => t.name);
  };

  const close = async () => {
    await client.close();
  };

  return { client, call, listTools, close };
}
