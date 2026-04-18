/**
 * Gutenberg Library Exports
 * 
 * Core rendering pipeline and Workers edit mode utilities
 * For use in Cloudflare Pages Functions and other environments
 */

// Export core pipeline stages (lint, scaffold, enrich, style)
export { lint } from "./pipeline/lint.js";
export { scaffold } from "./pipeline/scaffold.js";
export { enrich } from "./pipeline/enrich.js";
export { style } from "./pipeline/style.js";

// Export Workers utilities for edit mode
export { createEditHandler } from "./workers/index.js";
export type { EditHandlerConfig } from "./workers/index.js";

// Export types for page schemas
export type {
  PageSchema,
  TemplateSchema,
  TemplateConfig,
  PageMeta,
  PageLayout,
  Section,
  RenderOptions,
} from "./types.js";

// Export type guards
export { isPageSchema, isTemplateSchema } from "./types.js";

// Export component types and extractors
export {
  extractHeroData,
  extractFeaturesData,
  extractContentData,
  extractCtaData,
  extractNavigationData,
  extractFooterData,
} from "./components/index.js";

export type {
  HeroData,
  FeaturesData,
  ContentData,
  CtaData,
  NavigationData,
  FooterData,
} from "./components/index.js";

// Export core utilities
export { enrichRenderNodes, enrichRenderNode } from "./enricher.js";
export { parseSchema } from "./parser.js";
export { validateSchema } from "./validator.js";

// Export RenderNode types
export type { RenderNode, AnnotatedNode } from "./scaffold/node.js";
