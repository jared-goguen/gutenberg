/**
 * Shared color palette for Confluence XHTML components.
 * 21 named hue families × 11 perceptually uniform shades each (OKLCH).
 *
 * Warm:    vermillion · orange · amber · yellow · lime
 * Cool:    emerald · teal · cyan · sky · azure · blue · indigo · violet · purple · fuchsia · rose · red
 * Neutral: slate · gray · stone · neutral
 *
 * Each hue family has shades 50–950 generated via OKLCH for perceptual
 * uniformity across hues. The classic ColorDef (bg/text/border) is derived
 * from shade positions: bg=50, text=900, border=500.
 *
 * Resolution chain: inline ColorDef → per-item color string → scheme → "gray" default
 */

import {
  generateShadeScale,
  formatRgb,
  parseRgbString,
  getShade,
  contrastRatio,
  meetsContrast,
  contrastText as oklchContrastText,
} from "./oklch.js";
import type { ShadeScale, Shade, SRGB, ShadeStep } from "./oklch.js";

// Re-export useful OKLCH types
export type { ShadeScale, Shade, SRGB, ShadeStep };
export { SHADE_STEPS } from "./oklch.js";

// ── Types ────────────────────────────────────────────────────

export interface ColorDef {
  bg: string;
  text: string;
  border: string;
}

/**
 * Hue definition: OKLCH parameters for generating a shade scale.
 * H = hue angle (0–360), C = base chroma at shade 500.
 */
interface HueDef {
  H: number;
  C: number;
}

// ── Hue definitions ──────────────────────────────────────────
// Each hue is defined by its OKLCH hue angle and peak chroma.
// These are tuned to produce vibrant, distinct scales that stay
// in sRGB gamut across all 11 shade steps.

const hueDefs: Record<string, HueDef> = {
  // ── Warm spectrum ──────────────────────────────────────────
  // Spread for perceptual distinctness: 12° 13° 20° 26° 34° separation
  vermillion: { H: 37,  C: 0.16 },  // deep warm orange — honest name for H=37
  orange:  { H: 50,  C: 0.17 },  // true orange, less blinding — was H=35 C=0.20
  amber:   { H: 70,  C: 0.15 },  // CF gold (#FBAD41 ≈ H=72) — the brand's warm accent
  yellow:  { H: 96,  C: 0.16 },  // Lemon — distinct from amber/gold, own identity
  lime:    { H: 130, C: 0.16 },

  // ── Cool spectrum ──────────────────────────────────────────
  emerald: { H: 155, C: 0.17 },
  teal:    { H: 180, C: 0.13 },
  cyan:    { H: 210, C: 0.12 },
  sky:     { H: 240, C: 0.13 },
  azure:   { H: 248, C: 0.15 },
  blue:    { H: 264, C: 0.22 },  // wide gamut — push to ~85% util at shade-500
  indigo:  { H: 280, C: 0.21 },  // wide gamut — push to ~85% util at shade-500
  violet:  { H: 295, C: 0.23 },  // wide gamut — push to ~85% util at shade-500
  purple:  { H: 310, C: 0.23 },  // wide gamut — push to ~80% util at shade-500
  fuchsia: { H: 330, C: 0.23 },  // wide gamut — push to ~88% util at shade-500
  rose:    { H: 350, C: 0.21 },  // wide gamut — push to ~88% util at shade-500
  red:     { H: 25,  C: 0.19 },  // True crimson — near sRGB pure red (H≈29), slight chroma dial-back

  // ── Neutrals (very low chroma) ─────────────────────────────
  slate:   { H: 250, C: 0.02 },
  gray:    { H: 250, C: 0.005 },
  stone:   { H: 60,  C: 0.015 },
  neutral: { H: 250, C: 0.003 },
};

// ── Scale generation ─────────────────────────────────────────

/** Generated shade scales for all 21 hues */
export const scales: Record<string, ShadeScale> = {};

for (const [name, def] of Object.entries(hueDefs)) {
  scales[name] = generateShadeScale(name, def.H, def.C);
}

// ── ColorDef derivation ──────────────────────────────────────
// Derive the classic bg/text/border from shade positions:
//   bg     = shade 50  (very light background)
//   text   = shade 900 (dark, high-contrast text)
//   border = shade 500 (vivid midtone accent)

export const colors: Record<string, ColorDef> = {};

for (const [name, scale] of Object.entries(scales)) {
  const bg = getShade(scale, 50);
  const text = getShade(scale, 900);
  const border = getShade(scale, 500);
  colors[name] = {
    bg: formatRgb(bg.rgb),
    text: formatRgb(text.rgb),
    border: formatRgb(border.rgb),
  };
}

// ── Resolution ───────────────────────────────────────────────

/**
 * Resolve a color reference to a ColorDef.
 *   - string → palette lookup (throws if unknown)
 *   - string with shade ("sky-500") → shade-derived ColorDef
 *   - ColorDef object → pass through (inline custom color)
 */
export function resolve(ref: string | ColorDef): ColorDef {
  if (typeof ref === "object" && ref !== null) return ref;

  // Normalize dot notation: sky.500 → sky-500
  ref = normalizeRef(ref);

  // Check for shade syntax: "name-step"
  const shadeMatch = ref.match(/^([a-z]+)-(\d+)$/);
  if (shadeMatch) {
    const [, name, stepStr] = shadeMatch;
    const scale = scales[name];
    if (scale) {
      const step = +stepStr as ShadeStep;
      const shade = scale.shades.find((s) => s.step === step);
      if (shade) {
        // For a specific shade, bg=that shade, text=contrast shade, border=500
        const textShade = oklchContrastText(shade.rgb, scale, "AA");
        const borderShade = getShade(scale, 500);
        return {
          bg: formatRgb(shade.rgb),
          text: formatRgb(textShade.rgb),
          border: formatRgb(borderShade.rgb),
        };
      }
    }
  }

  const c = colors[ref];
  if (!c) {
    const available = Object.keys(colors).join(", ");
    throw new Error(`Unknown palette color "${ref}". Available: ${available}`);
  }
  return c;
}

/**
 * Resolve a shade reference to a specific Shade object.
 * Accepts "name-step" (e.g. "sky-500") or just "name" (returns shade 500).
 */
export function resolveShade(ref: string): Shade {
  // Normalize dot notation: sky.500 → sky-500
  ref = normalizeRef(ref);

  const shadeMatch = ref.match(/^([a-z]+)-(\d+)$/);
  if (shadeMatch) {
    const [, name, stepStr] = shadeMatch;
    const scale = scales[name];
    if (!scale) {
      const available = Object.keys(scales).join(", ");
      throw new Error(`Unknown palette color "${name}". Available: ${available}`);
    }
    const step = +stepStr as ShadeStep;
    const shade = scale.shades.find((s) => s.step === step);
    if (!shade) {
      throw new Error(`Invalid shade step ${stepStr} for "${name}". Valid steps: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`);
    }
    return shade;
  }

  // Bare name → shade 500 (the base/vivid shade)
  const scale = scales[ref];
  if (!scale) {
    const available = Object.keys(scales).join(", ");
    throw new Error(`Unknown palette color "${ref}". Available: ${available}`);
  }
  return getShade(scale, 500);
}

/**
 * Get the full shade scale for a named hue.
 */
export function getScale(name: string): ShadeScale {
  const scale = scales[name];
  if (!scale) {
    const available = Object.keys(scales).join(", ");
    throw new Error(`Unknown palette color "${name}". Available: ${available}`);
  }
  return scale;
}

// ── Reverse resolution ───────────────────────────────────────

/** Reverse-map: RGB string → palette color name. Returns null if not found. */
const _reverseCache = new Map<string, string>();

function buildReverseCache(): void {
  if (_reverseCache.size > 0) return;
  // Index all shade RGB values → "name" (for the classic bg/text/border values)
  for (const [name, c] of Object.entries(colors)) {
    _reverseCache.set(c.bg, name);
    _reverseCache.set(c.text, name);
    _reverseCache.set(c.border, name);
  }
  // Also index all shade scale RGB values → "name-step"
  for (const [name, scale] of Object.entries(scales)) {
    for (const shade of scale.shades) {
      const rgb = formatRgb(shade.rgb);
      // Don't overwrite classic ColorDef entries (they map to bare name)
      if (!_reverseCache.has(rgb)) {
        _reverseCache.set(rgb, `${name}-${shade.step}`);
      }
    }
  }
}

export function reverseResolve(rgb: string): string | null {
  buildReverseCache();
  return _reverseCache.get(rgb) ?? null;
}

/**
 * Reverse-map with full detail: RGB → { name, step? }.
 * Returns null if not found.
 */
export function reverseResolveDetailed(rgb: string): { name: string; step?: ShadeStep } | null {
  buildReverseCache();
  const key = _reverseCache.get(rgb);
  if (!key) return null;
  const match = key.match(/^([a-z]+)-(\d+)$/);
  if (match) return { name: match[1], step: +match[2] as ShadeStep };
  // Bare name from colors mapping — resolve the step from shade scale
  const scale = scales[key];
  if (scale) {
    const shade = scale.shades.find(s => formatRgb(s.rgb) === rgb);
    if (shade) return { name: key, step: shade.step as ShadeStep };
  }
  return { name: key };
}

// ── Muted text color ─────────────────────────────────────────

/**
 * Pick a readable muted text color for a given background.
 *
 * Hue-aware: if the background is a chromatic palette shade (e.g. teal-600),
 * returns shade-400 of that hue instead of generic gray. This maintains hue
 * harmony — subtitles on a teal card come out teal-400, not washed-out gray.
 *
 * Falls back to gray for neutral/achromatic backgrounds and unknown colors.
 * Light backgrounds always use gray-600 (sufficient contrast).
 *
 * Uses ITU-R BT.601 luma for quick brightness estimation.
 */
export function mutedTextForBg(bgRgb: string): string {
  const m = bgRgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return formatRgb(getShade(scales.gray, 500).rgb);

  // Chromatic palette shade ≥500 → hue-aware muted (shade-300 or 400).
  // Checked first: brightness-based threshold misjudges some medium-dark
  // hues (orange-500 reads as 0.42 luma but renders with light text).
  const detail = reverseResolveDetailed(bgRgb);
  if (detail && !NEUTRAL_HUES.has(detail.name) && detail.step && detail.step >= 500 && scales[detail.name]) {
    // 2+ shade steps lighter: 500 bg → 300 muted, 600+ bg → 400 muted
    const mutedStep = detail.step >= 600 ? 400 : 300;
    return formatRgb(getShade(scales[detail.name], mutedStep as ShadeStep).rgb);
  }

  // Fallback: brightness-based generic gray
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness < 0.4
    ? formatRgb(getShade(scales.gray, 400).rgb)
    : formatRgb(getShade(scales.gray, 600).rgb);
}

// ── Canonical hue classifications ────────────────────────────
//
// These are the single source of truth for hue ring order and
// neutral hue classification. Consumers (svg-tools, xhtml-tools)
// should import these rather than hardcoding their own lists.

/**
 * Chromatic hue names sorted by OKLCH hue angle (ascending).
 * This is the canonical ring order — warm→cool→warm wraparound.
 * Used by gradient/diverging color functions to walk between hues.
 *
 * Note: red (H=25) and vermillion (H=37) are close but distinct.
 * red is listed first (lower angle). Both are on the ring for independent addressability.
 */
export const CHROMATIC_HUES: readonly string[] = Object.freeze(
  Object.entries(hueDefs)
    .filter(([name]) => !["slate", "gray", "stone", "neutral"].includes(name))
    .sort((a, b) => {
      // Primary sort: hue angle ascending
      if (a[1].H !== b[1].H) return a[1].H - b[1].H;
      // Tie-break: higher chroma first (red before vermillion)
      return b[1].C - a[1].C;
    })
    .map(([name]) => name)
);

/**
 * Neutral hue names (very low chroma, not part of the color wheel).
 */
export const NEUTRAL_HUES: ReadonlySet<string> = Object.freeze(
  new Set(["slate", "gray", "stone", "neutral"])
);

/**
 * All hue names in the palette (chromatic + neutral).
 * Internal only — consumers should use CHROMATIC_HUES or NEUTRAL_HUES.
 */
const ALL_HUES: readonly string[] = Object.freeze(Object.keys(hueDefs));

// ── Normalization ────────────────────────────────────────────

/**
 * Normalize a color reference string:
 *   - Dot notation: "sky.500" → "sky-500"
 *   - Trims whitespace
 *
 * Does NOT resolve semantic roles or alpha expressions.
 * Use this for syntactic normalization before further parsing.
 */
export function normalizeRef(ref: string): string {
  ref = ref.trim();
  // sky.500 → sky-500 (dot alias for dash)
  return ref.replace(/^([a-z]+)\.(\d+)$/, "$1-$2");
}

// ── Convenience: hue + shade → rgb string ────────────────────

/**
 * Resolve a hue name and shade step to a CSS rgb() string.
 * Shorthand for `formatRgb(getShade(scales[hue], shade).rgb)`.
 *
 * Accepts `number` for ergonomic use with computed shade values.
 * Throws at runtime if the shade step is not a valid step (50–950).
 *
 * @example getColor("sky", 500) → "rgb(56,163,230)"
 */
export function getColor(hue: string, shade: number): string {
  const scale = scales[hue];
  if (!scale) {
    const available = Object.keys(scales).join(", ");
    throw new Error(`Unknown hue "${hue}". Available: ${available}`);
  }
  return formatRgb(getShade(scale, shade as ShadeStep).rgb);
}

/**
 * Resolve any color reference to a CSS rgb() string.
 *
 * Accepts:
 *   - `"rgb(…)"` → passthrough
 *   - `"sky-500"` → shade lookup
 *   - `"sky"` → bare hue name at `defaultShade` (default 500)
 *
 * @example resolveColorRef("sky-200")       → "rgb(186,217,247)"
 * @example resolveColorRef("sky")           → "rgb(56,163,230)"
 * @example resolveColorRef("rgb(10,20,30)") → "rgb(10,20,30)"
 */
export function resolveColorRef(ref: string, defaultShade: ShadeStep = 500): string {
  ref = ref.trim();

  // Alpha wrapper: alpha(sky-500, 60) → rgba(R,G,B,0.6)
  // Greedy .+ to handle rgb() with commas inside: alpha(rgb(10,20,30), 50)
  const alphaMatch = ref.match(/^alpha\((.+),\s*(\d+)\)$/i);
  if (alphaMatch) {
    const innerRef = alphaMatch[1].trim();
    const pct = +alphaMatch[2];
    const rgb = resolveColorRef(innerRef, defaultShade); // recursive
    const channels = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (channels) {
      const alpha = Math.round(pct) / 100;
      return `rgba(${channels[1]},${channels[2]},${channels[3]},${alpha})`;
    }
    return rgb; // fallback — shouldn't happen with valid palette colors
  }

  // Passthrough for CSS rgb/rgba
  if (ref.startsWith("rgb")) return ref;

  // Dot notation normalization: sky.500 → sky-500
  ref = normalizeRef(ref);

  const shadeMatch = ref.match(/^([a-z]+)-(\d+)$/);
  if (shadeMatch) return getColor(shadeMatch[1], +shadeMatch[2] as ShadeStep);
  return getColor(ref, defaultShade);
}

// ── Re-exports for convenience ───────────────────────────────

export { contrastRatio, formatRgb, parseRgbString } from "./oklch.js";
