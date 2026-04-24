/**
 * resolveColors — assign concrete bg/text/border to a list of items.
 *
 * Given items with optional color hints and a scheme context, produces
 * a ColorDef per item. This is the primary API for renderers that need
 * per-item colors (card rows, flow chains, badges).
 *
 * Accepts pre-resolved ShadeMappings directly so that callers who already
 * have ThemeTokens don't re-derive shades from scheme+contrast.
 *
 * Color functions (grad:, mono:, div:, pair:, accent:) are supported as
 * scheme names — they distribute hues across items algorithmically instead
 * of cycling through a named scheme's color list.
 */

import { scales, resolve, formatRgb } from "./palette.js";
import type { ColorDef } from "./palette.js";
import { getShade, gamutClamp } from "./oklch.js";
import type { OKLCH, SRGB, ShadeStep } from "./oklch.js";
import { pick, getShadeMappings } from "./themes.js";
import type { ShadeMappings } from "./themes.js";
import { isSemanticRole, roleToHue } from "./semantic.js";
import { isColorFunction, resolveColorFunction } from "./color-functions.js";

// ── Dual-mode colors ─────────────────────────────────────────

/**
 * Extended color set for dual-mode rendering (light + dark page backgrounds).
 *
 * The shade choices are fixed by the dual-mode constraint — not configurable:
 * - bg: shade-700 — dark enough for white text (WCAG AA 4.5:1+), vivid enough
 *   to create a clear zone on both white and dark page backgrounds.
 * - text: shade-50 — near-white, forced via !important for contrast with bg.
 * - border: shade-500 — medium accent for borders and separators.
 * - muted: shade-200 — secondary/caption text on the dark bg.
 *
 * All values are hex (#rrggbb) — Confluence rejects rgb() in macro params.
 */
export interface DualModeColors {
  /** Panel/card background — shade-700. Hex format. */
  bg: string;
  /** Primary text on bg — shade-50. Hex format. */
  text: string;
  /** Accent border — shade-500. Hex format. */
  border: string;
  /** Secondary/muted text on bg — shade-200. Hex format. */
  muted: string;
}

/** Fixed shade mapping for dual-mode safety. Not configurable by design. */
const DUAL_MODE_SHADES = {
  bg: 700 as ShadeStep,
  text: 50 as ShadeStep,
  border: 500 as ShadeStep,
  muted: 200 as ShadeStep,
};

function toHex(rgb: SRGB): string {
  const r = Math.round(Math.max(0, Math.min(255, rgb.r)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b)));
  return "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("");
}

/**
 * Resolve a color to dual-mode-safe values for Confluence panels.
 *
 * Returns shade-700 bg (dark, saturated), shade-50 text (near-white),
 * shade-500 border, shade-200 muted — all in hex format.
 *
 * Accepts hue names ("orange", "teal"), semantic roles ("primary", "danger"),
 * or any palette color. Semantic roles are resolved through the scheme.
 *
 * @example resolveDualMode("orange")           // { bg: "#c2410c", text: "#fff7ed", ... }
 * @example resolveDualMode("primary", "cloudflare")  // primary → orange in cloudflare
 * @example resolveDualMode("danger")           // danger → vermillion
 */
export function resolveDualMode(color: string, schemeName?: string): DualModeColors {
  // Resolve semantic roles to hue names
  const hue = isSemanticRole(color) ? roleToHue(color as any, schemeName) : color;

  const scale = scales[hue];
  if (!scale) {
    // Unknown color — fall back to gray
    const gray = scales.gray;
    return {
      bg: toHex(getShade(gray, DUAL_MODE_SHADES.bg).rgb),
      text: toHex(getShade(gray, DUAL_MODE_SHADES.text).rgb),
      border: toHex(getShade(gray, DUAL_MODE_SHADES.border).rgb),
      muted: toHex(getShade(gray, DUAL_MODE_SHADES.muted).rgb),
    };
  }

  return {
    bg: toHex(getShade(scale, DUAL_MODE_SHADES.bg).rgb),
    text: toHex(getShade(scale, DUAL_MODE_SHADES.text).rgb),
    border: toHex(getShade(scale, DUAL_MODE_SHADES.border).rgb),
    muted: toHex(getShade(scale, DUAL_MODE_SHADES.muted).rgb),
  };
}

/**
 * Batch resolve dual-mode colors for items with optional color hints.
 *
 * Items without explicit colors cycle through the scheme's color palette.
 * Same shade-700/50/500/200 mapping as resolveDualMode.
 */
export function resolveDualModeColors(
  items: { color?: string }[],
  schemeName?: string,
): DualModeColors[] {
  const schemeColors = schemeName ? pick(schemeName, items.length) : null;

  return items.map((item, i) => {
    if (item.color) {
      return resolveDualMode(item.color, schemeName);
    }
    if (schemeColors) {
      return resolveDualMode(schemeColors[i], schemeName);
    }
    return resolveDualMode("gray");
  });
}

// ── Energy modulation (private) ──────────────────────────────

/**
 * Apply energy multiplier to a shade's chroma, producing a new sRGB color.
 * Preserves lightness and hue; only saturation changes. Gamut-clamped for sRGB safety.
 *
 * @param rgb  - Original shade sRGB
 * @param oklch - Original shade OKLCH (pre-computed on every Shade)
 * @param energy - Chroma multiplier (0.7 = muted, 1.0 = neutral, 1.3 = bold)
 */
function modulateEnergy(rgb: SRGB, oklch: OKLCH, energy: number): string {
  if (energy === 1.0 || oklch.C < 0.005) {
    // Neutral energy or achromatic — no modulation needed
    return formatRgb(rgb);
  }
  const modulated: OKLCH = { L: oklch.L, C: oklch.C * energy, H: oklch.H };
  return formatRgb(gamutClamp(modulated));
}

// ── Shade-aware resolution (private) ────────────────────────

/**
 * Resolve a palette color name to a ColorDef using specific shade mappings.
 *
 * When shades.energy is set and ≠ 1.0, modulates chroma:
 * - bg/border: full energy multiplier
 * - text: dampened (√energy) to preserve readability contrast
 */
function resolveWithShades(colorName: string, shades: ShadeMappings): ColorDef {
  const scale = scales[colorName];
  if (!scale) return resolve(colorName);

  const bg = getShade(scale, shades.bg);
  const text = getShade(scale, shades.text);
  const border = getShade(scale, shades.border);

  const energy = shades.energy;
  if (energy !== undefined && energy !== 1.0) {
    // Dampen text energy: √energy preserves readability while still shifting tone
    const textEnergy = Math.sqrt(energy);
    return {
      bg: modulateEnergy(bg.rgb, bg.oklch, energy),
      text: modulateEnergy(text.rgb, text.oklch, textEnergy),
      border: modulateEnergy(border.rgb, border.oklch, energy),
    };
  }

  return {
    bg: formatRgb(bg.rgb),
    text: formatRgb(text.rgb),
    border: formatRgb(border.rgb),
  };
}

// ── Color function resolution (private) ──────────────────────

/**
 * Resolve items using a color function scheme.
 *
 * Color functions (grad:sky:violet, mono:sky, etc.) generate per-item
 * hue assignments algorithmically. Per-item color overrides still win.
 */
function resolveWithColorFunction(
  items: { color?: string | ColorDef }[],
  schemeName: string,
  shades?: ShadeMappings,
): ColorDef[] {
  // Color functions always assume dark surface (cloudflare shade mappings)
  const baseShades = shades ?? getShadeMappings("cloudflare");
  const result = resolveColorFunction(schemeName, items.length, /* dark */ true);

  return items.map((item, i) => {
    // Explicit per-item colors still override the color function
    if (item.color && typeof item.color === "string") {
      // Semantic role names resolve through the role system
      if (isSemanticRole(item.color)) {
        const hue = roleToHue(item.color);
        return resolveWithShades(hue, baseShades);
      }
      // Bare palette name — use base shades
      if (scales[item.color]) {
        return resolveWithShades(item.color, baseShades);
      }
      return resolve(item.color);
    }
    if (item.color && typeof item.color === "object") {
      // ColorDef object — pass through
      return resolve(item.color);
    }

    // Color function assignment
    const hue = result.hues[i];
    if (result.perItemShades) {
      const ps = result.perItemShades[i];
      return resolveWithShades(hue, ps);
    }
    return resolveWithShades(hue, baseShades);
  });
}

// ── resolveColor (singular) ──────────────────────────────────

/**
 * Resolve a single color reference to a concrete bg/text/border triplet.
 *
 * Convenience wrapper around resolveColors for the common single-item case.
 * Accepts a color name, semantic role, or palette ref. Resolves through
 * the scheme's shade mappings when provided.
 *
 * @example resolveColor("sky", "cloudflare", theme.shades)
 * @example resolveColor("primary", "cloudflare")
 * @example resolveColor("orange", undefined, { bg: 600, text: 50, border: 600 })
 */
export function resolveColor(
  color: string,
  schemeName?: string,
  shades?: ShadeMappings,
): ColorDef {
  return resolveColors([{ color }], schemeName, undefined, shades)[0];
}

// ── resolveColors ────────────────────────────────────────────

/**
 * Resolve colors for a list of items given a scheme and shade mappings.
 *
 * Each item can have an explicit `color` (string name or ColorDef object).
 * The scheme fills in items without explicit colors.
 *
 * **Color functions:** Pass a color function string as the scheme
 * (e.g., "grad:sky:violet", "mono:emerald") to distribute hues
 * algorithmically instead of cycling through a named scheme.
 *
 * **Shade mappings:** Pass `shades` directly (from ThemeTokens) to use
 * pre-resolved shade steps. If omitted, derives from scheme name.
 *
 * **Accent scheme blending:** Pass `accentScheme` to pull colors from a
 * second scheme. Items with `color: "accent:primary"` or `color: "accent:sky"`
 * resolve through the accent scheme's palette and shade mappings. If
 * `accentScheme` is set but no items use the `accent:` prefix, the last
 * item automatically uses the accent scheme's first color.
 */
export function resolveColors(
  items: { color?: string | ColorDef }[],
  schemeName?: string,
  accentScheme?: string,
  shades?: ShadeMappings,
): ColorDef[] {
  // ── Color function intercept ───────────────────────────────
  // Color functions are detected before any named-scheme logic.
  // They handle their own hue distribution and shade assignment.
  if (schemeName && isColorFunction(schemeName)) {
    return resolveWithColorFunction(items, schemeName, shades);
  }

  // ── Named scheme resolution ────────────────────────────────
  const schemeColors = schemeName ? pick(schemeName, items.length) : null;
  const effectiveShades = shades ?? getShadeMappings(schemeName);

  // Accent scheme support
  const accentShades = accentScheme ? getShadeMappings(accentScheme) : null;
  const hasAccentPrefix = accentScheme && items.some(
    (item) => typeof item.color === "string" && item.color.startsWith("accent:"),
  );

  return items.map((item, i) => {
    if (item.color && typeof item.color === "string") {
      // accent: prefix — resolve through accent scheme
      if (item.color.startsWith("accent:") && accentScheme && accentShades) {
        const ref = item.color.slice(7); // strip "accent:"
        if (isSemanticRole(ref)) {
          const hue = roleToHue(ref, accentScheme);
          return resolveWithShades(hue, accentShades);
        }
        // Palette color name — resolve with accent scheme's shades
        return resolveWithShades(ref, accentShades);
      }
      // Semantic role names ("primary", "danger") resolve through the role system
      if (isSemanticRole(item.color)) {
        const hue = roleToHue(item.color, schemeName);
        return resolveWithShades(hue, effectiveShades);
      }
      // Bare palette name with active scheme — use scheme shade mappings
      // so accent borders match the scheme's intended intensity
      if (schemeName && scales[item.color]) {
        return resolveWithShades(item.color, effectiveShades);
      }
      return resolve(item.color);
    }
    if (item.color) {
      // ColorDef object — pass through
      return resolve(item.color);
    }
    // Auto-accent: last item gets accent scheme's first color when no explicit accent: prefixes
    if (accentScheme && accentShades && !hasAccentPrefix && i === items.length - 1) {
      const accentColors = pick(accentScheme, 1);
      return resolveWithShades(accentColors[0], accentShades);
    }
    if (schemeColors) return resolveWithShades(schemeColors[i], effectiveShades);
    // No scheme, no explicit color → gray with whatever shades we have
    return resolveWithShades("gray", effectiveShades);
  });
}
