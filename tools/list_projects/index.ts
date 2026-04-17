import { getConfig, cfFetch } from "../../src/cf.js";

export async function handler() {
  const { accountId } = getConfig();

  const projects = await cfFetch<Array<{
    name: string;
    domains: string[];
  }>>(`/accounts/${accountId}/pages/projects`);

  const result = projects.map((p) => ({
    name: p.name,
    url: p.domains[0] || `https://${p.name}.pages.dev`,
  }));

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ projects: result }),
    }],
  };
}
