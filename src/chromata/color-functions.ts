/**
 * Color functions — composable distribution strategies for color assignment.
 *
 * Syntax: "function:arg1:arg2" in the scheme string.
 *
 * Functions:
 *   mono:sky          — single hue, shade graduation light→dark
 *   grad:sky:violet   — walk the hue ring between two endpoints
 *   div:emerald:vermillion — diverging: two extremes with neutral center
 *   pair:sky:vermillion    — alternating A/B pattern
 *   accent:sky:vermillion  — all items hue A, last item hue B
 *
 * These are consumer-agnostic. They return hue assignments and optional
 * per-item shade overrides. Consumers (svg-tools, xhtml-tools) adapt
 * the result to their own rendering model.
 */

import { scales, CHROMATIC_HUES } from "./palette.js";
import { SHADE_STEPS, maxChromaAt, srgbToOklch, getShade } from "./oklch.js";
import type { ShadeStep } from "./oklch.js";

// ── Types ────────────────────────────────────────────────────

/**
 * Result of a color function: per-item hue names and optional shade overrides.
 *
 * When `perItemShades` is undefined, the consumer uses its own default shades
 * uniformly (e.g., from ShadeMappings or ThemeContext). When present, each item
 * gets its own bg/text/border shade steps.
 */
export interface ColorFunctionResult {
  /** Per-item hue names (length = n) */
  hues: string[];
  /** Per-item shade overrides. Only set for functions that vary shades (mono, div). */
  perItemShades?: Array<{ bg: ShadeStep; text: ShadeStep; border: ShadeStep }>;
}

/** Valid color function names. */
type ColorFunctionName = "mono" | "grad" | "div" | "pair" | "accent";

const VALID_FUNCTIONS: ReadonlySet<string> = new Set<ColorFunctionName>(["mono", "grad", "div", "pair", "accent"]);

// ── Detection & Parsing ──────────────────────────────────────

/**
 * Check if a scheme string is a color function (vs a named scheme).
 * @example isColorFunction("grad:sky:violet") → true
 * @example isColorFunction("cloudflare") → false
 */
export function isColorFunction(scheme: string): boolean {
  return /^(mono|grad|div|pair|accent):/.test(scheme);
}

/**
 * Parse a color function string into function name and arguments.
 * @example parseColorFunction("grad:sky:violet") → { fn: "grad", args: ["sky", "violet"] }
 * @example parseColorFunction("cloudflare") → { fn: null, args: [] }
 */
export function parseColorFunction(scheme: string): { fn: ColorFunctionName | null; args: string[] } {
  const parts = scheme.split(":");
  const fn = parts[0];
  if (VALID_FUNCTIONS.has(fn)) {
    return { fn: fn as ColorFunctionName, args: parts.slice(1) };
  }
  return { fn: null, args: [] };
}

// ── Hue Ring ─────────────────────────────────────────────────

/**
 * Lightness of shade-500 in OKLCH. Used for chroma weighting.
 * Must match LIGHTNESS_CURVE[500] in oklch.ts.
 */
const SHADE_500_LIGHTNESS = 0.57;

/**
 * Walk the hue ring from `from` to `to`, producing `n` hue names.
 * Takes the shortest path around the OKLCH hue ring. If n=1, returns [from].
 * If from === to, returns n copies of that hue.
 *
 * Uses chroma-weighted spacing: hues with higher max chroma at shade-500
 * get more "air time" in the gradient, while low-chroma hues (gamut-limited
 * regions like yellow/teal) are compressed. This prevents the gradient from
 * lingering in muddy zones where sRGB gamut is narrow.
 *
 * The weighting is soft — it biases toward vivid hues without completely
 * skipping any. Endpoint hues are always included exactly.
 */
export function walkHueRing(from: string, to: string, n: number): string[] {
  if (n <= 0) return [];
  if (n === 1) return [from];
  if (from === to) return Array(n).fill(from);

  const fromIdx = CHROMATIC_HUES.indexOf(from);
  const toIdx = CHROMATIC_HUES.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) {
    return Array(n).fill(from);
  }

  const len = CHROMATIC_HUES.length;
  const fwd = (toIdx - fromIdx + len) % len;
  const bwd = (fromIdx - toIdx + len) % len;
  const step = fwd <= bwd ? 1 : -1;
  const distance = Math.min(fwd, bwd);

  // Build chroma weights for each hue on the path.
  // Weight = maxChroma directly — linear bias compresses low-chroma zones
  // (amber, yellow, teal) and gives more gradient real estate to vivid hues.
  const pathHues: { idx: number; weight: number }[] = [];
  for (let d = 0; d <= distance; d++) {
    const idx = (fromIdx + d * step + len) % len;
    const hueName = CHROMATIC_HUES[idx];
    const scale = scales[hueName];
    const hueAngle = srgbToOklch(getShade(scale, 500).rgb).H;
    const maxC = maxChromaAt(SHADE_500_LIGHTNESS, hueAngle);
    pathHues.push({ idx, weight: maxC });
  }

  // Build cumulative weight for interpolation
  const cumulative = [0];
  for (let i = 1; i < pathHues.length; i++) {
    // Weight for each segment is the average of adjacent hue weights
    const segWeight = (pathHues[i - 1].weight + pathHues[i].weight) / 2;
    cumulative.push(cumulative[i - 1] + segWeight);
  }
  const totalWeight = cumulative[cumulative.length - 1];

  // Sample n points evenly in cumulative-weight space
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    const targetW = (i / (n - 1)) * totalWeight;
    // Find the segment containing this weight
    let seg = 0;
    while (seg < cumulative.length - 1 && cumulative[seg + 1] < targetW) {
      seg++;
    }
    // Snap to the nearest hue (no sub-hue interpolation)
    const distInSeg = targetW - cumulative[seg];
    const segLen = (cumulative[seg + 1] ?? cumulative[seg]) - cumulative[seg];
    const snapIdx = segLen > 0 && distInSeg > segLen / 2 ? seg + 1 : seg;
    const idx = Math.min(snapIdx, pathHues.length - 1);
    result.push(CHROMATIC_HUES[pathHues[idx].idx]);
  }

  return result;
}

// ── Helpers ──────────────────────────────────────────────────

/** Valid shade steps in ascending order. */
const STEPS: number[] = [...SHADE_STEPS];

/**
 * Generate n shade steps graduated between lo and hi (inclusive).
 * Returns values snapped to the nearest valid shade step.
 */
export function graduateShades(n: number, lo: number, hi: number): ShadeStep[] {
  if (n <= 0) return [];
  if (n === 1) {
    const mid = Math.round((lo + hi) / 2);
    return [snapToStep(mid)];
  }
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const raw = lo + t * (hi - lo);
    return snapToStep(raw);
  });
}

/** Snap a number to the nearest valid shade step. */
function snapToStep(raw: number): ShadeStep {
  return STEPS.reduce((prev, curr) =>
    Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
  ) as ShadeStep;
}

/**
 * Validate that a hue name exists in the palette.
 * @throws if the hue is unknown
 */
export function assertHue(hue: string): void {
  if (!scales[hue]) {
    const available = Object.keys(scales).join(", ");
    throw new Error(`Unknown hue "${hue}". Available: ${available}`);
  }
}

// ── Color Function Implementations ───────────────────────────

/**
 * Monochrome: single hue, shade graduation from light to dark.
 * Dark mode: 300→700 (bright first, fading into dark bg).
 * Light mode: 100→500 (light first, deepening).
 */
function resolveMono(hue: string, n: number, dark: boolean): ColorFunctionResult {
  assertHue(hue);
  const hues = Array(n).fill(hue) as string[];

  const bgShades = dark
    ? graduateShades(n, 300, 700)
    : graduateShades(n, 100, 500);

  const perItemShades = bgShades.map((bg) => {
    const idx = STEPS.indexOf(bg);
    const border = STEPS[Math.min(idx + 2, STEPS.length - 1)] as ShadeStep;
    const text: ShadeStep = bg >= 500 ? 50 : 900;
    return { bg, text, border };
  });

  return { hues, perItemShades };
}

/**
 * Gradient: walk the hue ring from A to B with chroma-weighted spacing.
 *
 * Uses shade-400 (L=0.67) for backgrounds instead of the consumer's default
 * shade-500 (L=0.57). At higher lightness, ALL hues — especially warm ones
 * like amber, yellow, and orange — have significantly more sRGB chroma
 * headroom, producing vivid rather than muddy results.
 *
 * Text uses shade-950 (near-black) for WCAG AA compliance against the
 * lighter backgrounds. Border uses shade-600 for accent weight.
 */
function resolveGrad(from: string, to: string, n: number, dark: boolean): ColorFunctionResult {
  assertHue(from);
  assertHue(to);
  const hues = walkHueRing(from, to, n);

  const bg: ShadeStep = dark ? 400 : 200;
  const text: ShadeStep = dark ? 950 : 800;
  const border: ShadeStep = dark ? 600 : 400;
  const perItemShades = hues.map(() => ({ bg, text, border }));

  return { hues, perItemShades };
}

/**
 * Diverging: two extremes with neutral center. Shades intensify
 * toward the extremes and lighten toward the center.
 */
function resolveDiv(left: string, right: string, n: number, dark: boolean): ColorFunctionResult {
  assertHue(left);
  assertHue(right);

  const center = "slate";
  const hues: string[] = [];
  const mid = Math.floor(n / 2);

  for (let i = 0; i < n; i++) {
    if (i < mid) hues.push(left);
    else if (i === mid && n % 2 === 1) hues.push(center);
    else hues.push(right);
  }

  const perItemShades = Array.from({ length: n }, (_, i) => {
    const distFromCenter = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 || 1);
    const bgRaw = dark
      ? 200 + distFromCenter * 300   // center=200, edges=500
      : 100 + distFromCenter * 300;  // center=100, edges=400
    const bg = snapToStep(bgRaw);
    const idx = STEPS.indexOf(bg);
    const border = STEPS[Math.min(idx + 2, STEPS.length - 1)] as ShadeStep;
    const text: ShadeStep = bg >= 500 ? 50 : 900;
    return { bg, text, border };
  });

  return { hues, perItemShades };
}

/**
 * Pair: alternating A/B pattern. Uniform shades from consumer default.
 */
function resolvePair(a: string, b: string, n: number): ColorFunctionResult {
  assertHue(a);
  assertHue(b);
  const hues = Array.from({ length: n }, (_, i) => i % 2 === 0 ? a : b);
  return { hues };
}

/**
 * Accent: all items hue A, last item hue B. Uniform shades from consumer default.
 */
function resolveAccent(main: string, accent: string, n: number): ColorFunctionResult {
  assertHue(main);
  assertHue(accent);
  const hues = Array.from({ length: n }, (_, i) => i === n - 1 ? accent : main);
  return { hues };
}

// ── Entry Point ──────────────────────────────────────────────

/**
 * Resolve a color function string into per-item hue assignments.
 *
 * This is the primary API for consumers. Pass a color function string
 * (e.g., "grad:sky:violet") and the number of items. Returns hue names
 * and optional per-item shade overrides.
 *
 * @param scheme - Color function string (must pass isColorFunction check)
 * @param n - Number of items to assign colors to
 * @param dark - Dark mode (affects shade graduation for mono/div)
 * @throws if the scheme is not a valid color function or hues are unknown
 */
export function resolveColorFunction(scheme: string, n: number, dark = true): ColorFunctionResult {
  const { fn, args } = parseColorFunction(scheme);

  if (fn === null) {
    throw new Error(`"${scheme}" is not a color function. Use isColorFunction() to check first.`);
  }

  switch (fn) {
    case "mono":
      if (args.length < 1) throw new Error('mono requires a hue: "mono:sky"');
      return resolveMono(args[0], n, dark);
    case "grad":
      if (args.length < 2) throw new Error('grad requires two hues: "grad:sky:violet"');
      return resolveGrad(args[0], args[1], n, dark);
    case "div":
      if (args.length < 2) throw new Error('div requires two hues: "div:emerald:vermillion"');
      return resolveDiv(args[0], args[1], n, dark);
    case "pair":
      if (args.length < 2) throw new Error('pair requires two hues: "pair:sky:vermillion"');
      return resolvePair(args[0], args[1], n);
    case "accent":
      if (args.length < 2) throw new Error('accent requires two hues: "accent:sky:vermillion"');
      return resolveAccent(args[0], args[1], n);
    default:
      throw new Error(`Unknown color function "${fn}"`);
  }
}
