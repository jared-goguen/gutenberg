import puppeteer, { Browser } from "puppeteer";
import { promises as fs } from "fs";
import { basename, dirname, join } from "path";

export async function handler(input: Record<string, unknown>) {
  const html_path = input.html_path as string;
  const output_dir = (input.output_dir as string) || 
    join(dirname(dirname(html_path)), "snapshots");
  const width = (input.width as number) || 1440;
  const height = (input.height as number) || 900;

  if (!html_path) {
    throw new Error("'html_path' is required - provide an absolute path to a rendered HTML file");
  }

  let browser: Browser | null = null;

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

    // Create output directory
    await fs.mkdir(output_dir, { recursive: true });

    // Derive filename from input spec (strip .html, add .png)
    // Include viewport dimensions in filename to avoid overwrites when same HTML
    // is captured at different sizes to the same output directory
    const baseName = basename(html_path, ".html");
    const isDefaultViewport = width === 1440 && height === 900;
    const suffix = isDefaultViewport ? "" : `-${width}x${height}`;
    const image_path = join(output_dir, `${baseName}${suffix}.png`);

    // Capture full-page screenshot
    await page.screenshot({ path: image_path, fullPage: true });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ image_path }),
      }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Snapshot failed: ${errorMessage}`);
  } finally {
    // Always close browser
    if (browser) {
      await browser.close();
    }
  }
}
