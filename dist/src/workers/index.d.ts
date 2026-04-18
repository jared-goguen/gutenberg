/**
 * Gutenberg Workers Utilities
 *
 * Utilities and helpers for Cloudflare Pages Functions using Gutenberg
 * Workers Functions can import from this module to render templates dynamically
 */
export { lint, scaffold, enrich, style } from '../pipeline/index.js';
export type { PageSchema, TemplateSchema, TemplateConfig, PageMeta, PageLayout, Section, RenderOptions, } from '../types.js';
export { isPageSchema, isTemplateSchema } from '../types.js';
import type { PageSchema } from '../types.js';
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
        schema: PageSchema;
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