/**
 * PUBLISH Stage — Write output to disk
 *
 * Takes HTML string + output path → writes to file
 * Returns path to written file
 */
export interface PublishOutput {
    html_path: string;
}
/**
 * Write HTML to disk at the specified output directory
 *
 * @param html Complete HTML document string
 * @param outputDir Directory to write to (will be created if missing)
 * @param specPath Original spec file path (used to derive output filename)
 * @returns Object with html_path pointing to written file
 */
export declare function publish(html: string, outputDir: string, specPath: string): Promise<PublishOutput>;
//# sourceMappingURL=publish.d.ts.map