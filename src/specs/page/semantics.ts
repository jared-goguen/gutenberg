/**
 * Semantic axis resolution and cross-block color coordination.
 *
 * Resolves PageSpec semantic axes (Pace, Weight, Cohesion) to abstract tokens,
 * then coordinates cross-block color assignment via chromata's sequence system.
 */

import type {
  Pace,
  Weight,
  Cohesion,
  ColumnSize,
  SpecBlock,
  CardsSpec,
  FlowChainSpec,
  BadgeSpec,
} from "./types.js";
import { blockType, blockValue } from "./types.js";
import type {
  PaletteRole,
  SequenceBlock,
} from "../../chromata/sequence.js";
import type { ColorDef } from "../../chromata/palette.js";
import type { ColorValue } from "./resolved.js";

// ── Semantic axis types ──────────────────────────────────────

/** Inter-block spacing level. Resolved from Pace or explicit spec field. */
export type Separation = "tight" | "standard" | "spacious";

/** Card/table accent border weight. Resolved from Weight or explicit spec field. */
export type Emphasis = "subtle" | "standard" | "bold";

/** Shadow depth. Resolved from Weight axis. */
export type Shadow = "none" | "subtle" | "deep";

/** Cohesion → inter-block rendering tokens (abstract — no pixel values). */
export interface CohesionTokens {
  spacing: "tight" | "standard" | "spacious";
  divider: "none" | "subtle" | "bold";
  bgShift: boolean;
}

// ── Semantic axis resolution ─────────────────────────────────

/** Pace resolves to density + separation tokens. */
export const PACE_TOKENS: Record<Pace, { density: "compact" | "standard" | "spacious"; separation: Separation }> = {
  open:     { density: "spacious", separation: "spacious" },
  balanced: { density: "standard", separation: "standard" },
  dense:    { density: "compact",  separation: "tight" },
};

/** Weight resolves to emphasis + shadow tokens. */
export const WEIGHT_TOKENS: Record<Weight, { emphasis: Emphasis; shadow: Shadow }> = {
  light:   { emphasis: "subtle",   shadow: "none" },
  regular: { emphasis: "standard", shadow: "subtle" },
  heavy:   { emphasis: "bold",     shadow: "deep" },
};

/** Cohesion resolves to inter-block rendering tokens. */
export const COHESION_TOKENS: Record<Cohesion, CohesionTokens> = {
  continues: { spacing: "tight",    divider: "none",   bgShift: false },
  supports:  { spacing: "standard", divider: "none",   bgShift: false },
  contrasts: { spacing: "standard", divider: "subtle", bgShift: true },
  pivots:    { spacing: "spacious", divider: "bold",   bgShift: true },
  resolves:  { spacing: "standard", divider: "subtle", bgShift: false },
};

// ── Cohesion inference ───────────────────────────────────────

/** Block types that provide visual rhythm (break prose monotony). */
const VISUAL_BLOCK_TYPES = new Set([
  "cards", "table", "flow_chain", "badge", "swatch_strip", "info_box", "toc",
]);

/**
 * Infer cohesion from block type transitions.
 * Returns null for section boundaries and transitions where legacy/renderer-specific rules apply.
 */
export function inferCohesion(prev: SpecBlock, next: SpecBlock): Cohesion | null {
  const p = blockType(prev);
  const n = blockType(next);

  // Section boundaries — handled separately
  if (p === "section_label" || n === "section_label") return null;
  if (p === "hero") return null;
  if (n === "closing") return "resolves";

  // Structural pass-through — not content relationships
  if (p === "spacer" || p === "divider") return null;

  // Prose → visual block = supports (cards, tables, etc. illustrate what prose describes).
  // Prose → prose = continues (same narrative thread).
  if (p === "prose") {
    if (VISUAL_BLOCK_TYPES.has(n)) return "supports";
    return "continues";
  }
  if (p === "cards") {
    if (n === "flow_chain") return "supports";
    return "continues";
  }
  if (p === "flow_chain") return "continues";

  return null;
}

/** Extract explicit cohesion from a block's value (if declared). */
export function getBlockCohesion(block: SpecBlock): Cohesion | undefined {
  const val = blockValue(block);
  if (val && typeof val === "object" && "cohesion" in (val as Record<string, unknown>)) {
    return (val as Record<string, unknown>).cohesion as Cohesion;
  }
  return undefined;
}

// ── Cross-block color coordination ───────────────────────────

/** Cohesion → chromata sequence role for color resolution. */
export const COHESION_TO_ROLE: Record<Cohesion, PaletteRole> = {
  continues: "extend",
  supports:  "mute",
  contrasts: "complement",
  pivots:    "reset",
  resolves:  "converge",
};

/** Block types that participate in color sequencing (have items with colors). */
export const COLORABLE_BLOCK_TYPES = new Set(["cards", "flow_chain", "badge"]);

/** Count colorable items in a block. Returns 0 for non-colorable blocks. */
export function countColorableItems(block: SpecBlock): number {
  const type = blockType(block);
  const val = blockValue(block);
  if (!COLORABLE_BLOCK_TYPES.has(type) || !val) return 0;
  if (type === "cards") return ((val as CardsSpec).items ?? []).length;
  if (type === "flow_chain") return ((val as FlowChainSpec).steps ?? []).length;
  if (type === "badge") return ((val as BadgeSpec).items ?? []).length;
  return 0;
}

/**
 * Check if a colorable block has explicit color intent.
 * Blocks with palette, tone, or progression opt out of sequence coordination.
 */
export function hasExplicitScheme(block: SpecBlock): boolean {
  const val = blockValue(block);
  if (!val || typeof val !== "object") return false;
  const v = val as Record<string, unknown>;
  return !!(v.palette || v.tone || v.progression);
}

/**
 * Build a SequenceBlock manifest from content blocks.
 * Only includes colorable blocks without explicit palettes.
 * Returns the manifest and a mapping from manifest index → content block index.
 */
export function buildSequenceManifest(
  blocks: SpecBlock[],
): { manifest: SequenceBlock[]; blockMap: Map<number, number> } {
  const manifest: SequenceBlock[] = [];
  const blockMap = new Map<number, number>();

  let isFirst = true;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const count = countColorableItems(block);
    if (count === 0) continue;
    if (hasExplicitScheme(block)) continue;

    let role: PaletteRole;
    if (isFirst) {
      role = "start";
      isFirst = false;
    } else {
      const explicit = getBlockCohesion(block);
      if (explicit) {
        role = COHESION_TO_ROLE[explicit];
      } else if (i > 0) {
        const inferred = inferCohesion(blocks[i - 1], block);
        role = inferred ? COHESION_TO_ROLE[inferred] : "extend";
      } else {
        role = "extend";
      }
    }

    blockMap.set(manifest.length, i);
    manifest.push({ count, role });
  }

  return { manifest, blockMap };
}

// ── Pace → mechanical token resolvers ─────────────────────────

/** Resolve page-level pace to inter-block separation. */
export function resolveSeparation(pace?: Pace): Separation {
  if (!pace) return "standard";
  return PACE_TOKENS[pace].separation;
}

/** Resolve page-level pace to card/table padding density. */
export function resolveDensity(pace?: Pace): "compact" | "standard" | "spacious" {
  if (!pace) return "standard";
  return PACE_TOKENS[pace].density;
}

// ── Semantic sizing resolution ────────────────────────────────

/** Base percentages for column sizing hints. */
const COLUMN_SIZE_BASE: Record<ColumnSize, number> = {
  narrow: 12,
  medium: 22,
  wide: 35,
  fill: 0, // sentinel — fill gets the remainder
};

/**
 * Resolve table column sizing hints to percentage widths.
 * Unsized columns behave as "medium". Fill columns split the remainder.
 *
 * @returns Array of percentage widths summing to ~100.
 */
export function resolveTableWidths(
  headers: { size?: ColumnSize }[],
): number[] {
  if (headers.length === 0) return [];

  const sizes = headers.map(h => h.size ?? "medium");
  const fills = sizes.filter(s => s === "fill").length;
  const fixed = sizes.reduce((sum, s) => sum + (s !== "fill" ? COLUMN_SIZE_BASE[s] : 0), 0);

  // If fixed allocation exceeds 100%, normalize
  const scale = fixed > 100 ? 100 / fixed : 1;
  const remainder = Math.max(0, 100 - fixed * scale);
  const fillWidth = fills > 0 ? Math.floor(remainder / fills) : 0;

  const widths = sizes.map(s =>
    s === "fill" ? fillWidth : Math.round(COLUMN_SIZE_BASE[s] * scale),
  );

  // Absorb rounding error into the last column
  const total = widths.reduce((a, b) => a + b, 0);
  if (total !== 100 && widths.length > 0) {
    widths[widths.length - 1] += 100 - total;
  }

  return widths;
}

/** Resolve table compact mode from pace. */
export function resolveTableCompact(pace?: Pace): boolean {
  return pace === "dense";
}

/**
 * Inject resolved sequence colors into colorable blocks.
 * Mutates blocks in-place: sets `color` on items that don't have explicit colors.
 *
 * @param blocks - The page's content blocks
 * @param resolvedColors - Array of resolved color arrays, one per manifest entry
 * @param blockMap - Mapping from manifest index → content block index
 */
export function injectSequenceColors(
  blocks: SpecBlock[],
  resolvedColors: ColorValue[][],
  blockMap: Map<number, number>,
): void {
  for (let mi = 0; mi < resolvedColors.length; mi++) {
    const bi = blockMap.get(mi);
    if (bi === undefined) continue;

    const block = blocks[bi];
    const type = blockType(block);
    const colors = resolvedColors[mi];

    if (type === "cards") {
      const items = (blockValue(block) as CardsSpec).items;
      for (let j = 0; j < items.length && j < colors.length; j++) {
        if (!items[j].color) {
          (items[j] as unknown as Record<string, unknown>).color = colors[j];
        }
      }
    } else if (type === "flow_chain") {
      const steps = (blockValue(block) as FlowChainSpec).steps;
      for (let j = 0; j < steps.length && j < colors.length; j++) {
        if (!steps[j].color) {
          (steps[j] as Record<string, unknown>).color = colors[j];
        }
      }
    } else if (type === "badge") {
      const items = (blockValue(block) as BadgeSpec).items;
      for (let j = 0; j < items.length && j < colors.length; j++) {
        if (!items[j].color) {
          (items[j] as Record<string, unknown>).color = colors[j];
        }
      }
    }
  }
}
