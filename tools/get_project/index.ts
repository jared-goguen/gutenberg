import { getConfig, cfFetch } from "../../src/cf.js";

export async function handler(input: Record<string, unknown>) {
  const { accountId } = getConfig();
  const projectName = input.project_name as string;

  if (!projectName) {
    throw new Error("'project_name' is required");
  }

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
        name: project.name,
        url,
        created_at: project.created_on,
      }),
    }],
  };
}
