/**
 * Gutenberg Library Exports
 *
 * Core rendering pipeline and Workers edit mode utilities.
 * For use in Cloudflare Pages Functions and other environments.
 */
// Core pipeline
export { compile, compileYaml, plan } from "./compile.js";
// Spec parsing
export { fromYaml, toYaml, validateSpec } from "./specs/page/yaml.js";
export { sanitizeSpec, lintSpec } from "./specs/page/sanitize.js";
export { blockType, blockValue, normalizeBlock } from "./specs/page/types.js";
// Site spec
export { fromSiteYaml } from "./specs/site/yaml.js";
// Project config
export { readProjectConfig, requireProjectConfig } from "./project-config.js";
// Document wrapper
export { wrapDocument } from "./document.js";
// Workers edit mode utilities
export { createEditHandler } from "./workers/index.js";
//# sourceMappingURL=index-lib.js.map