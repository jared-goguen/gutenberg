/**
 * OKLCH color engine — perceptually uniform color math for shade generation.
 *
 * Implements:
 *   - sRGB ↔ Oklab ↔ OKLCH conversion (Björn Ottosson, 2020)
 *   - Shade scale generation (11 shades per hue, Tailwind-style 50–950)
 *   - WCAG 2.1 contrast ratio calculation
 *   - Contrast pair selection (auto-pick text color for AA compliance)
 *   - sRGB gamut clamping via chroma reduction
 *
 * All output is sRGB RGB for Confluence inline styles.
 * Internal math uses OKLCH for perceptual uniformity.
 */

// ── Types ────────────────────────────────────────────────────

/** Linear RGB (0–1 range, not gamma-encoded) */
export interface LinRGB { r: number; g: number; b: number }

/** sRGB (0–255 range, gamma-encoded) */
export interface SRGB { r: number; g: number; b: number }

/** Oklab perceptual color space */
interface Oklab { L: number; a: number; b: number }

/** OKLCH polar form of Oklab */
export interface OKLCH { L: number; C: number; H: number }

/** A shade in the scale: name, shade number, and resolved sRGB */
export interface Shade {
  step: number;      // 50, 100, 200, ..., 900, 950
  rgb: SRGB;
  oklch: OKLCH;
}

/** Full shade scale for a hue */
export interface ShadeScale {
  name: string;
  shades: Shade[];
}

// ── Shade steps ──────────────────────────────────────────────

/** Standard shade steps, Tailwind-style */
export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ShadeStep = (typeof SHADE_STEPS)[number];

/**
 * Target lightness for each shade step (OKLCH L, 0–1).
 * Designed so:
 *   - 50 = light background tint (L ≈ 0.96) — low enough for visible chroma
 *   - 500 = vivid midtone, the "base" color (L ≈ 0.57) — warm-hue-friendly
 *   - 900 = dark text (L ≈ 0.25)
 *   - 950 = near-black (L ≈ 0.18)
 *
 * These follow a perceptually uniform curve in OKLCH,
 * unlike HSL where yellow-50% looks far lighter than blue-50%.
 *
 * Tuned for sRGB gamut: shade 50 at 0.96 (not 0.97) opens 40-60% more
 * chroma headroom for tints. Shade 500 at 0.57 (not 0.55) gives warm
 * hues ~10% more gamut room without perceptible lightness change.
 */
const LIGHTNESS_CURVE: Record<ShadeStep, number> = {
  50:  0.96,
  100: 0.93,
  200: 0.87,
  300: 0.78,
  400: 0.67,
  500: 0.57,
  600: 0.48,
  700: 0.39,
  800: 0.31,
  900: 0.25,
  950: 0.18,
};

/**
 * Chroma curve: how saturated each shade should be relative to the base.
 * Light tints (50–200) have reduced chroma (gentle pastels).
 * Mid-tones (400–600) are most vivid.
 * Dark shades (700–950) stay aggressive — in dark-mode UI these are the
 * primary color carriers, not natural shadow variants. The sRGB gamut
 * boundary is the real limiter at low lightness; requesting high chroma
 * here just pushes us toward the boundary. Gamut clamping is the safety net.
 */
const CHROMA_CURVE: Record<ShadeStep, number> = {
  50:  0.55,
  100: 0.60,
  200: 0.75,
  300: 0.85,
  400: 0.95,
  500: 1.00,
  600: 0.95,
  700: 0.94,
  800: 0.96,
  900: 0.92,
  950: 0.82,
};

/**
 * Gamut fill cap: maximum multiplier over artistic intent from gamut fill.
 * Prevents wide-gamut hues (blue, violet) from blowing up to neon while
 * still allowing the aggressive chroma curve to push narrow-gamut hues
 * (orange, amber) to their boundary. Only applies to chromatic hues.
 *
 * At each step, if the artistic target uses < 40% of available gamut,
 * we boost up to min(artisticC × CAP, maxC). This helps shades that are
 * far below the gamut boundary without affecting already-saturated ones.
 */
const GAMUT_FILL_CAP = 1.3;
const GAMUT_FILL_THRESHOLD = 0.40;

/**
 * Minimum gamut utilization for chromatic hues at dark shades.
 * At low lightness the sRGB gamut boundary shrinks — colors that were
 * vivid at shade 500 become muted at 800. This floor guarantees we use
 * at least N% of available gamut at each dark step, preventing muddy
 * dark-mode cards where the artistic target undershoots the boundary.
 *
 * Only applies to chromatic hues (baseChroma > 0.03) at shade 700+.
 * Light shades are intentionally gentle (pastels) so no floor is needed.
 */
const MIN_GAMUT_UTIL: Partial<Record<ShadeStep, number>> = {
  500: 0.40,
  600: 0.50,
  700: 0.55,
  800: 0.65,
  900: 0.75,
  950: 0.80,
};

// ── sRGB ↔ Linear RGB ───────────────────────────────────────

/** sRGB gamma → linear */
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Linear → sRGB gamma */
function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255)));
}

export function srgbToLinRGB(rgb: SRGB): LinRGB {
  return {
    r: srgbToLinear(rgb.r),
    g: srgbToLinear(rgb.g),
    b: srgbToLinear(rgb.b),
  };
}

export function linRGBToSrgb(lin: LinRGB): SRGB {
  return {
    r: linearToSrgb(lin.r),
    g: linearToSrgb(lin.g),
    b: linearToSrgb(lin.b),
  };
}

// ── Linear RGB ↔ Oklab ──────────────────────────────────────

/**
 * Linear sRGB → Oklab.
 * Via the M1 (sRGB→LMS) and M2 (LMS→Oklab) matrices from Björn Ottosson.
 */
export function linRGBToOklab(rgb: LinRGB): Oklab {
  // sRGB → approximate LMS (via Ottosson's M1)
  const l = 0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b;
  const m = 0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b;
  const s = 0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b;

  // Cube root (perceptual)
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS → Oklab (M2)
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/**
 * Oklab → Linear sRGB.
 * Inverse of the above: M2⁻¹ then cube, then M1⁻¹.
 */
export function oklabToLinRGB(lab: Oklab): LinRGB {
  // Oklab → LMS' (M2 inverse)
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

  // Undo cube root
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → linear sRGB (M1 inverse)
  return {
    r:  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

// ── Oklab ↔ OKLCH ────────────────────────────────────────────

export function oklabToOklch(lab: Oklab): OKLCH {
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let H = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: lab.L, C, H };
}

export function oklchToOklab(lch: OKLCH): Oklab {
  const hRad = (lch.H * Math.PI) / 180;
  return {
    L: lch.L,
    a: lch.C * Math.cos(hRad),
    b: lch.C * Math.sin(hRad),
  };
}

// ── High-level conversions ───────────────────────────────────

/** sRGB (0–255) → OKLCH */
export function srgbToOklch(rgb: SRGB): OKLCH {
  return oklabToOklch(linRGBToOklab(srgbToLinRGB(rgb)));
}

/** OKLCH → sRGB (0–255), clamped to gamut */
export function oklchToSrgb(lch: OKLCH): SRGB {
  return gamutClamp(lch);
}

// ── Gamut clamping ───────────────────────────────────────────

/** Check if a linear RGB value is within sRGB gamut (with small epsilon) */
function inGamut(lin: LinRGB): boolean {
  const eps = -0.001;
  const max = 1.001;
  return (
    lin.r >= eps && lin.r <= max &&
    lin.g >= eps && lin.g <= max &&
    lin.b >= eps && lin.b <= max
  );
}

/**
 * Find the maximum in-gamut chroma for a given lightness and hue.
 * Binary search on C from 0 to 0.4 (practical OKLCH max).
 * Returns the max chroma that stays within sRGB.
 */
export function maxChromaAt(L: number, H: number): number {
  let lo = 0;
  let hi = 0.4; // OKLCH chroma rarely exceeds this in sRGB

  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    const candidate = oklabToLinRGB(oklchToOklab({ L, C: mid, H }));
    if (inGamut(candidate)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return lo;
}

/**
 * Clamp an OKLCH color to sRGB gamut by reducing chroma.
 * Binary search on C until the color fits in [0,255].
 * Preserves L and H — only saturation changes.
 */
export function gamutClamp(lch: OKLCH): SRGB {
  // Try unclamped first
  const direct = oklabToLinRGB(oklchToOklab(lch));
  if (inGamut(direct)) return linRGBToSrgb(direct);

  // Binary search: reduce chroma until in gamut
  let lo = 0;
  let hi = lch.C;
  let bestRgb = linRGBToSrgb(direct); // fallback

  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    const candidate = oklabToLinRGB(oklchToOklab({ L: lch.L, C: mid, H: lch.H }));
    if (inGamut(candidate)) {
      lo = mid;
      bestRgb = linRGBToSrgb(candidate);
    } else {
      hi = mid;
    }
  }

  return bestRgb;
}

// ── WCAG Contrast ────────────────────────────────────────────

/**
 * Relative luminance per WCAG 2.1 §1.4.3.
 * Uses the standard sRGB linearization, not Oklab L.
 */
export function relativeLuminance(rgb: SRGB): number {
  const lin = srgbToLinRGB(rgb);
  return 0.2126 * lin.r + 0.7152 * lin.g + 0.0722 * lin.b;
}

/**
 * WCAG 2.1 contrast ratio between two sRGB colors.
 * Returns a value ≥ 1 (e.g. 4.5 for AA normal text).
 */
export function contrastRatio(a: SRGB, b: SRGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if two colors meet a WCAG contrast level.
 */
export function meetsContrast(a: SRGB, b: SRGB, level: "AA" | "AAA" | "AA-large" = "AA"): boolean {
  const ratio = contrastRatio(a, b);
  switch (level) {
    case "AA":       return ratio >= 4.5;
    case "AAA":      return ratio >= 7.0;
    case "AA-large": return ratio >= 3.0;
  }
}

// ── Shade scale generation ───────────────────────────────────

/**
 * Generate 11 perceptually uniform shades from a base hue angle and chroma.
 *
 * Process:
 * 1. For each step (50–950), apply the lightness from LIGHTNESS_CURVE
 * 2. Compute the max in-gamut chroma at that (L, H) point
 * 3. Choose chroma via two competing strategies:
 *    a. Artistic: baseChroma × CHROMA_CURVE[step] — scales from the hue's peak
 *    b. Gamut-fill: maxChroma × GAMUT_FILL[step] — ensures minimum vibrancy
 * 4. For chromatic hues, take the higher of (a, b), capped at maxChroma
 * 5. For neutrals (baseChroma ≤ 0.03), use artistic only — no gamut-fill
 *
 * This two-strategy approach prevents muddiness: light tints get visible
 * saturation instead of near-white, and dark warm shades stay saturated
 * instead of turning brown.
 */
export function generateShadeScale(
  name: string,
  hue: number,
  baseChroma: number,
): ShadeScale {
  const isChromatic = baseChroma > 0.03;

  const shades: Shade[] = SHADE_STEPS.map((step) => {
    const targetL = LIGHTNESS_CURVE[step];
    const maxC = maxChromaAt(targetL, hue);

    // Artistic intent: scale from the hue's peak chroma
    const artisticC = baseChroma * CHROMA_CURVE[step];

    let targetC: number;
    if (isChromatic && maxC > 0.005) {
      const utilization = artisticC / maxC;
      if (utilization < GAMUT_FILL_THRESHOLD) {
        // Under-utilizing gamut — boost up to cap × artistic, capped at gamut
        targetC = Math.min(artisticC * GAMUT_FILL_CAP, maxC);
      } else {
        // Normal or over-saturated — artistic intent, capped at gamut
        targetC = Math.min(artisticC, maxC);
      }
      // Floor: at dark shades, ensure minimum gamut utilization.
      // Prevents muddy cards in dark-mode schemes where the artistic
      // target undershoots what the gamut boundary actually allows.
      const minUtil = MIN_GAMUT_UTIL[step];
      if (minUtil !== undefined) {
        const floorC = minUtil * maxC;
        if (targetC < floorC) targetC = floorC;
      }
    } else {
      // Neutrals: artistic only, capped at gamut
      targetC = Math.min(artisticC, maxC);
    }

    const oklch: OKLCH = { L: targetL, C: targetC, H: hue };
    const rgb = gamutClamp(oklch);
    // Re-derive actual OKLCH from clamped RGB for accuracy
    const actualOklch = srgbToOklch(rgb);
    return { step, rgb, oklch: actualOklch };
  });

  return { name, shades };
}

/**
 * Generate a shade scale from an existing sRGB color.
 * Extracts the hue and uses max gamut chroma for that hue.
 */
export function shadeScaleFromRgb(name: string, rgb: SRGB): ShadeScale {
  const oklch = srgbToOklch(rgb);
  return generateShadeScale(name, oklch.H, oklch.C);
}

/**
 * Get a specific shade from a scale.
 */
export function getShade(scale: ShadeScale, step: ShadeStep): Shade {
  const shade = scale.shades.find((s) => s.step === step);
  if (!shade) throw new Error(`Shade step ${step} not found in scale "${scale.name}"`);
  return shade;
}

// ── RGB string helpers ───────────────────────────────────────

/** Parse "rgb(R,G,B)" string to SRGB */
export function parseRgbString(rgb: string): SRGB {
  const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!match) throw new Error(`Cannot parse RGB string: "${rgb}"`);
  return { r: +match[1], g: +match[2], b: +match[3] };
}

/** Format SRGB to "rgb(R,G,B)" string for inline styles */
export function formatRgb(rgb: SRGB): string {
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

/**
 * Find the best text color for a given background from a shade scale.
 * Searches from darkest shades (950, 900, ...) for WCAG AA compliance.
 * Falls back to black or white if no shade meets contrast.
 */
export function contrastText(
  bgRgb: SRGB,
  scale: ShadeScale,
  level: "AA" | "AAA" | "AA-large" = "AA",
): Shade {
  // Try dark shades first (most common for text on light bg)
  const darkShades = [...scale.shades].reverse();
  for (const shade of darkShades) {
    if (meetsContrast(bgRgb, shade.rgb, level)) return shade;
  }
  // Try light shades (for text on dark bg)
  for (const shade of scale.shades) {
    if (meetsContrast(bgRgb, shade.rgb, level)) return shade;
  }
  // Absolute fallback — return darkest or lightest shade
  const black: SRGB = { r: 0, g: 0, b: 0 };
  const white: SRGB = { r: 255, g: 255, b: 255 };
  const useBlack = contrastRatio(bgRgb, black) >= contrastRatio(bgRgb, white);
  return useBlack ? scale.shades[scale.shades.length - 1] : scale.shades[0];
}
