/**
 * plan() — target-agnostic presentation planning.
 *
 * Resolves a PageSpec into a CompilePlan with all presentation decisions
 * made: enrichment, gap computation, cohesion detection. The plan can
 * be consumed by any render engine.
 *
 * Pipeline: PageSpec → enrich() → computeGaps() → CompilePlan
 */

import type { PageSpec, SpecBlock, HeroSpec, SuperheroSpec } from "./specs/page/index.js";
import { blockType, blockValue, normalizeBlock } from "./specs/page/index.js";
import type { Separation } from "./specs/page/semantics.js";
import {
  COHESION_TOKENS,
  inferCohesion,
  getBlockCohesion,
} from "./specs/page/semantics.js";

import { enrich } from "./enrich.js";
import type { CompilePlan, GapDecision, PlanOptions } from "./backend.js";

// ── Gap scale (abstract units, ~1 unit = 1rem in HTML5) ─────

const GAP_SCALE: Record<string, Record<Separation, number>> = {
  tight:    { tight: 0.75, standard: 1,   spacious: 1.25 },
  standard: { tight: 1.25, standard: 2,   spacious: 2.5  },
  spacious: { tight: 2,    standard: 3,   spacious: 4    },
};

const DEFAULT_GAP: Record<Separation, number> = {
  tight: 1.25,
  standard: 2,
  spacious: 3,
};

// ── Plan ────────────────────────────────────────────────────

/** Resolve a PageSpec into a target-agnostic CompilePlan. */
export function plan(
  spec: import("./specs/page/index.js").PageSpec,
  options: PlanOptions = {},
): CompilePlan {
  const enriched = enrich(spec);

  // Override separation if caller requests it
  const separation = options.separation ?? enriched.separation;

  // Detect cohesion from page axes or per-block declarations
  const hasCohesion = !!(
    spec.pace ||
    spec.weight ||
    enriched.contentBlocks.some((b) => {
      const v = blockValue(b);
      return (
        v != null &&
        typeof v === "object" &&
        "cohesion" in (v as Record<string, unknown>)
      );
    })
  );

  // Compute inter-block gaps
  const gaps = computeGaps(enriched.contentBlocks, separation, hasCohesion);

  // Resolve frame blocks with title fallbacks
  const hero = resolveHero(spec);
  const superhero = resolveSuperhero(spec);
  const closing = spec.closing ? ({ closing: spec.closing } as SpecBlock) : undefined;

  // Compute spec.blocks → contentBlocks index mapping for edit mode.
  // Frame blocks are extracted by enrich(); we need to know which
  // spec.blocks index each content block came from.
  const specIndices: number[] = [];
  let heroSpecIndex: number | undefined;
  let closingSpecIndex: number | undefined;
  {
    const normalizedBlocks = spec.blocks.map(normalizeBlock);
    let contentIdx = 0;
    for (let si = 0; si < normalizedBlocks.length; si++) {
      const type = blockType(normalizedBlocks[si]);
      if (type === "hero" && spec.hero) { heroSpecIndex = si; continue; }
      if (type === "superhero" && spec.superhero) { continue; }
      if (type === "closing" && spec.closing) { closingSpecIndex = si; continue; }
      specIndices.push(si);
      contentIdx++;
    }
  }

  // Resolve metadata
  const title = spec.title ?? superhero?.title ?? hero?.title ?? "Untitled";
  const heroBody = spec.superhero?.body ?? spec.hero?.body;
  const description = heroBody
    ? truncateAtWord(heroBody.replace(/\s+/g, " ").trim(), 200)
    : undefined;

  return {
    spec,
    title,
    description,
    density: enriched.density,
    separation,
    emphasis: enriched.emphasis,
    shadow: enriched.shadow,
    align: enriched.align,
    theme: enriched.theme,
    contentBlocks: enriched.contentBlocks,
    specIndices,
    heroSpecIndex,
    closingSpecIndex,
    enrichments: enriched.blockEnrichments,
    gaps,
    showcase: enriched.showcase,
    hasCohesion,
    hero: hero ? ({ hero } as SpecBlock) : undefined,
    superhero: superhero ? ({ superhero } as SpecBlock) : undefined,
    closing,
  };
}

// ── Gap computation ─────────────────────────────────────────

function computeGaps(
  blocks: SpecBlock[],
  separation: Separation,
  hasCohesion: boolean,
): GapDecision[] {
  const gaps: GapDecision[] = [];
  const defaultGap = DEFAULT_GAP[separation];

  for (let i = 0; i < blocks.length - 1; i++) {
    if (!hasCohesion) {
      gaps.push({ size: defaultGap, divider: "none" });
      continue;
    }

    const cohesion =
      getBlockCohesion(blocks[i + 1]) ??
      inferCohesion(blocks[i], blocks[i + 1]);

    if (cohesion) {
      const tokens = COHESION_TOKENS[cohesion];
      const size = GAP_SCALE[tokens.spacing]?.[separation] ?? defaultGap;
      gaps.push({ size, divider: tokens.divider });
    } else {
      gaps.push({ size: defaultGap, divider: "none" });
    }
  }

  return gaps;
}

// ── Frame resolution ────────────────────────────────────────

function resolveHero(spec: PageSpec): HeroSpec | undefined {
  if (!spec.hero) return undefined;
  return {
    title: spec.hero.title ?? spec.title ?? "Untitled",
    categories: spec.hero.categories,
    body: spec.hero.body,
  };
}

function resolveSuperhero(spec: PageSpec): SuperheroSpec | undefined {
  if (!spec.superhero) return undefined;
  // Spread all fields from the frame, then override title fallback.
  // This preserves brutalist enhancements (taglines, descriptors, scroll_cta, grid)
  // that the YAML parser passes through on spec.superhero.
  const frame = spec.superhero as Record<string, unknown>;
  return {
    ...frame,
    title: spec.superhero.title ?? spec.title ?? "Untitled",
  } as SuperheroSpec;
}

function truncateAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const truncated = s.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > max * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "\u2026";
}
