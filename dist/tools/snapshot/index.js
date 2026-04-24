import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import { join, relative, dirname } from "path";
import { specKeyToOutputPath } from "../../src/build.js";
/**
 * Find the project root by walking up from spec_path looking for _site.yaml or _project.yaml.
 * Falls back to the spec's directory if no project config found.
 */
async function findProjectRoot(specPath) {
    let dir = dirname(specPath);
    while (true) {
        try {
            await fs.access(join(dir, "_site.yaml"));
            return dir;
        }
        catch { }
        try {
            await fs.access(join(dir, "_project.yaml"));
            return dir;
        }
        catch { }
        const parent = dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return dirname(specPath);
}
export async function handler(input) {
    const spec_path = input.spec_path;
    const width = input.width || 1440;
    const height = input.height || 900;
    if (!spec_path) {
        throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
    }
    // Derive HTML path from the new .site/ output convention
    const projectRoot = await findProjectRoot(spec_path);
    const specKey = relative(projectRoot, spec_path);
    const outputRelPath = specKeyToOutputPath(specKey);
    const html_path = join(projectRoot, ".site", "cloudflare-pages", outputRelPath);
    // Image goes alongside the HTML
    const image_path = html_path.replace(/\.html$/, ".png");
    let browser = null;
    try {
        // Read HTML from disk
        const html = await fs.readFile(html_path, "utf8");
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        // Create new page
        const page = await browser.newPage();
        // Set viewport dimensions
        await page.setViewport({ width, height });
        // Load HTML content
        await page.setContent(html, { waitUntil: "networkidle0" });
        // Capture full-page screenshot
        await page.screenshot({ path: image_path, fullPage: true });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ image_path }),
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Snapshot failed: ${errorMessage}`);
    }
    finally {
        // Always close browser
        if (browser) {
            await browser.close();
        }
    }
}
//# sourceMappingURL=index.js.map