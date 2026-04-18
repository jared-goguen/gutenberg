/**
 * Gutenberg Library Exports
 *
 * Core rendering pipeline and Workers edit mode utilities
 * For use in Cloudflare Pages Functions and other environments
 */
export { lint } from "./pipeline/lint.js";
export { scaffold } from "./pipeline/scaffold.js";
export { enrich } from "./pipeline/enrich.js";
export { style } from "./pipeline/style.js";
export { createEditHandler } from "./workers/index.js";
export type { EditHandlerConfig } from "./workers/index.js";
export type { PageSchema, TemplateSchema, TemplateConfig, PageMeta, PageLayout, Section, RenderOptions, } from "./types.js";
export { isPageSchema, isTemplateSchema } from "./types.js";
export { extractHeroData, extractFeaturesData, extractContentData, extractCtaData, extractNavigationData, extractFooterData, } from "./components/index.js";
export type { HeroData, FeaturesData, ContentData, CtaData, NavigationData, FooterData, } from "./components/index.js";
export { enrichRenderNodes, enrichRenderNode } from "./enricher.js";
export { parseSchema } from "./parser.js";
export { validateSchema } from "./validator.js";
export type { RenderNode, AnnotatedNode } from "./scaffold/node.js";
//# sourceMappingURL=index-lib.d.ts.map