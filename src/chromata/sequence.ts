/**
 * resolve_sequence — cross-block color coordination for cohesion-aware rendering.
 *
 * When blocks declare cohesion relationships (continues, supports, contrasts,
 * pivots, resolves), the palette assignment should reflect those relationships.
 * Without sequence awareness, each block independently cycles through scheme
 * colors, causing palette resets between blocks.
 *
 * resolveSequence accepts a block manifest with palette roles and returns
 * cross-block-coordinated color assignments. xhtml-tools drives this via
 * cohesion relationships; chromata owns the cycle state and hue math.
 *
 * Palette roles (mapped from cohesion by xhtml-tools):
 *   start     → fresh palette, begin at position 0
 *   extend    → continue the hue cycle from where the previous block left off
 *   mute      → same region but dampened energy (supports relationship)
 *   complement → jump to a complementary region of the scheme
 *   reset     → restart from position 0 (alias for start, used mid-page)
 *   converge  → blend toward the scheme's primary color (resolution)
 */

import { scales, formatRgb } from "./palette.js";
import type { ColorDef } from "./palette.js";
import { getShade, gamutClamp } from "./oklch.js";
import type { OKLCH, ShadeStep } from "./oklch.js";
import { pick, getShadeMappings, schemes } from "./themes.js";
import type { ShadeMappings } from "./themes.js";

// ── Types ────────────────────────────────────────────────────

export type PaletteRole = "start" | "extend" | "mute" | "complement" | "reset" | "converge";

export interface SequenceBlock {
  /** Number of items in this block that need color assignments */
  count: number;
  /** Palette role — how this block relates to the previous one */
  role: PaletteRole;
}

export interface SequenceResult {
  /** Per-block color arrays. result.blocks[i] has SequenceBlock[i].count ColorDefs. */
  blocks: ColorDef[][];
}

// ── Private helpers ──────────────────────────────────────────

/**
 * Resolve a palette color name to a ColorDef using shade mappings and energy.
 */
function resolveColor(colorName: string, shades: ShadeMappings): ColorDef {
  const scale = scales[colorName];
  if (!scale) {
    return { bg: "rgb(128,128,128)", text: "rgb(255,255,255)", border: "rgb(128,128,128)" };
  }

  const bg = getShade(scale, shades.bg);
  const text = getShade(scale, shades.text);
  const border = getShade(scale, shades.border);

  const energy = shades.energy;
  if (energy !== undefined && energy !== 1.0) {
    const textEnergy = Math.sqrt(energy);
    return {
      bg: modulateChroma(bg.oklch, energy),
      text: modulateChroma(text.oklch, textEnergy),
      border: modulateChroma(border.oklch, energy),
    };
  }

  return {
    bg: formatRgb(bg.rgb),
    text: formatRgb(text.rgb),
    border: formatRgb(border.rgb),
  };
}

/**
 * Modulate chroma on an OKLCH color and return CSS rgb string.
 */
function modulateChroma(oklch: OKLCH, energy: number): string {
  if (energy === 1.0 || oklch.C < 0.005) return formatRgb(gamutClamp(oklch));
  const modulated: OKLCH = { L: oklch.L, C: oklch.C * energy, H: oklch.H };
  return formatRgb(gamutClamp(modulated));
}

/**
 * Pick n colors from scheme starting at cursor position.
 * Returns color names and the new cursor position.
 */
function pickFromCursor(
  schemeColors: string[],
  cursor: number,
  count: number,
): { colors: string[]; cursor: number } {
  const result: string[] = [];
  let pos = cursor;
  for (let i = 0; i < count; i++) {
    result.push(schemeColors[pos % schemeColors.length]);
    pos++;
  }
  return { colors: result, cursor: pos };
}

// ── Mute shade derivation ────────────────────────────────────

/**
 * Create muted shade mappings: shift bg toward lighter shades,
 * reduce energy. The "supports" relationship — same hue region
 * but quieter, like a footnote or supporting evidence.
 */
function muteShades(baseShades: ShadeMappings): ShadeMappings {
  // Muting reduces energy by 30% and nudges bg/border one step lighter
  const bgStep = shiftStep(baseShades.bg, -1);
  const borderStep = shiftStep(baseShades.border, -1);
  const baseEnergy = baseShades.energy ?? 1.0;

  return {
    bg: bgStep,
    text: baseShades.text,
    border: borderStep,
    energy: baseEnergy * 0.7,
  };
}

/**
 * Create converging shade mappings: blend toward the primary color
 * with slightly reduced energy. The "resolves" relationship —
 * landing, coming home.
 */
function convergeShades(baseShades: ShadeMappings): ShadeMappings {
  const baseEnergy = baseShades.energy ?? 1.0;
  return {
    ...baseShades,
    energy: baseEnergy * 0.85,
  };
}

/** Shade steps in order for shifting */
const ORDERED_STEPS: ShadeStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * Shift a shade step by n positions. Clamps to valid range.
 * Positive n = darker, negative n = lighter.
 */
function shiftStep(step: ShadeStep, n: number): ShadeStep {
  const idx = ORDERED_STEPS.indexOf(step);
  const newIdx = Math.max(0, Math.min(ORDERED_STEPS.length - 1, idx + n));
  return ORDERED_STEPS[newIdx];
}

// ── resolveSequence ──────────────────────────────────────────

/**
 * Resolve a sequence of blocks with cross-block palette coordination.
 *
 * Each block declares how many items it contains and its palette role.
 * The function maintains a cursor through the scheme's color sequence
 * and modulates shade/energy based on the role.
 *
 * @param schemeName - Color scheme name (e.g., "cloudflare", "ocean")
 * @param blocks - Block descriptors with count and palette role
 * @param shades - Base shade mappings (from ThemeTokens). Energy on shades
 *   is the page-level energy from vibe weight.
 * @returns Per-block color arrays
 */
export function resolveSequence(
  schemeName: string,
  blocks: SequenceBlock[],
  shades?: ShadeMappings,
): SequenceResult {
  const scheme = schemes[schemeName];
  if (!scheme) {
    throw new Error(`Unknown scheme "${schemeName}"`);
  }

  const baseShades = shades ?? getShadeMappings(schemeName);
  const schemeColors = scheme.colors;
  let cursor = 0;

  const result: ColorDef[][] = [];

  for (const block of blocks) {
    switch (block.role) {
      case "start":
      case "reset": {
        // Fresh start — begin at position 0
        cursor = 0;
        const { colors, cursor: newCursor } = pickFromCursor(schemeColors, cursor, block.count);
        cursor = newCursor;
        result.push(colors.map((c) => resolveColor(c, baseShades)));
        break;
      }

      case "extend": {
        // Continue from current cursor position
        const { colors, cursor: newCursor } = pickFromCursor(schemeColors, cursor, block.count);
        cursor = newCursor;
        result.push(colors.map((c) => resolveColor(c, baseShades)));
        break;
      }

      case "mute": {
        // Same hue region, but muted shades
        const muted = muteShades(baseShades);
        const { colors, cursor: newCursor } = pickFromCursor(schemeColors, cursor, block.count);
        cursor = newCursor;
        result.push(colors.map((c) => resolveColor(c, muted)));
        break;
      }

      case "complement": {
        // Jump halfway around the scheme's color cycle
        const halfLen = Math.floor(schemeColors.length / 2);
        cursor = (cursor + halfLen) % schemeColors.length;
        const { colors, cursor: newCursor } = pickFromCursor(schemeColors, cursor, block.count);
        cursor = newCursor;
        result.push(colors.map((c) => resolveColor(c, baseShades)));
        break;
      }

      case "converge": {
        // Blend toward primary (first scheme color) with softened energy
        const converged = convergeShades(baseShades);
        // Use colors weighted toward the primary: start from position 0
        // but with partial overlap to current position
        const primaryColors: string[] = [];
        for (let i = 0; i < block.count; i++) {
          if (i === 0) {
            // First item is always the primary color
            primaryColors.push(schemeColors[0]);
          } else {
            // Remaining items blend: alternate between primary region and current
            primaryColors.push(schemeColors[i % schemeColors.length]);
          }
        }
        result.push(primaryColors.map((c) => resolveColor(c, converged)));
        break;
      }
    }
  }

  return { blocks: result };
}
