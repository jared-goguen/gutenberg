/**
 * Project-level utilities
 *
 * Shared logic for finding project roots, artifact paths, and auto-discovery
 */
import type { TemplateSchema } from "./types.js";
import { validateTemplate } from "./validator.js";
export interface ProjectConfig {
    project: {
        name: string;
    };
}
export interface PageInfo {
    spec_path: string;
    title: string;
    href: string;
}
/**
 * Find the project root by walking up from spec_path looking for gutenberg.yaml
 * Falls back to the spec's directory if no project config found
 */
export declare function findProjectRoot(specPath: string): Promise<string>;
/**
 * Get the rendered directory for a spec (always {projectRoot}/rendered)
 */
export declare function getRenderedDir(specPath: string): Promise<string>;
/**
 * Get the artifact path for a given spec and stage
 */
export declare function getArtifactPath(specPath: string, stage: "lint" | "scaffold" | "enrich" | "html" | "png"): Promise<string>;
/**
 * Discover all page specs in a project (recursively)
 * Excludes gutenberg.yaml itself
 */
export declare function discoverPages(projectPath: string): Promise<string[]>;
/**
 * Parse a project config file
 */
export declare function parseProjectConfig(projectPath: string): Promise<ProjectConfig>;
/**
 * Build a flat navigation structure from all pages in a project
 * Returns [{text, href}] where text is page title and href is the URL path
 */
export declare function buildNavStructure(pages: string[], projectRoot: string): Promise<Array<{
    text: string;
    href: string;
}>>;
/**
 * Discover all template files in the project
 * Templates are YAML files in templates/ directory
 */
export declare function discoverTemplates(projectRoot: string): Promise<string[]>;
/**
 * Parse a template file and validate it
 */
export declare function parseTemplate(templatePath: string): Promise<{
    schema: TemplateSchema;
    validation: ReturnType<typeof validateTemplate>;
}>;
/**
 * Template metadata for code generation
 */
export interface TemplateMetadata {
    name: string;
    route: string;
    routeParam: string;
    storage: "local" | "r2";
    templatePath: string;
}
/**
 * Extract metadata from all templates in a project
 */
export declare function getTemplateMetadata(projectRoot: string): Promise<TemplateMetadata[]>;
//# sourceMappingURL=project.d.ts.map