#!/usr/bin/env bun
import { resolve } from "path";
import { cwd } from "process";
// Static imports for all handlers
import { handler as buildHandler } from "../tools/build/index.js";
import { handler as publishHandler } from "../tools/publish/index.js";
import { handler as lintHandler } from "../tools/lint/index.js";
import { handler as snapshotHandler } from "../tools/snapshot/index.js";
import { handler as listProjectsHandler } from "../tools/list_projects/index.js";
import { handler as createProjectHandler } from "../tools/create_project/index.js";
// Handler registry
const handlerRegistry = {
    build: buildHandler,
    publish: publishHandler,
    lint: lintHandler,
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
// Resolve path relative to cwd()
const resolvePath = (path) => resolve(cwd(), path);
// CLI command handlers
const commands = {
    async build(args) {
        const projectDir = args[0];
        if (!projectDir) {
            console.error(`${colors.red}Error: project_dir required${colors.reset}`);
            console.error("Usage: gutenberg build <project-dir>");
            process.exit(1);
        }
        const result = await getHandler("build")({ project_dir: resolvePath(projectDir) });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Built ${data.pages_built ?? "?"} pages → ${data.site_dir}`);
    },
    async publish(args) {
        const projectDir = args[0];
        if (!projectDir) {
            console.error(`${colors.red}Error: project_dir required${colors.reset}`);
            console.error("Usage: gutenberg publish <project-dir>");
            process.exit(1);
        }
        const result = await getHandler("publish")({ project_dir: resolvePath(projectDir) });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Published: ${data.project_name}`);
        if (data.url)
            console.log(`${colors.cyan}${colors.bright}Live URL:${colors.reset} ${data.url}`);
    },
    async deploy(args) {
        const projectDir = args[0];
        if (!projectDir) {
            console.error(`${colors.red}Error: project_dir required${colors.reset}`);
            console.error("Usage: gutenberg deploy <project-dir>");
            process.exit(1);
        }
        const resolved = resolvePath(projectDir);
        console.log(`${colors.cyan}Building...${colors.reset}`);
        await getHandler("build")({ project_dir: resolved });
        console.log(`${colors.cyan}Publishing...${colors.reset}`);
        const result = await getHandler("publish")({ project_dir: resolved });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Deployed: ${data.project_name}`);
        if (data.url)
            console.log(`${colors.cyan}${colors.bright}Live URL:${colors.reset} ${data.url}`);
    },
    async lint(args) {
        const specPath = args[0];
        if (!specPath) {
            console.error(`${colors.red}Error: path required${colors.reset}`);
            console.error("Usage: gutenberg lint <spec.yaml | directory>");
            process.exit(1);
        }
        const result = await getHandler("lint")({ filePath: resolvePath(specPath) });
        const data = unwrapResponse(result);
        console.log(JSON.stringify(data, null, 2));
    },
    async snapshot(args) {
        const specPath = args[0];
        if (!specPath) {
            console.error(`${colors.red}Error: spec_path required${colors.reset}`);
            console.error("Usage: gutenberg snapshot <spec.yaml> [--width W] [--height H]");
            process.exit(1);
        }
        let width = 1440, height = 900;
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
        const result = await getHandler("snapshot")({ spec_path: resolvePath(specPath), width, height });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Screenshot: ${data.image_path}`);
    },
    async "list-projects"() {
        const result = await getHandler("list_projects")({});
        const data = unwrapResponse(result);
        if (data.projects?.length) {
            for (const p of data.projects) {
                console.log(`  ${colors.green}•${colors.reset} ${p.name} — ${colors.dim}${p.url}${colors.reset}`);
            }
        }
        else {
            console.log("No projects found");
        }
    },
    async "create-project"(args) {
        const name = args[0];
        if (!name) {
            console.error(`${colors.red}Error: project_name required${colors.reset}`);
            process.exit(1);
        }
        const result = await getHandler("create_project")({ project_name: name });
        const data = unwrapResponse(result);
        console.log(`${colors.green}✓${colors.reset} Created: ${data.project_name}`);
    },
};
const showHelp = () => {
    console.log(`
${colors.cyan}${colors.bright}Gutenberg CLI${colors.reset} — Generate HTML from semantic YAML specs

${colors.bright}Commands:${colors.reset}
  build <project-dir>              Build all pages in project
  publish <project-dir>            Deploy to Cloudflare Pages
  deploy <project-dir>             Build + publish
  lint <spec.yaml | directory>     Validate spec(s)
  snapshot <spec.yaml> [opts]      Screenshot (--width W --height H)
  list-projects                    List CF Pages projects
  create-project <name>            Create CF Pages project
  help                             Show this help
`);
};
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
            console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
            showHelp();
            process.exit(1);
        }
    }
    catch (error) {
        console.error(`${colors.red}Error:${colors.reset} ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map