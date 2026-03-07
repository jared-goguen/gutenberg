/**
 * Hue palette definitions for OKLCH color generation
 * Each hue has an H (angle) and cPeak (maximum chroma for that hue)
 */

export interface HueDefinition {
  h: number;    // hue angle 0-360
  cPeak: number; // peak chroma for this hue at step 500
}

export const hues: Record<string, HueDefinition> = {
  // Primary/accent hues
  sky: { h: 220, cPeak: 0.190 },
  violet: { h: 280, cPeak: 0.215 },
  rose: { h: 10, cPeak: 0.220 },
  amber: { h: 75, cPeak: 0.170 },
  emerald: { h: 145, cPeak: 0.175 },

  // Neutral hues (mostly achromatic, with optional tint)
  slate: { h: 220, cPeak: 0.009 }, // slight cool tint
  neutral: { h: 0, cPeak: 0.000 }, // pure achromatic
};

/**
 * OKLCH lightness stops derived from Tailwind v4's palette
 * These are perceptually uniform steps that work across all hues
 */
export const lightnessStops = [
  { step: 50, l: 0.971 },
  { step: 100, l: 0.936 },
  { step: 200, l: 0.885 },
  { step: 300, l: 0.808 },
  { step: 400, l: 0.704 },
  { step: 500, l: 0.637 }, // ← peak chroma here
  { step: 600, l: 0.577 },
  { step: 700, l: 0.505 },
  { step: 800, l: 0.444 },
  { step: 900, l: 0.396 },
  { step: 950, l: 0.258 },
];

/**
 * Chroma multipliers per step (relative to the hue's cPeak)
 * Controls how vivid each step is
 */
export const chromaMultipliers: Record<number, number> = {
  50: 0.07,
  100: 0.14,
  200: 0.25,
  300: 0.45,
  400: 0.70,
  500: 1.00,  // ← peak
  600: 0.95,
  700: 0.85,
  800: 0.70,
  900: 0.55,
  950: 0.40,
};
