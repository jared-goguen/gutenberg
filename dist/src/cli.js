#!/usr/bin/env bun
import { resolve } from "path";
import { cwd } from "process";
// Static imports for all handlers
import { handler as buildHandler } from "../tools/build/index.js";
import { handler as publishHandler } from "../tools/publish/index.js";
import { handler as lintHandler } from "../tools/lint/index.js";
import { handler as scaffoldHandler } from "../tools/scaffold/index.js";
import { handler as enrichHandler } from "../tools/enrich/index.js";
import { handler as styleHandler } from "../tools/style/index.js";
import { handler as snapshotHandler } from "../tools/snapshot/index.js";
import { handler as listProjectsHandler } from "../tools/list_projects/index.js";
import { handler as createProjectHandler } from "../tools/create_project/index.js";
// Handler registry
const handlerRegistry = {
    build: buildHandler,
    publish: publishHandler,
    lint: lintHandler,
    scaffold: scaffoldHandler,
    enrich: enrichHandler,
    style: styleHandler,
    snapshot: snapshotHandler,
    list_projects: listProjectsHandler,
    create_project: createProjectHandler,
};
const getHandler = (toolName) => {
    const handler = handlerRegistry[toolName];
    if (!handler) {
        throw new Error(`Unknown handler: ${toolName}`);
    }
    return handler;
};
// Color codes for terminal output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    dim: "\x1b[2m",
};
// Utility to unwrap MCP response format
const unwrapResponse = (response) => {
    if (response?.content?.[0]?.text) {
        try {
            return JSON.parse(response.content[0].text);
        }
        catch {
            return response.content[0].text;
        }
    }
    return response;
};
// Utility to format and display results
const formatOutput = (data, title) => {
    if (title) {
        console.log(`\n${colors.cyan}${colors.bright}${title}${colors.reset}`);
    }
    if (typeof data === "string") {
        console.log(data);
    }
    else {
        console.log(JSON.stringify(data, null, 2));
    }
};
// Resolve path relative to cwd()
const resolvePath = (path) => resolve(cwd(), path);
// CLI command handlers
const commands = {
    // BUILD: Build entire project
    async build(args) {
        const projectPath = args[0];
        if (!projectPath) {
            console.error(`${colors.red}Error: project_path required${colors.reset}`);
            console.error("Usage: gutenberg build <gutenberg.yaml>");
            process.exit(1);
        }
        const handler = getHandler("build");
        const result = await handler({ project_path: resolvePath(projectPath) });
        const data = unwrapResponse(result);
        formatOutput(data.pages, "Build Complete");
        console.log(`${colors.green}✓${colors.reset} Project: ${data.project_name}`);
        console.log(`${colors.green}✓${colors.reset} Output: ${data.rendered_dir}`);
    },
    // PUBLISH: Deploy to Cloudflare Pages (upload only)
    async publish(args) {
        const projectPath = args[0];
        if (!projectPath) {
            console.error(`${colors.red}Error: project_path required${colors.reset}`);
            console.error("Usage: gutenberg publish <gutenberg.yaml>");
            process.exit(1);
        }
        const handler = getHandler("publish");
        const result = await handler({ project_path: resolvePath(projectPath) });
        const data = unwrapResponse(result);
        const deploymentInfo = data.deployment;
        console.log(`${colors.green}✓${colors.reset} Published: ${deploymentInfo.project_name}`);
        console.log(`${colors.cyan}${colors.bright}Live URL:${colors.reset} ${deploymentInfo.url}`);
    },
    // DEPLOY: Full workflow (build + publish)
    async deploy(args) {
        const projectPath = args[0];
        if (!projectPath) {
            console.error(`${colors.red}Error: project_path required${colors.reset}`);
            console.error("Usage: gutenberg deploy <gutenberg.yaml>");
            process.exit(1);
        }
        const resolvedPath = resolvePath(projectPath);
        // Build
        console.log(`${colors.cyan}Building...${colors.reset}`);
        const buildHandler = getHandler("build");
        const buildResult = await buildHandler({ project_path: resolvedPath });
        const buildData = unwrapResponse(buildResult);
        console.log(`${colors.green}✓${colors.reset} Built ${buildData.pages.length} pages`);
        // Publish
        console.log(`${colors.cyan}Publishing...${colors.reset}`);
        const publishHandler = getHandler("publish");
        const publishResult = await publishHandler({ project_path: resolvedPath });
        const publishData = unwrapResponse(publishResult);
        const deploymentInfo = publishData.deployment;
        console.log(`${colors.green}✓${colors.reset} Published: ${deploymentInfo.project_name}`);
        console.log(`${colors.cyan}${colors.bright}Live URL:${colors.reset} ${deploymentInfo.url}`);
    },
    // LINT: Validate a spec
    async lint(args) {
        const specPath = args[0];
        if (!specPath) {
            console.error(`${colors.red}Error: spec_path required${colors.reset}`);
            console.error("Usage: gutenberg lint <spec.yaml>");
            process.exit(1);
        }
        const handler = getHandler("lint");
        const result = await handler({ spec_path: resolvePath(specPath) });
        const data = unwrapResponse(result);
        if (data.valid) {
            console.log(`${colors.green}✓${colors.reset} Valid spec`);
            if (data.warnings?.length) {
                console.log(`${colors.yellow}Warnings:${colors.reset}`);
                data.warnings.forEach((w) => console.log(`  - ${w}`));
            }
        }
        else {
            console.error(`${colors.red}✗${colors.reset} Invalid spec`);
            data.errors?.forEach((e) => console.error(`  - ${e}`));
            process.exit(1);
        }
        formatOutput(data, "Schema");
    },
    // SCAFFOLD: Build classless RenderNode tree
    async scaffold(args) {
        const specPath = args[0];
        if (!specPath) {
            console.error(`${colors.red}Error: spec_path required${colors.reset}`);
            console.error("Usage: gutenberg scaffold <spec.yaml>");
            process.exit(1);
        }
        const handler = getHandler("scaffold");
        const result = await handler({ spec_path: resolvePath(specPath) });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Scaffolded`);
        formatOutput(data, "RenderNode Tree");
    },
    // ENRICH: Resolve CSS classes
    async enrich(args) {
        const specPath = args[0];
        if (!specPath) {
            console.error(`${colors.red}Error: spec_path required${colors.reset}`);
            console.error("Usage: gutenberg enrich <spec.yaml>");
            process.exit(1);
        }
        const handler = getHandler("enrich");
        const result = await handler({ spec_path: resolvePath(specPath) });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Enriched with CSS classes`);
        formatOutput(data, "AnnotatedNode Tree");
    },
    // STYLE: Generate HTML
    async style(args) {
        const specPath = args[0];
        if (!specPath) {
            console.error(`${colors.red}Error: spec_path required${colors.reset}`);
            console.error("Usage: gutenberg style <spec.yaml>");
            process.exit(1);
        }
        const handler = getHandler("style");
        const result = await handler({ spec_path: resolvePath(specPath) });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Generated HTML`);
        console.log(`${colors.dim}${data.bytes} bytes${colors.reset}`);
        console.log(`${colors.dim}Output: ${data.html_path}${colors.reset}`);
    },
    // SNAPSHOT: Take a screenshot
    async snapshot(args) {
        const specPath = args[0];
        if (!specPath) {
            console.error(`${colors.red}Error: spec_path required${colors.reset}`);
            console.error("Usage: gutenberg snapshot <spec.yaml> [--width W] [--height H]");
            process.exit(1);
        }
        // Parse optional viewport dimensions
        let width = 1440;
        let height = 900;
        for (let i = 1; i < args.length; i++) {
            if (args[i] === "--width" && args[i + 1]) {
                width = parseInt(args[i + 1], 10);
                i++;
            }
            else if (args[i] === "--height" && args[i + 1]) {
                height = parseInt(args[i + 1], 10);
                i++;
            }
        }
        const handler = getHandler("snapshot");
        const result = await handler({
            spec_path: resolvePath(specPath),
            width,
            height,
        });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Screenshot captured`);
        console.log(`${colors.dim}Dimensions: ${width}x${height}${colors.reset}`);
        console.log(`${colors.dim}Output: ${data.image_path}${colors.reset}`);
    },
    // LIST-PROJECTS: List Cloudflare Pages projects
    async "list-projects"() {
        const handler = getHandler("list_projects");
        const result = await handler({});
        const data = unwrapResponse(result);
        if (data.projects?.length) {
            console.log(`${colors.cyan}${colors.bright}Cloudflare Pages Projects:${colors.reset}`);
            data.projects.forEach((p) => {
                console.log(`  ${colors.green}•${colors.reset} ${p.name}`);
                console.log(`    ${colors.dim}${p.url}${colors.reset}`);
            });
        }
        else {
            console.log("No projects found");
        }
    },
    // CREATE-PROJECT: Create a new Cloudflare Pages project
    async "create-project"(args) {
        const projectName = args[0];
        if (!projectName) {
            console.error(`${colors.red}Error: project_name required${colors.reset}`);
            console.error("Usage: gutenberg create-project <project-name>");
            process.exit(1);
        }
        const handler = getHandler("create_project");
        const result = await handler({ project_name: projectName });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Created project: ${data.project_name}`);
        console.log(`${colors.cyan}${colors.bright}URL:${colors.reset} ${data.url}`);
    },
};
// Help text
const showHelp = () => {
    console.log(`
${colors.cyan}${colors.bright}Gutenberg CLI${colors.reset} — Generate HTML from semantic YAML specs

${colors.bright}Usage:${colors.reset}
  gutenberg <command> [options]

${colors.bright}Commands:${colors.reset}
  build <gutenberg.yaml>           Build entire project (auto-discovery, nav injection, full pipeline)
  publish <gutenberg.yaml>         Deploy to Cloudflare Pages (upload only, no build)
  deploy <gutenberg.yaml>          Full workflow (build + publish)
  lint <spec.yaml>                 Validate a spec for correctness
  scaffold <spec.yaml>             Build classless RenderNode tree
  enrich <spec.yaml>               Resolve CSS classes from roles/layout
  style <spec.yaml>                Generate HTML with theme CSS
  snapshot <spec.yaml> [opts]      Screenshot page (--width W --height H)
  list-projects                    List all Cloudflare Pages projects
  create-project <name>            Create new Cloudflare Pages project
  help                             Show this help text

${colors.bright}Examples:${colors.reset}
  gutenberg build examples/gutenberg.yaml
  gutenberg deploy examples/gutenberg.yaml
  gutenberg snapshot examples/landing-page.yaml --width 375 --height 667
  gutenberg lint examples/landing-page.yaml

${colors.bright}Paths:${colors.reset}
  All paths are resolved relative to your current working directory.
`);
};
// Main entry point
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command || command === "help" || command === "-h" || command === "--help") {
        showHelp();
        process.exit(command ? 0 : 1);
    }
    try {
        if (commands[command]) {
            await commands[command](args.slice(1));
        }
        else {
            console.error(`${colors.red}Error: Unknown command '${command}'${colors.reset}`);
            console.error(`Run ${colors.cyan}gutenberg help${colors.reset} for usage information`);
            process.exit(1);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${colors.red}Error:${colors.reset} ${message}`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map