/**
 * Page spec types, schemas, YAML I/O, semantics, and linting.
 */

// Core types — wildcard re-export for full backwards compatibility
export * from "./types.js";

// Re-export meta-spec core types
export type { SpecKind, MetaSpec } from "../meta/index.js";
export { SPEC_KINDS } from "../meta/index.js";

// Schema
export type { SchemaIssue, FieldDef, BlockSchema, FieldType } from "./schema.js";
export { BLOCK_SCHEMAS, FRAME_SCHEMAS, validateBlockFields, validateFrameFields } from "./schema.js";

// YAML I/O
export { fromYaml, toYaml, readKind, validateSpec } from "./yaml.js";

// Lint
export { lint, lintProject } from "./lint.js";
export type { LintIssue, LintOptions, ProjectLintOptions } from "./lint.js";

// Semantics
export {
  PACE_TOKENS,
  WEIGHT_TOKENS,
  COHESION_TOKENS,
  COHESION_TO_ROLE,
  resolveSeparation,
  resolveDensity,
  resolveTableWidths,
  resolveTableCompact,
  buildSequenceManifest,
  inferCohesion,
  getBlockCohesion,
  injectSequenceColors,
} from "./semantics.js";

// Sanitize
export { sanitizeSpec, sanitizeText, lintSpec as lintSanitize } from "./sanitize.js";

// Convention
export {
  inferRole,
  extractLinks,
  buildPageTree,
  deriveNavCards,
  deriveSidebarNav,
  validateConvention,
} from "./convention.js";
export type { PageRole, ConventionIssue, ConventionOverrides, DerivedCard, NavNode, PageNode } from "./convention.js";

// Resolved types
export type { ResolvedColor, ColorValue, ResolvedCardItem, ResolvedFlowStep, ResolvedBadgeItem } from "./resolved.js";
