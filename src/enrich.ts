/**
 * Enrichment layer — the editorial voice of the rendering system.
 *
 * Sits between the semantic PageSpec and the renderer. Reads the structural
 * profile of the page and injects ALL presentation decisions that the spec
 * author never sees. The spec stays purely semantic; presentation taste
 * lives here.
 *
 * The enriched output is internal to gutenberg — it never appears in YAML,
 * never in the type system, never in agent-facing documentation.
 *
 * Pipeline:  PageSpec → enrich() → EnrichedPage → compile() → HTML5
 *
 * Enrichment resolves:
 *   - Page-level axes: pace → density/separation, weight → emphasis/shadow
 *   - Page alignment: inferred from page type (superhero → center)
 *   - Showcase flags: texture, mesh, particles based on page profile
 *   - Per-block presentation: cols, highlight, compact, animation
 *   - Cross-block color coordination: cohesion → sequence resolution
 */

import type {
  PageSpec,
  SpecBlock,
  CardsSpec,
  StatSpec,
  ProseSpec,
} from "./specs/page/index.js";
import { blockType, blockValue, normalizeBlock } from "./specs/page/index.js";
import type { Separation, Emphasis, Shadow } from "./specs/page/semantics.js";
import {
  PACE_TOKENS,
  WEIGHT_TOKENS,
  resolveDensity,
  resolveSeparation,
  resolveTableCompact,
  buildSequenceManifest,
  injectSequenceColors,
} from "./specs/page/semantics.js";
import { resolveTheme } from "./chromata/themes.js";
import type { ThemeTokens } from "./chromata/themes.js";
import { resolveSequence } from "./chromata/sequence.js";
import { tonalEnrich } from "./tonal-enrich.js";

// ── Enriched types (renderer-internal) ───────────────────────

/** Page-level showcase flags. */
export interface ShowcaseFlags {
  /** Film-grain noise texture (SVG feTurbulence). */
  texture: boolean;
  /** Hero gets animated gradient mesh background. */
  heroMesh: boolean;
  /** Hero gets floating particle canvas. */
  heroParticles: boolean;
  /** Hero is full-viewport (100vh) immersive treatment. */
  heroFull: boolean;
  /** Inferred glyph set for floating particles. Undefined = default letters. */
  particleGlyphs?: string;
}

/** Per-block presentation decisions. Keyed by block index in the content array. */
export interface BlockEnrichment {
  // ── Showcase effects ──────────────────────────────────────
  /** Cards: glass surface treatment. */
  surface?: "glass";
  /** Cards: animated gradient border. */
  border?: "glow";
  /** Stats: animate counters on scroll-in. */
  animate?: boolean;
  /** Prose: text reveal animation mode. */
  reveal?: "words" | "lines";

  // ── Layout decisions ──────────────────────────────────────
  /** Cards/stat: resolved column count. */
  cols?: number;
  /** Table: compact padding. */
  compact?: boolean;
  /** Prose: tinted background treatment. */
  highlight?: boolean;
}

/** Fully-resolved presentation plan. Compile reads this — no further decisions needed. */
export interface EnrichedPage {
  spec: PageSpec;

  // ── Page-level resolved axes ──────────────────────────────
  density: "compact" | "standard" | "spacious";
  separation: Separation;
  emphasis: Emphasis;
  shadow: Shadow;
  align: "left" | "center";

  // ── Theme tokens (resolved once, shared) ──────────────────
  theme: ThemeTokens;

  // ── Showcase ──────────────────────────────────────────────
  showcase: ShowcaseFlags;

  // ── Per-block enrichments ─────────────────────────────────
  blockEnrichments: Map<number, BlockEnrichment>;

  // ── Content blocks (normalized, colors injected) ──────────
  /** Blocks with scalar shorthands expanded and sequence colors injected.
   *  Frame blocks (hero, superhero, closing) are excluded. */
  contentBlocks: SpecBlock[];
}

// ── Particle glyph inference ─────────────────────────────────

/** Glyph vocabularies keyed by content domain. */
const GLYPH_SETS: Record<string, string> = {
  finance:  "0123456789$%¢£€→±.·",
  api:      "{}[]<>/;:()=>?&|#_",
  data:     "01{}[]→←↑↓∅∞∑Δ≈≠",
  infra:    "▪▫◆◇●○→←↑↓⬡⎔▲△",
  ai:       "🧠🤖💡🔧⚡🎯🧩🔬✨🛠️🌀🏗️🎨📐🔮🪄🦾💎🔑🌊",
  default:  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz§¶†‡&",
};

/** Keyword patterns → glyph set. First match wins. */
const DOMAIN_SIGNALS: [RegExp, string][] = [
  [/\b(bill|invoice|payment|subscript|revenue|pricing|checkout|dunning|debt|charge|refund|credit|entitlement|usage|threshold)\b/i, "finance"],
  [/\b(api|endpoint|graphql|grpc|rest|webhook|handler|route|middleware|sdk)\b/i, "api"],
  [/\b(database|schema|table|column|migration|query|index|cache|store|queue|kafka|pubsub)\b/i, "data"],
  [/\b(deploy|cluster|node|container|docker|k8s|terraform|pipeline|canary|rollout)\b/i, "infra"],
  [/\b(ai|llm|model|agent|semantic|prompt|token|compaction|expressiveness|methodology|tooling|mcp)\b/i, "ai"],
];

/**
 * Infer a particle glyph set from the page's textual content.
 * Scans superhero, hero, and block text for domain signals.
 * Returns undefined when no strong signal — caller uses default.
 */
function inferParticleGlyphs(spec: PageSpec): string | undefined {
  // Collect all scannable text
  const parts: string[] = [];
  if (spec.superhero?.title) parts.push(spec.superhero.title);
  if (spec.superhero?.body) parts.push(spec.superhero.body);
  if (spec.superhero?.categories) parts.push(spec.superhero.categories.join(" "));
  if (spec.hero?.title) parts.push(spec.hero.title);
  if (spec.hero?.body) parts.push(spec.hero.body);
  if (spec.hero?.categories) parts.push(spec.hero.categories.join(" "));
  if (spec.title) parts.push(spec.title);

  // Scan block text (titles, bodies, labels — shallow extraction)
  for (const block of spec.blocks ?? []) {
    const val = blockValue(block);
    if (val && typeof val === "object") {
      const v = val as Record<string, unknown>;
      if (typeof v.text === "string") parts.push(v.text);
      if (typeof v.title === "string") parts.push(v.title);
      if (typeof v.body === "string") parts.push(v.body);
      if (typeof v.label === "string") parts.push(v.label);
      if (typeof v.text === "string") parts.push(v.text);
      if (Array.isArray(v.items)) {
        for (const item of v.items) {
          if (item && typeof item === "object") {
            const it = item as Record<string, unknown>;
            if (typeof it.title === "string") parts.push(it.title);
            if (typeof it.body === "string") parts.push(it.body);
            if (typeof it.label === "string") parts.push(it.label);
          }
        }
      }
    }
  }

  const corpus = parts.join(" ");

  // Score each domain by keyword hit count
  let bestDomain: string | undefined;
  let bestScore = 0;
  for (const [pattern, domain] of DOMAIN_SIGNALS) {
    const matches = corpus.match(new RegExp(pattern.source, "gi"));
    const score = matches?.length ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }

  // Require at least 2 hits to override default
  if (bestScore >= 2 && bestDomain) {
    return GLYPH_SETS[bestDomain];
  }
  return undefined;
}

// ── Enrichment entry point ───────────────────────────────────

/**
 * Enrich a PageSpec into a fully-resolved presentation plan.
 *
 * All editorial decisions live here. After enrichment, compile() is
 * mechanical: render blocks, assemble gaps, wrap document.
 */
export function enrich(spec: PageSpec): EnrichedPage {
  const scheme = spec.theme ?? "cloudflare";
  const theme = resolveTheme(scheme);
  const hasSuperhero = !!spec.superhero;
  const isHeavy = spec.weight === "heavy";

  // ── 1. Page-level axis resolution ─────────────────────────
  const density = resolveDensity(spec.pace);
  let separation: Separation = resolveSeparation(spec.pace);
  let emphasis: Emphasis = spec.emphasis ?? "standard";
  let shadow: Shadow = "none";

  if (spec.pace) {
    const pt = PACE_TOKENS[spec.pace];
    separation = pt.separation;
  }
  if (spec.weight) {
    const wt = WEIGHT_TOKENS[spec.weight];
    emphasis = spec.emphasis ?? wt.emphasis;
    shadow = wt.shadow;
  }

  // ── 2. Alignment inference ────────────────────────────────
  // Superhero pages center by default. Author's explicit align always wins.
  const align: "left" | "center" = spec.align ?? (hasSuperhero ? "center" : "left");

  // ── 3. Showcase flags ─────────────────────────────────────
  const showcase: ShowcaseFlags = {
    texture: hasSuperhero || isHeavy,
    heroMesh: hasSuperhero,
    heroParticles: hasSuperhero,
    heroFull: hasSuperhero,
    particleGlyphs: hasSuperhero
      ? (spec.superhero?.glyphs ?? inferParticleGlyphs(spec))
      : undefined,
  };

  // ── 4. Normalize blocks + separate frame from content ─────
  const blocks = spec.blocks.map(normalizeBlock);
  const contentBlocks = blocks.filter((b) => {
    const type = blockType(b);
    if (type === "hero" && spec.hero) return false;
    if (type === "superhero" && spec.superhero) return false;
    if (type === "closing" && spec.closing) return false;
    return true;
  });

  // ── 5. Tonal enrichment ─────────────────────────────────
  // Resolve semantic tone/progression to concrete item colors.
  // Runs before sequence coordination so tonally-enriched blocks
  // have item-level colors and don't participate in sequencing.
  tonalEnrich(contentBlocks, scheme);

  // ── 6. Cross-block color coordination ─────────────────────
  const hasCohesion = !!(
    spec.pace ||
    spec.weight ||
    contentBlocks.some((b) => {
      const v = blockValue(b);
      return v != null && typeof v === "object" && "cohesion" in (v as Record<string, unknown>);
    })
  );

  if (hasCohesion) {
    const { manifest, blockMap } = buildSequenceManifest(contentBlocks);
    if (manifest.length > 0) {
      const seqResult = resolveSequence(scheme, manifest, theme.shades);
      injectSequenceColors(contentBlocks, seqResult.blocks, blockMap);
    }
  }

  // ── 7. Per-block enrichment pass ──────────────────────────
  const blockEnrichments = new Map<number, BlockEnrichment>();

  let lastCardsIndex = -1;
  let firstIntroFound = false;
  let prevType: string | null = null;

  for (let i = 0; i < contentBlocks.length; i++) {
    const type = blockType(contentBlocks[i]);
    const val = blockValue(contentBlocks[i]);
    const enrichment: BlockEnrichment = {};
    let hasEnrichment = false;

    // ── Cards ───────────────────────────────────────────────
    if (type === "cards") {
      const cVal = val as CardsSpec;

      // Column inference: author's cols overrides, otherwise intelligent default
      enrichment.cols = cVal.cols ?? Math.min(cVal.items.length, 4);
      hasEnrichment = true;

      // Glass treatment on superhero pages or heavy-weight pages following section label
      if ((hasSuperhero || isHeavy) && prevType === "section_label") {
        enrichment.surface = "glass";
      }
      lastCardsIndex = i;
    }

    // ── Stat ────────────────────────────────────────────────
    if (type === "stat") {
      const sVal = val as StatSpec;
      enrichment.cols = Math.min(sVal.items.length, 4);
      enrichment.animate = true;
      hasEnrichment = true;
    }

    // ── Prose ───────────────────────────────────────────────
    if (type === "prose") {
      const pVal = val as ProseSpec;

      // Highlight inference:
      //   1. Intro prose on heavy-weight pages gets highlighted
      //   2. Prose between section_label and cards gets highlighted (breathing room)
      if (pVal.role === "intro" && isHeavy) {
        enrichment.highlight = true;
        hasEnrichment = true;
      }
    }

    // ── Table ───────────────────────────────────────────────
    if (type === "table") {
      enrichment.compact = resolveTableCompact(spec.pace);
      hasEnrichment = true;
    }

    if (hasEnrichment) {
      blockEnrichments.set(i, enrichment);
    }

    prevType = type;
  }

  // Last cards block on superhero or heavy-weight showcase pages: glow border + glass
  // Only when there's a single cards block (showcase pages).
  // Multiple cards blocks (landing pages) should have consistent treatment.
  if ((hasSuperhero || isHeavy) && lastCardsIndex >= 0) {
    const cardsCount = contentBlocks.filter((b) => blockType(b) === "cards").length;
    if (cardsCount === 1) {
      const existing = blockEnrichments.get(lastCardsIndex) ?? {};
      blockEnrichments.set(lastCardsIndex, {
        ...existing,
        surface: "glass",
        border: "glow",
      });
    }
  }

  return {
    spec,
    density,
    separation,
    emphasis,
    shadow,
    align,
    theme,
    showcase,
    blockEnrichments,
    contentBlocks,
  };
}
