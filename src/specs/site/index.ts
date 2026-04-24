/**
 * Site spec — identity, navigation, graph, and governance for page collections.
 */

// Types
export * from "./types.js";

// YAML I/O
export { fromSiteYaml } from "./yaml.js";

// Navigation resolution
export { resolveSiteNav } from "./nav.js";

// Graph resolution
export { resolveGraph } from "./graph.js";

// Spec key utilities
export {
  isIndex,
  sectionOf,
  slugOf,
  specKeyToUrlPath,
  resolveLink,
  contentHash,
  toSpecEntry,
} from "./keys.js";

// Lint
export { lint } from "./lint.js";
export type { LintIssue } from "./lint.js";
