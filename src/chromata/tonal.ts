/**
 * Tonal resolution — semantic color selection with perceptual safety.
 *
 * Replaces raw hue names (`palette: amber`) with tonal intent
 * (`tone: warm`). The system picks perceptually viable hues from
 * tonal subsets, enforcing a chroma floor that ensures every
 * returned hue pops on the scheme's surface.
 *
 * Core concept: **chroma floor**. At a scheme's shade step (e.g.
 * bg=500 for cloudflare), some hues have too little sRGB gamut
 * headroom to look vivid against dark backgrounds. Amber (H=70)
 * and yellow (H=96) are the worst offenders — their max chroma
 * at L=0.57 is below the perceptual vibrancy threshold. The chroma
 * floor silently excludes them, routing to the nearest viable hue.
 *
 * Tone vocabulary:
 *   warm    — vermillion, orange, rose, red (+ bridge: lime)
 *   cool    — sky, azure, blue, indigo, teal, cyan (+ bridge: emerald)
 *   accent  — scheme primary color family
 *   neutral — slate, gray, stone, neutral
 *   drama   — violet, purple, fuchsia (available for progression endpoints)
 *
 * API:
 *   resolveTone()        — pick n viable hues from a tonal subset
 *   resolveProgression() — walk across tonal subsets (warm..cool etc.)
 *   chromaFloor()        — test whether a hue passes vibrancy threshold
 */

import { scales, CHROMATIC_HUES, NEUTRAL_HUES } from "./palette.js";
import { maxChromaAt, getShade, srgbToOklch } from "./oklch.js";
import type { ShadeStep } from "./oklch.js";
import { getShadeMappings, schemes } from "./themes.js";
import type { ShadeMappings } from "./themes.js";
import { walkHueRing } from "./color-functions.js";

// ── Types ────────────────────────────────────────────────────

/** Semantic tone categories */
export type Tone = "warm" | "cool" | "accent" | "neutral" | "drama";

/** Result of tonal resolution */
export interface TonalResult {
  /** Selected hue names (length = count) */
  hues: string[];
  /** Hues that were excluded by the chroma floor */
  excluded: string[];
  /** The chroma floor threshold used */
  chromaFloor: number;
  /** Shade step used for floor evaluation */
  shadeStep: ShadeStep;
}

/** Progression endpoint — either a tone or a specific hue name */
export type ProgressionEndpoint = Tone | string;

/** Result of progression resolution */
export interface ProgressionResult {
  /** Selected hue names across the progression (length = count) */
  hues: string[];
  /** Resolved start hue */
  from: string;
  /** Resolved end hue */
  to: string;
  /** Hues excluded from consideration by chroma floor */
  excluded: string[];
  /** The chroma floor threshold used */
  chromaFloor: number;
}

// ── Tonal subsets ────────────────────────────────────────────

/**
 * Canonical hue members for each tone. Order matters — it's the
 * preference order when picking representative hues.
 *
 * Bridge hues (lime, emerald) straddle warm/cool and are available
 * to both but ranked lower (appended at end).
 */
const TONE_SUBSETS: Record<Tone, readonly string[]> = {
  warm:    ["orange", "vermillion", "red", "rose", "lime"],
  cool:    ["azure", "sky", "blue", "indigo", "teal", "cyan", "emerald"],
  accent:  [],  // populated dynamically from scheme
  neutral: ["slate", "gray", "stone", "neutral"],
  drama:   ["violet", "purple", "fuchsia"],
};

/** All tones that participate in chroma floor filtering */
const CHROMATIC_TONES: ReadonlySet<Tone> = new Set(["warm", "cool", "accent", "drama"]);

// ── Chroma floor ─────────────────────────────────────────────

/**
 * Minimum chroma (OKLCH C) for a hue to be considered "vibrant" on
 * a dark surface. This is the perceptual threshold — below this,
 * colors look muddy/washed out against dark backgrounds.
 *
 * Calibrated against the cloudflare scheme:
 *   - orange  at shade-500 (L=0.57): maxC ≈ 0.17 → passes (0.17 > 0.11)
 *   - amber   at shade-500 (L=0.57): maxC ≈ 0.15 but gamut-clamped C ≈ 0.10 → fails
 *   - yellow  at shade-500 (L=0.57): maxC ≈ 0.16 but effective ≈ 0.09 → fails
 *   - teal    at shade-500 (L=0.57): maxC ≈ 0.13 → passes (borderline)
 *   - sky     at shade-500 (L=0.57): maxC ≈ 0.13 → passes
 *
 * The floor is evaluated against the actual gamut-clamped chroma at
 * the scheme's bg shade step, not the theoretical max.
 */
const DEFAULT_CHROMA_FLOOR = 0.11;

/**
 * Test whether a hue passes the chroma floor at a given lightness and hue angle.
 *
 * Uses maxChromaAt() to find the sRGB gamut boundary, then checks
 * whether the achievable chroma exceeds the floor threshold.
 *
 * @param hueName - Palette hue name
 * @param shadeStep - Shade step to evaluate at (determines lightness)
 * @param floor - Minimum chroma threshold (default: DEFAULT_CHROMA_FLOOR)
 * @returns true if the hue is vibrant enough at this shade step
 */
export function chromaFloor(
  hueName: string,
  shadeStep: ShadeStep = 500,
  floor: number = DEFAULT_CHROMA_FLOOR,
): boolean {
  const scale = scales[hueName];
  if (!scale) return false;

  // Get the actual shade at this step — it's already gamut-clamped
  const shade = getShade(scale, shadeStep);
  const oklch = srgbToOklch(shade.rgb);

  return oklch.C >= floor;
}

/**
 * Filter a list of hue names through the chroma floor.
 * Returns { viable, excluded } split.
 */
function filterByChromaFloor(
  hues: readonly string[],
  shadeStep: ShadeStep,
  floor: number,
): { viable: string[]; excluded: string[] } {
  const viable: string[] = [];
  const excluded: string[] = [];

  for (const hue of hues) {
    if (NEUTRAL_HUES.has(hue) || chromaFloor(hue, shadeStep, floor)) {
      viable.push(hue);
    } else {
      excluded.push(hue);
    }
  }

  return { viable, excluded };
}

// ── Tone resolution ──────────────────────────────────────────

/**
 * Get the hue subset for a tone, resolving "accent" dynamically
 * from the scheme's color list.
 */
function getSubset(tone: Tone, schemeName?: string): string[] {
  if (tone === "accent") {
    const s = schemeName ? schemes[schemeName] : undefined;
    if (s && s.colors.length > 0) {
      // Accent = scheme's primary color + its warm/cool neighbors
      return [...s.colors];
    }
    // Fallback: use warm subset
    return [...TONE_SUBSETS.warm];
  }
  return [...TONE_SUBSETS[tone]];
}

/**
 * Resolve n hues from a tonal subset with chroma floor enforcement.
 *
 * For count ≤ viable hues: picks evenly spaced hues from the subset.
 * For count > viable hues: wraps around the subset.
 *
 * @param tone - Tonal category
 * @param count - Number of hues to return
 * @param scheme - Scheme name (affects shade step and accent resolution)
 * @param floor - Override the default chroma floor
 */
export function resolveTone(
  tone: Tone,
  count: number,
  scheme?: string,
  floor: number = DEFAULT_CHROMA_FLOOR,
): TonalResult {
  const shades = getShadeMappings(scheme);
  const shadeStep = shades.bg;

  const subset = getSubset(tone, scheme);

  // Neutrals skip chroma floor — they're intentionally low-chroma
  const isNeutral = tone === "neutral";
  const { viable, excluded } = isNeutral
    ? { viable: subset, excluded: [] as string[] }
    : filterByChromaFloor(subset, shadeStep, floor);

  if (viable.length === 0) {
    // Extreme fallback — all hues in subset failed. Use nearest viable.
    // This shouldn't happen with well-tuned floor, but safety first.
    return {
      hues: Array(count).fill("gray"),
      excluded: subset,
      chromaFloor: floor,
      shadeStep,
    };
  }

  // Pick n hues, evenly distributed across viable set
  const hues: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = viable.length <= count
      ? i % viable.length
      : Math.round((i / (count - 1)) * (viable.length - 1));
    hues.push(viable[idx]);
  }

  return { hues, excluded, chromaFloor: floor, shadeStep };
}

// ── Progression resolution ───────────────────────────────────

/**
 * Map a tone name to a representative hue for use as a ring endpoint.
 * Picks the first viable hue from the tone's subset.
 */
function toneToHue(tone: Tone, shadeStep: ShadeStep, floor: number, schemeName?: string): string {
  const subset = getSubset(tone, schemeName);
  const { viable } = filterByChromaFloor(subset, shadeStep, floor);
  return viable[0] ?? "gray";
}

/**
 * Check if a string is a valid tone name.
 */
export function isTone(s: string): s is Tone {
  return s === "warm" || s === "cool" || s === "accent" || s === "neutral" || s === "drama";
}

/**
 * Resolve a progression across the hue ring with chroma floor enforcement.
 *
 * Accepts tone names or specific hue names as endpoints:
 *   - "warm..cool" — walk from best warm hue to best cool hue
 *   - "orange..azure" — walk between specific hues
 *   - "warm..violet" — mix tones and hues
 *   - true / "auto" — warm..cool default
 *
 * Uses walkHueRing() for the actual interpolation, but pre-filters
 * the path to exclude hues that fail the chroma floor. This is
 * achieved by snapping each interpolated hue to its nearest
 * floor-passing neighbor.
 *
 * @param from - Start tone/hue
 * @param to - End tone/hue
 * @param count - Number of hues in the progression
 * @param scheme - Scheme name (affects shade step)
 * @param floor - Override the default chroma floor
 */
export function resolveProgression(
  from: ProgressionEndpoint,
  to: ProgressionEndpoint,
  count: number,
  scheme?: string,
  floor: number = DEFAULT_CHROMA_FLOOR,
): ProgressionResult {
  const shades = getShadeMappings(scheme);
  const shadeStep = shades.bg;

  // Resolve tone names to representative hues
  const fromHue = isTone(from) ? toneToHue(from, shadeStep, floor, scheme) : from;
  const toHue = isTone(to) ? toneToHue(to, shadeStep, floor, scheme) : to;

  // Validate hue names
  if (!scales[fromHue]) throw new Error(`Unknown hue or tone "${from}"`);
  if (!scales[toHue]) throw new Error(`Unknown hue or tone "${to}"`);

  // Walk the hue ring (uses chroma-weighted spacing)
  const rawHues = walkHueRing(fromHue, toHue, count);

  // Post-filter: snap any floor-failing hues to nearest viable neighbor
  const allExcluded: string[] = [];
  const hues = rawHues.map((hue) => {
    if (NEUTRAL_HUES.has(hue) || chromaFloor(hue, shadeStep, floor)) {
      return hue;
    }
    allExcluded.push(hue);
    return snapToViable(hue, shadeStep, floor);
  });

  return {
    hues,
    from: fromHue,
    to: toHue,
    excluded: [...new Set(allExcluded)],
    chromaFloor: floor,
  };
}

/**
 * Snap a floor-failing hue to the nearest chromatic hue that passes.
 * Searches both directions on the CHROMATIC_HUES ring.
 */
function snapToViable(hue: string, shadeStep: ShadeStep, floor: number): string {
  const idx = CHROMATIC_HUES.indexOf(hue);
  if (idx === -1) return hue;

  const len = CHROMATIC_HUES.length;

  for (let d = 1; d < len; d++) {
    // Check forward
    const fwd = CHROMATIC_HUES[(idx + d) % len];
    if (chromaFloor(fwd, shadeStep, floor)) return fwd;

    // Check backward
    const bwd = CHROMATIC_HUES[(idx - d + len) % len];
    if (chromaFloor(bwd, shadeStep, floor)) return bwd;
  }

  return hue; // absolute fallback — shouldn't reach here
}

// ── Introspection ────────────────────────────────────────────

/**
 * Get all hues in a tone with their chroma floor status.
 * Useful for diagnostics and tool display.
 */
export function inspectTone(
  tone: Tone,
  scheme?: string,
  floor: number = DEFAULT_CHROMA_FLOOR,
): Array<{ hue: string; chroma: number; maxChroma: number; viable: boolean }> {
  const shades = getShadeMappings(scheme);
  const shadeStep = shades.bg;
  const subset = getSubset(tone, scheme);

  return subset.map((hue) => {
    const scale = scales[hue];
    if (!scale) return { hue, chroma: 0, maxChroma: 0, viable: false };

    const shade = getShade(scale, shadeStep);
    const oklch = srgbToOklch(shade.rgb);
    const maxC = maxChromaAt(oklch.L, oklch.H);

    return {
      hue,
      chroma: Math.round(oklch.C * 1000) / 1000,
      maxChroma: Math.round(maxC * 1000) / 1000,
      viable: oklch.C >= floor,
    };
  });
}

/**
 * List available tones.
 */
export function listTones(): Tone[] {
  return ["warm", "cool", "accent", "neutral", "drama"];
}
