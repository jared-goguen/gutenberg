/**
 * Site enrichment — resolves structural signals into navigation chrome flags.
 *
 * Mirrors the page enrichment pattern (enrich.ts) but operates at site level.
 * Runs once per build, examines SiteSpec + nav tree + page count, produces
 * a resolved SiteChrome that the page-level pipeline consumes mechanically.
 *
 * Pipeline: SiteSpec + SpecEntry[] → enrichSite() → SiteChrome
 *           SiteChrome + per-page data → page enrichment / rendering
 *
 * Decision principles:
 *   - Features are ON by default when the data exists and the target supports them.
 *   - SiteSpec.chrome overrides any inferred decision.
 */

import type { SiteSpec, ChromeOverrides, TargetName } from "./specs/site/index.js";
import type { SiteNav } from "./site-nav.js";

// ── SiteChrome type ──────────────────────────────────────────

/**
 * Resolved site-level navigation chrome — the site equivalent of ShowcaseFlags.
 *
 * Every field is a concrete decision. The renderer checks these flags
 * instead of making ad-hoc decisions about feature availability.
 */
export interface SiteChrome {
  /** Emit right-rail "On This Page" TOC for pages with enough sections. */
  rightRailToc: { enabled: boolean; minSections: number };
  /** Emit prev/next footer links. */
  pageFooter: boolean;
  /** Emit breadcrumb trail (nav tree depth > 1). */
  breadcrumbs: boolean;
  /** Emit view-transition meta tag and CSS (cross-page morphing). */
  viewTransitions: boolean;
  /** Emit reading progress bar (CSS scroll-driven animation). */
  progressBar: boolean;
  /** Silent URL hash sync from scroll spy. */
  hashSync: boolean;
  /** Build client-side search index. */
  search: boolean;
}

// ── enrichSite() ─────────────────────────────────────────────

/** Compute max depth of the nav tree. */
function navDepth(nav: SiteNav): number {
  let max = 0;
  for (const section of nav.sections) {
    max = Math.max(max, 1);
    if (section.subsections) {
      for (const _sub of section.subsections) {
        max = Math.max(max, 2);
      }
    }
  }
  return max;
}

/**
 * Enrich a SiteSpec into resolved navigation chrome flags.
 *
 * @param siteSpec   The site's declarative identity (may be null for standalone pages).
 * @param pageCount  Total number of pages in the project.
 * @param navTree    Resolved navigation tree.
 * @param target     Current deploy target — all targets get web features in this port.
 */
export function enrichSite(
  siteSpec: SiteSpec | null,
  pageCount: number,
  navTree: SiteNav,
  target: TargetName,
): SiteChrome {
  const isWeb = target === "cloudflare-pages" || target === "wrangler";
  const depth = navDepth(navTree);
  const overrides = siteSpec?.chrome;

  return {
    rightRailToc: {
      enabled: apply(overrides?.right_rail, isWeb),
      minSections: 3,
    },
    pageFooter: apply(overrides?.page_footer, isWeb && pageCount > 1),
    breadcrumbs: apply(overrides?.breadcrumbs, isWeb && depth > 1),
    viewTransitions: apply(overrides?.view_transitions, isWeb),
    progressBar: apply(overrides?.progress_bar, isWeb),
    hashSync: apply(overrides?.hash_sync, isWeb),
    search: apply(overrides?.search, isWeb && pageCount >= 8),
  };
}

/**
 * Apply an optional override to an inferred default.
 * `undefined` → use default. `true`/`false` → force.
 */
function apply(override: boolean | undefined, inferred: boolean): boolean {
  return override !== undefined ? override : inferred;
}
