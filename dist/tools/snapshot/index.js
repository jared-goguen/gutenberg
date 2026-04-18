import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import { getArtifactPath } from "../../src/project.js";
export async function handler(input) {
    const spec_path = input.spec_path;
    const width = input.width || 1440;
    const height = input.height || 900;
    if (!spec_path) {
        throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
    }
    // Get artifact paths using convention
    const html_path = await getArtifactPath(spec_path, "html");
    const image_path = await getArtifactPath(spec_path, "png");
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