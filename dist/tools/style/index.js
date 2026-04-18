import { promises as fs } from "fs";
import { style } from "../../src/pipeline/index.js";
import { getArtifactPath } from "../../src/project.js";
export async function handler(input) {
    const spec_path = input.spec_path;
    if (!spec_path) {
        throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
    }
    try {
        const lint_path = await getArtifactPath(spec_path, "lint");
        const enrich_path = await getArtifactPath(spec_path, "enrich");
        const html_path = await getArtifactPath(spec_path, "html");
        // Validate required artifacts exist
        let lintContent;
        let enrichContent;
        try {
            lintContent = await fs.readFile(lint_path, "utf8");
        }
        catch (error) {
            throw new Error(`LINT artifact not found at ${lint_path}.\n` +
                `Pipeline error: LINT stage must be run before STYLE.\n` +
                `Run 'gutenberg_lint(spec_path="${spec_path}")' first.`);
        }
        try {
            enrichContent = await fs.readFile(enrich_path, "utf8");
        }
        catch (error) {
            throw new Error(`ENRICH artifact not found at ${enrich_path}.\n` +
                `Pipeline error: ENRICH stage must be run before STYLE.\n` +
                `Run 'gutenberg_enrich(spec_path="${spec_path}")' first.`);
        }
        // Parse artifacts
        let schema;
        let annotatedNodes;
        try {
            const lintData = JSON.parse(lintContent);
            schema = lintData.schema;
            if (!schema) {
                throw new Error("LINT artifact missing 'schema' field");
            }
        }
        catch (error) {
            throw new Error(`Failed to parse LINT artifact at ${lint_path}: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            const enrichData = JSON.parse(enrichContent);
            annotatedNodes = enrichData.nodes;
            if (!Array.isArray(annotatedNodes)) {
                throw new Error("ENRICH artifact 'nodes' field is not an array");
            }
        }
        catch (error) {
            throw new Error(`Failed to parse ENRICH artifact at ${enrich_path}: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Generate HTML
        const html = style(annotatedNodes, schema.page.meta, { minify: false, indentSize: 2 });
        // Write output
        await fs.writeFile(html_path, html, "utf8");
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({ html_path, bytes: html.length }),
                }],
        };
    }
    catch (error) {
        // Re-throw with context if not already a formatted error
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`STYLE stage failed: ${String(error)}`);
    }
}
//# sourceMappingURL=index.js.map