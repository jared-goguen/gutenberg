import { promises as fs } from "fs";
import { dirname, basename, join } from "path";
import { parseProjectConfig, discoverPages, discoverTemplates, buildNavStructure, getRenderedDir, getArtifactPath, getTemplateMetadata, } from "../../src/project.js";
import { lint, scaffold, enrich, style } from "../../src/pipeline/index.js";
export async function handler(input) {
    const project_path = input.project_path;
    if (!project_path) {
        throw new Error("'project_path' is required - provide an absolute path to gutenberg.yaml");
    }
    const config = await parseProjectConfig(project_path);
    const projectRoot = dirname(project_path);
    const renderedDir = await getRenderedDir(project_path);
    const pages = await discoverPages(project_path);
    const templates = await discoverTemplates(projectRoot);
    if (pages.length === 0 && templates.length === 0) {
        throw new Error(`No pages or templates found in project at ${projectRoot}`);
    }
    await fs.mkdir(renderedDir, { recursive: true });
    // DISCOVERY: Validate templates (but don't render them)
    if (templates.length > 0) {
        console.error(`[build] Found ${templates.length} template(s), validating...`);
        const templateMetadata = await getTemplateMetadata(projectRoot);
        console.error(`[build] ${templateMetadata.length} template(s) valid`);
        // Store metadata in .gutenberg-edit/ for later use
        const editDir = join(projectRoot, ".gutenberg-edit");
        await fs.mkdir(editDir, { recursive: true });
        await fs.writeFile(join(editDir, "templates.json"), JSON.stringify(templateMetadata, null, 2), "utf8");
    }
    // FIRST PASS: lint all pages to gather titles for nav
    console.error(`[build] Linting ${pages.length} pages...`);
    for (const spec_path of pages) {
        const lint_path = await getArtifactPath(spec_path, "lint");
        await fs.mkdir(dirname(lint_path), { recursive: true });
        const yamlContent = await fs.readFile(spec_path, "utf8");
        const lintOutput = lint(yamlContent);
        await fs.writeFile(lint_path, JSON.stringify({ schema: lintOutput.schema, result: lintOutput.result }, null, 2), "utf8");
    }
    // Build navigation from all page titles
    console.error(`[build] Building navigation structure...`);
    const nav = await buildNavStructure(pages, projectRoot);
    // SECOND PASS: scaffold → enrich → style each page
    console.error(`[build] Rendering ${pages.length} pages...`);
    const results = [];
    for (const spec_path of pages) {
        const lint_path = await getArtifactPath(spec_path, "lint");
        const scaffold_path = await getArtifactPath(spec_path, "scaffold");
        const enrich_path = await getArtifactPath(spec_path, "enrich");
        const html_path = await getArtifactPath(spec_path, "html");
        const lintData = JSON.parse(await fs.readFile(lint_path, "utf8"));
        let schema = lintData.schema;
        // Inject cross-page navigation (only when multi-page)
        if (!schema.page.sections)
            schema.page.sections = [];
        const navSectionIndex = schema.page.sections.findIndex(s => s.type === "navigation");
        const currentHref = nav.find(link => {
            const specName = basename(spec_path, ".yaml");
            return link.href === `/${specName}` || link.href === "/" || link.href.endsWith(`/${specName}`);
        })?.href;
        const filteredNav = nav.filter(link => link.href !== currentHref);
        if (navSectionIndex >= 0 && filteredNav.length > 0) {
            schema.page.sections[navSectionIndex].links = filteredNav.map(l => ({ text: l.text, href: l.href }));
        }
        else if (navSectionIndex < 0 && filteredNav.length > 0) {
            schema.page.sections.unshift({ type: "navigation", links: filteredNav.map(l => ({ text: l.text, href: l.href })) });
        }
        // SCAFFOLD
        const renderNodes = scaffold(schema);
        await fs.writeFile(scaffold_path, JSON.stringify({ spec_name: basename(spec_path, ".yaml"), nodes: renderNodes }, null, 2), "utf8");
        // ENRICH
        const annotatedNodes = enrich(renderNodes);
        await fs.writeFile(enrich_path, JSON.stringify({ spec_name: basename(spec_path, ".yaml"), nodes: annotatedNodes }, null, 2), "utf8");
        // STYLE
        const html = style(annotatedNodes, schema.page.meta, { minify: false, indentSize: 2 });
        await fs.writeFile(html_path, html, "utf8");
        results.push({ spec_path, html_path, title: schema.page.meta?.title || basename(spec_path, ".yaml") });
    }
    console.error(`[build] Build complete: ${results.length} pages rendered`);
    return {
        content: [{
                type: "text",
                text: JSON.stringify({ project_name: config.project.name, rendered_dir: renderedDir, pages: results }),
            }],
    };
}
