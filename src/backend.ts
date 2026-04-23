/**
 * Backend types — the shared contract between plan() and render engines.
 *
 * CompilePlan is the target-agnostic intermediate representation.
 * plan() produces it, render engines consume it.
 */

import type { PageSpec, SpecBlock } from "./specs/page/index.js";
import type { ThemeTokens } from "./chromata/themes.js";
import type { Separation, Emphasis, Shadow } from "./specs/page/semantics.js";
import type { ShowcaseFlags, BlockEnrichment } from "./enrich.js";

export type { BlockEnrichment } from "./enrich.js";

/**
 * Target-agnostic compile plan. All presentation decisions are resolved —
 * renderers follow instructions, they don't make decisions.
 *
 * Produced by plan(). Consumed by compile() (HTML5) and future render engines.
 */
export interface CompilePlan {
  /** Original spec (for metadata — title, pageId, scheme, url, etc.) */
  spec: PageSpec;

  // ── Resolved page-level axes ──────────────────────────────
  density: "compact" | "standard" | "spacious";
  separation: Separation;
  emphasis: Emphasis;
  shadow: Shadow;
  align: "left" | "center";

  /** Theme tokens — resolved once, shared by all renderers. */
  theme: ThemeTokens;

  // ── Metadata ──────────────────────────────────────────────
  /** Resolved page title (fallback chain: title → superhero.title → hero.title → "Untitled"). */
  title: string;
  /** Page description for meta tags. Truncated from hero/superhero body. */
  description?: string;

  // ── Content ───────────────────────────────────────────────
  /** Content blocks with shorthands expanded and sequence colors injected.
   *  Frame blocks (hero, superhero, closing) are excluded. */
  contentBlocks: SpecBlock[];

  /** Mapping from contentBlocks index → original spec.blocks index.
   *  Needed by edit mode to generate correct form field names. */
  specIndices: number[];

  /** Original spec.blocks index of the hero frame, if extracted. */
  heroSpecIndex?: number;
  /** Original spec.blocks index of the closing frame, if extracted. */
  closingSpecIndex?: number;

  /** Per-block enrichment tokens. Keyed by index into contentBlocks. */
  enrichments: Map<number, BlockEnrichment>;

  // ── Gaps ──────────────────────────────────────────────────
  /** Inter-block gap decisions. Length = contentBlocks.length - 1.
   *  Each entry describes the gap between block[i] and block[i+1]. */
  gaps: GapDecision[];

  // ── Showcase ──────────────────────────────────────────────
  /** Showcase flags — progressive enhancement. HTML5 uses these;
   *  other targets may ignore them. */
  showcase: ShowcaseFlags;

  // ── Cohesion flag ─────────────────────────────────────────
  /** Whether cohesion-aware gaps were computed. */
  hasCohesion?: boolean;

  // ── Frame ─────────────────────────────────────────────────
  /** Hero block (with title resolved from spec). */
  hero?: SpecBlock;
  /** Superhero block (with title resolved from spec). */
  superhero?: SpecBlock;
  /** Closing block extracted from content. */
  closing?: SpecBlock;
}

/** Gap decision between two adjacent content blocks. */
export interface GapDecision {
  /** Gap size in abstract rem-equivalent units. */
  size: number;
  /** Divider type between blocks. */
  divider: "none" | "subtle" | "bold";
}

/** Options for plan(). */
export interface PlanOptions {
  /** Override separation (used by wiki compile). */
  separation?: Separation;
}

/** Output of a render pass. */
export interface RenderResult {
  html: string;
}

/**
 * Render engine contract.
 *
 * Engines consume a CompilePlan (target-agnostic) and produce a RenderResult.
 * The plan carries all presentation decisions — engines translate, they don't decide.
 *
 * What's IN CompilePlan (decided by plan()):
 *   - Page axes: density, separation, emphasis, shadow, align
 *   - Theme tokens (resolved colors from chromata)
 *   - Content blocks (shorthands expanded, sequence colors injected, frames extracted)
 *   - Per-block enrichments (tonal color, showcase flags)
 *   - Inter-block gap decisions (size in rem + divider type)
 *   - Showcase flags (texture, particles — engines may ignore)
 *   - Hero/closing frames
 *
 * What's NOT in CompilePlan (engine decides):
 *   - Link resolution strategy (URL paths vs page IDs)
 *   - Navigation rendering (sidebar vs Confluence nav)
 *   - Gap → markup translation (CSS margins vs XHTML spacing)
 *   - Block → markup translation (HTML tags vs storage format)
 *   - Document shell (HTML5 wrapper vs Confluence page update)
 */
export interface RenderEngine<Options = unknown> {
  render(plan: CompilePlan, options?: Options): RenderResult;
}
