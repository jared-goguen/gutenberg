/**
 * Gutenberg Workers Utilities
 *
 * Utilities and helpers for Cloudflare Pages Functions using Gutenberg.
 * Workers Functions can import from this module to render templates dynamically.
 *
 * Uses the new pipeline: fromYaml → sanitizeSpec → compile → wrapDocument.
 * Edit mode is currently stubbed — see src/pipeline/editify.ts.
 */
export { fromYaml, validateSpec } from '../specs/page/yaml.js';
export { sanitizeSpec } from '../specs/page/sanitize.js';
export { compile, compileYaml } from '../compile.js';
export { wrapDocument } from '../document.js';
export type { PageSpec, SpecBlock, } from '../specs/page/index.js';
import type { PageSpec } from '../specs/page/index.js';
/**
 * Configuration for createEditHandler
 */
export interface EditHandlerConfig {
    templateKey: string;
    bucket: R2Bucket;
    routeParam: string;
    paramValidator?: (value: string) => boolean;
    onSave?: (data: {
        param: string;
        yaml: string;
        spec: PageSpec;
    }) => Promise<void>;
}
/**
 * Create a Cloudflare Pages Function handler for edit mode templates
 *
 * Usage in functions/diary/[date].ts:
 *
 * import { createEditHandler } from 'gutenberg/workers';
 *
 * export const onRequest = createEditHandler({
 *   templateKey: 'template.yaml',
 *   bucket: env.DIARY_BUCKET,
 *   routeParam: 'date',
 *   paramValidator: (date) => /^\d{4}-\d{2}-\d{2}$/.test(date),
 * });
 */
export declare function createEditHandler(config: EditHandlerConfig): (context: any) => Promise<Response>;
//# sourceMappingURL=index.d.ts.map