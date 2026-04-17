import { getConfig, cfFetch } from "../../src/cf.js";

export async function handler(input: Record<string, unknown>) {
  const { accountId } = getConfig();
  const projectName = input.project_name as string;

  if (!projectName) {
    throw new Error("'project_name' is required");
  }

  try {
    const project = await cfFetch<{
      name: string;
      domains: string[];
      created_on: string;
    }>(`/accounts/${accountId}/pages/projects/${projectName}`);

    const url = project.domains[0] || `https://${projectName}.pages.dev`;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          project_name: project.name,
          url,
          created_at: project.created_on,
          status: "existing",
        }),
      }],
    };
  } catch {
    const result = await cfFetch<{
      name: string;
      domains: string[];
      created_on: string;
    }>(`/accounts/${accountId}/pages/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
      }),
    });

    const url = result.domains[0] || `https://${projectName}.pages.dev`;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          project_name: result.name,
          url,
          created_at: result.created_on,
          status: "created",
        }),
      }],
    };
  }
}
