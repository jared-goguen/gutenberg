/**
 * Color themes — curated, ordered sequences of palette colors on dark surfaces.
 *
 * A theme is:
 *   - A color sequence (ordered palette names for auto-assignment)
 *   - A surface palette (dark background layers for platform-cooperative rendering)
 *   - Optional shade overrides (how palette names resolve to bg/text/border)
 *
 * All themes are dark-surface. There is no light mode or "dark-per-card" mode.
 * Renderers get ThemeTokens from resolveTheme() and never branch on mode.
 *
 * Themes are persisted in data/themes.json. addScheme() writes to that file.
 * This is the shared theme system used by xhtml-tools and svg-tools.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve as pathResolve, dirname } from "path";
import { fileURLToPath } from "url";
import { scales, reverseResolve, formatRgb } from "./palette.js";
import { getShade, SHADE_STEPS } from "./oklch.js";
import type { ShadeStep } from "./oklch.js";

const VALID_STEPS = new Set<number>(SHADE_STEPS);

// ── Data file location ───────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_PATH = pathResolve(__dirname, "data/themes.json");

// ── Types ────────────────────────────────────────────────────

export interface ShadeMappings {
  bg: ShadeStep;
  text: ShadeStep;
  border: ShadeStep;
  /**
   * Chroma energy multiplier. Modulates color saturation at resolve time.
   * < 1.0 = muted (light weight), 1.0 = neutral (regular), > 1.0 = bold (heavy weight).
   * Applied to bg/border shades; dampened (√energy) for text to preserve readability.
   * Omit or pass undefined for no modulation (energy = 1.0).
   */
  energy?: number;
}

interface SchemeSurface {
  /** CSS rgb — deepest: gaps, page-level negative space */
  base: string;
  /** CSS rgb — hero blocks, section labels, footer containers */
  deep: string;
  /** CSS rgb — standalone text blocks, mid-depth containers */
  mid: string;
  /** CSS rgb — card surfaces, raised content areas */
  raised: string;
}

/** Typography overrides — font-family stacks. */
interface SchemeTypography {
  /** Body text font. Inherits to all elements not explicitly assigned. */
  body?: string;
  /** Headings, titles, section labels, card titles. */
  heading?: string;
  /** Code blocks, data displays, inline code. */
  mono?: string;
  /** URL to a web font stylesheet (e.g. Google Fonts). Injected as <link> in document head. */
  fontUrl?: string;
}

/** Shape overrides — border-radius scale. */
interface SchemeShape {
  /** Small: badges, code chrome, subtle rounding (default: "4px"). */
  sm?: string;
  /** Medium: cards, callouts, code blocks (default: "8px"). */
  md?: string;
  /** Large: hero, containers, flow-chain (default: "12px"). */
  lg?: string;
}

/** Letter-spacing overrides. */
interface SchemeTracking {
  /** Headings and titles — typically negative (default: "-0.02em"). */
  tight?: string;
  /** Uppercase labels, eyebrows, section labels (default: "0.1em"). */
  wide?: string;
}

export interface ThemeDefinition {
  colors: string[];
  description: string;
  /** Override default shade mappings (bg=500, text=50, border=500) */
  shades?: ShadeMappings;
  /** Surface palette — dark background layers. Text colors are always inlined. */
  surface: SchemeSurface;
  /** Font-family overrides. Omitted fields use system defaults. */
  typography?: SchemeTypography;
  /** Border-radius scale overrides. */
  shape?: SchemeShape;
  /** Letter-spacing overrides. */
  tracking?: SchemeTracking;
  /** Which stylesheet to use for this theme. */
  stylesheet: 'classic' | 'cloudflare' | 'ink' | 'wire' | 'mono';
}

/** @deprecated Use ThemeDefinition instead. */
export type Scheme = ThemeDefinition;

/** Default shade mappings when a scheme doesn't specify its own */
const DEFAULT_SHADES: ShadeMappings = { bg: 50, text: 900, border: 500 };

// ── Typographic / shape defaults ─────────────────────────────

const DEFAULT_FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const DEFAULT_FONT_HEADING = DEFAULT_FONT_BODY;
const DEFAULT_FONT_MONO = "'SF Mono', Menlo, Monaco, 'Courier New', monospace";
const DEFAULT_RADIUS_SM = "4px";
const DEFAULT_RADIUS_MD = "8px";
const DEFAULT_RADIUS_LG = "12px";
const DEFAULT_TRACKING_TIGHT = "-0.02em";
const DEFAULT_TRACKING_WIDE = "0.1em";

/** The fallback scheme when none is specified */
export const DEFAULT_SCHEME = "cloudflare";

// ── Theme registry ───────────────────────────────────────────
// Loaded from data/themes.json at startup. addScheme() writes back.

export const themes: Record<string, ThemeDefinition> = {};

/** @deprecated Use themes instead. */
export const schemes = themes;

/** Names of built-in schemes at load time — protected from deletion */
const BUILTIN_SCHEMES = new Set<string>();

function loadThemes(): void {
  try {
    const raw = readFileSync(THEMES_PATH, "utf-8");
    const data = JSON.parse(raw) as Record<string, ThemeDefinition>;
    for (const [name, theme] of Object.entries(data)) {
      themes[name] = theme;
      BUILTIN_SCHEMES.add(name);
    }
  } catch (err) {
    // If the file doesn't exist, start with an empty registry.
    // This shouldn't happen in normal operation.
    console.error(`Warning: could not load themes from ${THEMES_PATH}: ${(err as Error).message}`);
  }
}

function saveThemes(): void {
  const json = JSON.stringify(themes, null, 2) + "\n";
  writeFileSync(THEMES_PATH, json, "utf-8");
}

// Load on module init
loadThemes();

// ── Theme CRUD ───────────────────────────────────────────────

/**
 * Register a new theme. Validates colors and shade steps, then
 * persists to data/themes.json.
 *
 * Throws if the name conflicts with a built-in theme.
 */
export function addTheme(
  name: string,
  colorNames: string[],
  description: string,
  surface: SchemeSurface,
  shades?: ShadeMappings,
  stylesheet: 'classic' | 'cloudflare' | 'ink' | 'wire' | 'mono' = 'classic',
): void {
  if (BUILTIN_SCHEMES.has(name)) {
    throw new Error(`Cannot overwrite built-in theme "${name}"`);
  }
  if (colorNames.length === 0) {
    throw new Error("Theme must have at least one color");
  }
  for (const c of colorNames) {
    if (!scales[c]) {
      const available = Object.keys(scales).join(", ");
      throw new Error(`Unknown palette color "${c}". Available: ${available}`);
    }
  }
  if (shades) {
    for (const [key, step] of Object.entries(shades)) {
      if (!VALID_STEPS.has(step)) {
        throw new Error(
          `Invalid shade step ${step} for "${key}". Valid: ${[...SHADE_STEPS].join(", ")}`,
        );
      }
    }
  }
  themes[name] = { colors: colorNames, description, surface, shades, stylesheet };
  saveThemes();
}

/** @deprecated Use addTheme instead. */
export const addScheme = addTheme;

/**
 * Remove a custom theme. Cannot remove built-in themes.
 * Persists the change to data/themes.json.
 * Returns true if removed, false if not found.
 */
export function removeTheme(name: string): boolean {
  if (BUILTIN_SCHEMES.has(name)) {
    throw new Error(`Cannot remove built-in theme "${name}"`);
  }
  if (!(name in themes)) return false;
  delete themes[name];
  saveThemes();
  return true;
}

/** @deprecated Use removeTheme instead. */
export const removeScheme = removeTheme;

/**
 * Check if a scheme is built-in (not removable).
 */
export function isBuiltinScheme(name: string): boolean {
  return BUILTIN_SCHEMES.has(name);
}

// ── Shade resolution ─────────────────────────────────────────

/**
 * Get the shade mappings for a scheme (or defaults).
 * Scheme-defined shades win, then DEFAULT_SHADES.
 */
export function getShadeMappings(schemeName?: string): ShadeMappings {
  if (schemeName) {
    const theme = themes[schemeName];
    if (theme?.shades) return theme.shades;
  }
  // No scheme or scheme without custom shades → universal light defaults.
  // Scheme-specific shades only apply when that scheme is explicitly requested.
  return DEFAULT_SHADES;
}



// ── Color picking ────────────────────────────────────────────

/**
 * Get the primary (first) hue name from a scheme.
 *
 * Use when you need the scheme's anchor color without pulling
 * the full scheme object. Returns the fallback if scheme is
 * unknown or empty.
 *
 * @example primaryHue("cloudflare") → "orange"
 */
export function primaryHue(schemeName: string, fallback = "orange"): string {
  const theme = themes[schemeName];
  return theme?.colors[0] ?? fallback;
}

/**
 * Pick n colors from a scheme. Returns palette color names.
 * For n ≤ scheme length: takes the first n.
 * For n > scheme length: wraps around.
 */
export function pick(schemeName: string, n: number): string[] {
  const theme = themes[schemeName];
  if (!theme) {
    const available = Object.keys(themes).join(", ");
    throw new Error(`Unknown scheme "${schemeName}". Available: ${available}`);
  }
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    result.push(theme.colors[i % theme.colors.length]);
  }
  return result;
}

// ── Surface helpers ──────────────────────────────────────────

/**
 * Get the surface palette for a scheme.
 * All schemes have surfaces, so this always returns a value for valid schemes.
 */
export function getSurface(schemeName?: string): SchemeSurface | null {
  const resolved = schemeName ?? DEFAULT_SCHEME;
  return themes[resolved]?.surface ?? null;
}

// ── Scheme detection ─────────────────────────────────────────

/**
 * Auto-detect which scheme was used based on RGB values found in content.
 * Checks surface fingerprints first (near-conclusive), then scores by
 * palette color overlap.
 * Returns the best match, or null if no scheme scores above threshold.
 */
export function detect(rgbValues: Set<string>): string | null {
  // Check surface fingerprints first — 2+ surface bg matches is near-conclusive
  for (const [themeName, theme] of Object.entries(themes)) {
    const surfaceRgbs = [theme.surface.base, theme.surface.deep, theme.surface.mid, theme.surface.raised];
    const surfaceHits = surfaceRgbs.filter((s) => rgbValues.has(s)).length;
    if (surfaceHits >= 2) return themeName;
  }

  // Reverse-map RGB values to palette names
  const foundNames = new Set<string>();
  for (const rgb of rgbValues) {
    const name = reverseResolve(rgb);
    if (name) {
      const base = name.replace(/-\d+$/, "");
      foundNames.add(base);
    }
  }
  if (foundNames.size === 0) return null;

  let bestScheme: string | null = null;
  let bestScore = 0;

  for (const [themeName, theme] of Object.entries(themes)) {
    const hits = theme.colors.filter((c) => foundNames.has(c)).length;
    const score = hits / theme.colors.length;
    if (score > bestScore) {
      bestScore = score;
      bestScheme = themeName;
    }
  }

  return bestScore >= 0.4 ? bestScheme : null;
}

// ── ThemeTokens ──────────────────────────────────────────────
// The single resolved truth for every color decision a renderer needs.

export interface ThemeTokens {
  /** Always "dark" — all schemes are dark-surface */
  mode: string;

  /** Always true — uniform dark backgrounds, platform controls text rendering */
  themeText: boolean;

  /** Surface layers — from the scheme's surface palette */
  surface: {
    /** Page-level background assumption */
    page: string;
    /** Deepest: gaps between elements, negative space */
    base: string;
    /** Hero blocks, section labels, dark containers */
    deep: string;
    /** Mid-depth: text block containers, table stripe alternate */
    mid: string;
    /** Card surfaces, raised content */
    raised: string;
  };

  /** Structural chrome — borders, gaps, dividers */
  chrome: {
    /** Between cards */
    gap: string;
    /** Table borders, section dividers */
    border: string;
    /** Horizontal rules */
    divider: string;
    /** Alternating row tint */
    stripe: string;
    /** Section label background */
    labelBg: string;
  };

  /**
   * Text tokens — concrete RGB values, always inlined by renderers.
   */
  text: {
    /** Headings, card titles */
    primary: string;
    /** Body paragraphs */
    body: string;
    /** Subtitles, metadata */
    muted: string;
    /** Captions, annotations */
    caption: string;
    /** Section labels — small-caps structural dividers */
    label: string;
    /** Anchor links */
    link: string;
  };

  /** First scheme color's accent border — for hero, closing, default accents */
  accent: string;

  /** Syntax highlighting tokens — semantic palette for code blocks */
  syntax: {
    /** Strings: emerald */
    string: string;
    /** Numeric literals: rose */
    number: string;
    /** Object properties/keys: sky */
    property: string;
    /** Type annotations: violet */
    type: string;
    /** Language builtins: amber */
    builtin: string;
    /** Constants: azure */
    constant: string;
  };

  /** Shade mappings — passed through to resolveColors */
  shades: ShadeMappings;

  /** Typography — font-family stacks by role */
  typography: {
    /** Body text and default inheritance root */
    body: string;
    /** Headings, titles, section labels, card titles */
    heading: string;
    /** Code blocks, inline code, data displays */
    mono: string;
  };

  /** Border-radius scale */
  radius: {
    /** Small: badges, code chrome (default 4px) */
    sm: string;
    /** Medium: cards, callouts, tables (default 8px) */
    md: string;
    /** Large: hero, containers (default 12px) */
    lg: string;
  };

  /** Letter-spacing scale */
  tracking: {
    /** Headings and titles (default -0.02em) */
    tight: string;
    /** Uppercase labels, eyebrows (default 0.1em) */
    wide: string;
  };

  /** Optional URL to a web font stylesheet. Injected as <link> in document head. */
  fontUrl?: string;

  /** Which stylesheet to use for this theme (classic, ink, wire, or mono). */
  stylesheet: 'classic' | 'cloudflare' | 'ink' | 'wire' | 'mono';
}

// ── Shade helpers for token derivation ───────────────────────

function neutralShade(step: ShadeStep): string {
  return formatRgb(getShade(scales.neutral, step).rgb);
}

function grayShade(step: ShadeStep): string {
  return formatRgb(getShade(scales.gray, step).rgb);
}

function blueShade(step: ShadeStep): string {
  return formatRgb(getShade(scales.blue, step).rgb);
}

// ── resolveTheme() ───────────────────────────────────────────

/**
 * Resolve all color decisions for a scheme into a ThemeTokens object.
 * This is the primary API — call once, use the returned tokens for
 * all color/layout decisions.
 *
 * All text colors are inlined — no platform dependency.
 *
 * @param scheme - Scheme name. Omit for cloudflare default.
 */
export function resolveTheme(scheme?: string): ThemeTokens {
  const resolved = scheme ?? DEFAULT_SCHEME;
  const s = themes[resolved];
  if (!s) {
    const available = Object.keys(themes).join(", ");
    throw new Error(`Unknown theme "${resolved}". Available: ${available}`);
  }

  const shades = s.shades ?? DEFAULT_SHADES;
  const surface = s.surface;

  // Accent: first scheme color at shade-400 for pop on dark backgrounds
  const firstColor = s.colors[0];
  const accentScale = scales[firstColor];
  const accent = accentScale
    ? formatRgb(getShade(accentScale, 400).rgb)
    : blueShade(500);

  return {
    mode: "dark",
    themeText: true,
    surface: {
      page: surface.base,
      base: surface.base,
      deep: surface.deep,
      mid: surface.mid,
      raised: surface.raised,
    },
    chrome: {
      gap: surface.base,
      border: surface.base,
      divider: neutralShade(700),
      stripe: surface.mid,
      labelBg: surface.raised,
    },
    text: {
      primary: neutralShade(100),
      body: neutralShade(300),
      muted: grayShade(400),
      caption: grayShade(500),
      label: neutralShade(300),
      link: blueShade(400),
    },
    accent,
    syntax: {
      string: formatRgb(getShade(scales.emerald, 300).rgb),
      number: formatRgb(getShade(scales.rose, 300).rgb),
      property: formatRgb(getShade(scales.sky, 300).rgb),
      type: formatRgb(getShade(scales.violet, 300).rgb),
      builtin: formatRgb(getShade(scales.amber, 300).rgb),
      constant: formatRgb(getShade(scales.azure, 300).rgb),
    },
    shades,
    typography: {
      body: s.typography?.body ?? DEFAULT_FONT_BODY,
      heading: s.typography?.heading ?? DEFAULT_FONT_HEADING,
      mono: s.typography?.mono ?? DEFAULT_FONT_MONO,
    },
    radius: {
      sm: s.shape?.sm ?? DEFAULT_RADIUS_SM,
      md: s.shape?.md ?? DEFAULT_RADIUS_MD,
      lg: s.shape?.lg ?? DEFAULT_RADIUS_LG,
    },
    tracking: {
      tight: s.tracking?.tight ?? DEFAULT_TRACKING_TIGHT,
      wide: s.tracking?.wide ?? DEFAULT_TRACKING_WIDE,
    },
    fontUrl: s.typography?.fontUrl,
    stylesheet: s.stylesheet ?? 'classic',
  };
}

// ── Energy helpers ────────────────────────────────────────────

/** Weight semantic names as used by xhtml-tools vibe axis */
export type Weight = "light" | "regular" | "heavy";

/**
 * Map a semantic weight name to a numeric energy multiplier.
 * Used by xhtml-tools to translate its vibe `weight` axis into
 * chromata's energy parameter without knowing the numeric values.
 *
 * - light  → 0.7 (desaturated, restrained)
 * - regular → 1.0 (no modulation)
 * - heavy  → 1.3 (saturated, assertive)
 */
export function energyFromWeight(weight: Weight): number {
  switch (weight) {
    case "light":   return 0.7;
    case "regular":  return 1.0;
    case "heavy":    return 1.3;
  }
}

// ── Backward compat re-exports ───────────────────────────────
// These existed in the old API. Keep them so xhtml-tools imports
// don't break, but they're trivial now.
