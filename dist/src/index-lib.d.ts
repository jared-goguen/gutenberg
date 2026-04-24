/**
 * Gutenberg Library Exports
 *
 * Core rendering pipeline and Workers edit mode utilities.
 * For use in Cloudflare Pages Functions and other environments.
 */
export { compile, compileYaml, plan } from "./compile.js";
export type { CompilePlan, RenderResult, RenderEngine, PlanOptions } from "./backend.js";
export { fromYaml, toYaml, validateSpec } from "./specs/page/yaml.js";
export { sanitizeSpec, lintSpec } from "./specs/page/sanitize.js";
export type { PageSpec, SpecBlock } from "./specs/page/types.js";
export { blockType, blockValue, normalizeBlock } from "./specs/page/types.js";
export { fromSiteYaml } from "./specs/site/yaml.js";
export type { SiteSpec, SpecEntry } from "./specs/site/types.js";
export { readProjectConfig, requireProjectConfig } from "./project-config.js";
export { wrapDocument } from "./document.js";
export type { DocumentOptions } from "./document.js";
export { createEditHandler } from "./workers/index.js";
export type { EditHandlerConfig } from "./workers/index.js";
//# sourceMappingURL=index-lib.d.ts.map