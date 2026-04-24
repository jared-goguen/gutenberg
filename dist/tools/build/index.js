/**
 * Build tool — compiles YAML specs to .site/ using the ported rendering engine.
 *
 * Pipeline: readProjectConfig → discoverSpecs → plan → render (html5) → write .site/
 *
 * Keeps handler(input) export for convention-based tool discovery.
 */
import { build } from "../../src/build.js";
import { readProjectConfig } from "../../src/project-config.js";
export async function handler(input) {
    const project_dir = (input.project_dir ?? input.project_path);
    if (!project_dir) {
        throw new Error("'project_dir' is required — provide an absolute path to a project directory containing YAML specs.");
    }
    // Read project config to determine target (if available)
    const config = await readProjectConfig(project_dir);
    const result = await build({
        projectDir: project_dir,
        siteDir: input.site_dir,
        force: input.force,
        section: input.section,
        specKey: input.spec_key,
        target: config?.targets?.[0],
    });
    const buildFailed = result.errors.length > 0 && result.compiled === 0;
    console.error(`[build] ${buildFailed ? "FAILED" : "Complete"}: ${result.compiled} compiled, ${result.skipped} skipped, ${result.reconciled} reconciled${result.errors.length > 0 ? `, ${result.errors.length} error(s)` : ""}`);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    total: result.total,
                    compiled: result.compiled,
                    skipped: result.skipped,
                    reconciled: result.reconciled,
                    errors: result.errors.length > 0 ? result.errors : undefined,
                    site_dir: result.siteDir,
                }, null, 2),
            },
        ],
        isError: buildFailed,
    };
}
//# sourceMappingURL=index.js.map