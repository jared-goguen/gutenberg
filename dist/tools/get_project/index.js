import { getConfig, cfFetch } from "../../src/cf.js";
export async function handler(input) {
    const { accountId } = getConfig();
    const projectName = input.project_name;
    if (!projectName) {
        throw new Error("'project_name' is required");
    }
    const project = await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`);
    const url = project.domains[0] || `https://${projectName}.pages.dev`;
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    name: project.name,
                    url,
                    created_at: project.created_on,
                }),
            }],
    };
}
//# sourceMappingURL=index.js.map