/**
 * PUBLISH Stage — Write output to disk
 *
 * Takes HTML string + output path → writes to file
 * Returns path to written file
 */
import fs from "fs/promises";
import path from "path";
/**
 * Write HTML to disk at the specified output directory
 *
 * @param html Complete HTML document string
 * @param outputDir Directory to write to (will be created if missing)
 * @param specPath Original spec file path (used to derive output filename)
 * @returns Object with html_path pointing to written file
 */
export async function publish(html, outputDir, specPath) {
    // Create output directory if needed
    await fs.mkdir(outputDir, { recursive: true });
    // Derive output filename from spec path (e.g., examples/landing.yaml → landing.html)
    const specName = path.basename(specPath, path.extname(specPath));
    const html_path = path.join(outputDir, `${specName}.html`);
    // Validate HTML before writing
    if (!html || html.length < 100) {
        throw new Error("Generated HTML is too small or empty");
    }
    if (html.includes("<undefined>")) {
        throw new Error("Generated HTML contains undefined values");
    }
    // Write file
    await fs.writeFile(html_path, html, "utf8");
    return { html_path };
}
//# sourceMappingURL=publish.js.map