import { promises as fs } from "fs";
import { dirname, join } from "path";
import YAML from "yaml";
export async function handler(input) {
    const projectPath = input.project_path;
    const templateName = input.name;
    const route = input.route;
    const param = input.param;
    // Validation
    if (!projectPath)
        throw new Error("'project_path' is required");
    if (!templateName)
        throw new Error("'name' is required");
    if (!route)
        throw new Error("'route' is required");
    if (!param)
        throw new Error("'param' is required");
    if (!/^\/[a-z0-9-/]*\[[a-z0-9-]+\]$/i.test(route)) {
        throw new Error(`Invalid route format: ${route}. Use format '/path/[param]'`);
    }
    if (!/^[a-z0-9-]+$/i.test(templateName)) {
        throw new Error(`Invalid template name: ${templateName}. Use lowercase alphanumeric and dashes`);
    }
    if (!/^[a-z0-9-]+$/i.test(param)) {
        throw new Error(`Invalid param: ${param}. Use lowercase alphanumeric and dashes`);
    }
    const projectRoot = dirname(projectPath);
    // Create directories
    const templatesDir = join(projectRoot, "templates");
    const functionsDir = join(projectRoot, "functions");
    const dataDir = join(projectRoot, "data");
    await fs.mkdir(templatesDir, { recursive: true });
    await fs.mkdir(functionsDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
    // Extract function path from route (e.g., '/diary/[date]' → 'diary')
    const functionPath = route.split("/")[1];
    const functionDir = join(functionsDir, functionPath);
    await fs.mkdir(functionDir, { recursive: true });
    // Create template file
    const templatePath = join(templatesDir, `${templateName}.yaml`);
    const templateContent = generateTemplate(templateName, route, param);
    await fs.writeFile(templatePath, templateContent, "utf8");
    // Create Worker function file
    const functionFile = join(functionDir, `[${param}].ts`);
    const functionContent = generateWorkerFunction(templateName, param);
    await fs.writeFile(functionFile, functionContent, "utf8");
    // Create/update wrangler.toml
    const wranglerPath = join(projectRoot, "wrangler.toml");
    await ensureWranglerConfig(wranglerPath);
    // Create local data directory
    const localDataDir = join(dataDir, templateName);
    await fs.mkdir(localDataDir, { recursive: true });
    // Update .gitignore
    await updateGitignore(projectRoot);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    template_path: templatePath,
                    function_path: functionFile,
                    wrangler_path: wranglerPath,
                    data_path: localDataDir,
                    message: `✅ Template '${templateName}' initialized!\n\nNext steps:\n1. Edit templates/${templateName}.yaml to define your structure\n2. Run: gutenberg build\n3. Run: wrangler pages dev ./rendered`,
                }, null, 2),
            },
        ],
    };
}
/**
 * Generate template YAML content
 */
function generateTemplate(name, route, param) {
    const templateContent = {
        template: {
            name,
            route,
            routeParam: param,
            storage: "r2",
        },
        page: {
            meta: {
                title: `{{${param.toUpperCase()}}}`,
                description: `Entry for {{${param.toUpperCase()}}}`,
            },
            sections: [
                {
                    type: "hero",
                    _editable: true,
                    content: {
                        heading: `Entry — {{${param.toUpperCase()}}}`,
                    },
                },
                {
                    type: "content",
                    _editable: true,
                    variant: "prose",
                    markdown: `# Notes\n\nAdd your content here.`,
                },
            ],
        },
    };
    return YAML.stringify(templateContent);
}
/**
 * Generate Worker function code
 */
function generateWorkerFunction(templateName, param) {
    return `/**
 * Worker function for ${templateName} template
 * 
 * Handles GET (view/edit) and POST (save) requests
 * Uses Gutenberg utilities to render and save entries
 */

import { createEditHandler } from '../../../../src/workers/index.js';

interface Env {
  DIARY_BUCKET: R2Bucket;
}

/**
 * Main request handler
 * GET /?mode=view (default) - Show entry
 * GET /?mode=edit - Edit form
 * POST /?mode=save - Save entry
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { ${param}: string };
}) {
  return createEditHandler({
    templateKey: 'template.yaml',
    bucket: context.env.DIARY_BUCKET,
    routeParam: '${param}',
    paramValidator: (value) => {
      // Customize validation for your parameter
      // Example for dates: /^\\d{4}-\\d{2}-\\d{2}$/.test(value)
      return value.length > 0;
    },
  })(context);
}
`;
}
/**
 * Ensure wrangler.toml exists with proper configuration
 */
async function ensureWranglerConfig(wranglerPath) {
    try {
        await fs.access(wranglerPath);
        // File exists, don't overwrite
        return;
    }
    catch {
        // File doesn't exist, create it
    }
    const config = `name = "gutenberg-site"
type = "service"
compatibility_date = "2024-09-23"

# Pages Functions output directory
pages_build_output_dir = "rendered"

# R2 bucket binding for template storage
[[r2_buckets]]
binding = "DIARY_BUCKET"
bucket_name = "my-bucket"

[build]
command = "echo 'Static Pages build'"
`;
    await fs.writeFile(wranglerPath, config, "utf8");
}
/**
 * Update .gitignore to exclude Gutenberg and data directories
 */
async function updateGitignore(projectRoot) {
    const gitignorePath = join(projectRoot, ".gitignore");
    const entriesToAdd = [
        ".gutenberg-edit/",
        "data/",
        "node_modules/",
        ".env",
        "*.db",
    ];
    let content = "";
    try {
        content = await fs.readFile(gitignorePath, "utf8");
    }
    catch {
        // File doesn't exist, will create new
    }
    const lines = new Set(content.split("\n").map((l) => l.trim()).filter((l) => l));
    for (const entry of entriesToAdd) {
        lines.add(entry);
    }
    const updated = Array.from(lines)
        .sort()
        .join("\n") + "\n";
    await fs.writeFile(gitignorePath, updated, "utf8");
}
//# sourceMappingURL=index.js.map