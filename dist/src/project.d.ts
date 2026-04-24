/**
 * Project-level utilities (legacy compat)
 *
 * Most project operations are now in project-config.ts and build.ts.
 * This file keeps utilities used by snapshot and other tools.
 */
/**
 * Find the project root by walking up looking for _site.yaml, _project.yaml, or gutenberg.yaml.
 */
export declare function findProjectRoot(specPath: string): Promise<string>;
/**
 * Get the output directory for a project (.site/ for new pipeline).
 */
export declare function getSiteDir(specPath: string): Promise<string>;
/**
 * Get the artifact path for a given spec and stage.
 */
export declare function getArtifactPath(specPath: string, stage: "lint" | "html" | "png"): Promise<string>;
/**
 * Discover all YAML page specs in a project directory (recursively).
 */
export declare function discoverPages(projectDir: string): Promise<string[]>;
//# sourceMappingURL=project.d.ts.map