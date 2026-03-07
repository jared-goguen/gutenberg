/**
 * Gutenberg OKLCH Color System
 *
 * Converts semantic color expressions into OKLCH CSS values
 * using perceptually uniform color space for algorithmic palette generation
 */

import { oklch, formatCss, parse as parseColor } from "culori";
import { hues, lightnessStops, chromaMultipliers } from "./palettes.js";

/**
 * Generate an OKLCH color palette for a hue name
 * Returns a Record<step, oklch_css_string>
 */
export function generateColorScale(
  hueName: string
): Record<number, string> {
  const hueDefinition = hues[hueName];
  if (!hueDefinition) {
    throw new Error(`Unknown hue: ${hueName}`);
  }

  const scale: Record<number, string> = {};

  for (const { step, l } of lightnessStops) {
    const cMult = chromaMultipliers[step];
    const c = hueDefinition.cPeak * cMult;
    const h = hueDefinition.h;

    // Create OKLCH color
    const color = oklch({ l, c, h });

    // Serialize to CSS oklch() string
    const cssValue = formatCss(color);
    scale[step] = cssValue;
  }

  return scale;
}

/**
 * Parse a color expression and resolve it to an OKLCH CSS value
 *
 * Examples:
 * - "primary.500" → resolves primary hue to step 500
 * - "neutral.50" → resolves neutral hue to step 50
 * - "white" → oklch(100% 0 0)
 * - "black" → oklch(0% 0 0)
 * - "grad(primary, neutral)" → linear-gradient in oklch space
 * - "alpha(primary.500, 60)" → color with 60% opacity
 */
export function parseColorExpr(
  expr: string,
  hueBindings: Record<string, string>,
  allScales: Record<string, Record<number, string>>
): string {
  expr = expr.trim();

  // Named constants
  if (expr === "white") return "oklch(100% 0 0)";
  if (expr === "black") return "oklch(0% 0 0)";

  // HueName.Step format: "primary.500", "neutral.50"
  const stepMatch = expr.match(/^([a-z]+)\.(\d+)$/i);
  if (stepMatch) {
    const [, hueName, stepStr] = stepMatch;
    const step = parseInt(stepStr);

    // Resolve alias to actual hue
    const resolvedHue = hueBindings[hueName];
    if (!resolvedHue) {
      throw new Error(`Unknown hue alias in expression: ${expr}`);
    }

    const scale = allScales[resolvedHue];
    if (!scale) {
      throw new Error(`No scale generated for hue: ${resolvedHue}`);
    }

    const color = scale[step];
    if (!color) {
      throw new Error(
        `No step ${step} in scale for hue ${resolvedHue} (expression: ${expr})`
      );
    }

    return color;
  }

  // grad(hue1, hue2) format: linear-gradient in oklch space
  const gradMatch = expr.match(/^grad\(([a-z]+),\s*([a-z]+)\)$/i);
  if (gradMatch) {
    const [, hue1Alias, hue2Alias] = gradMatch;

    const hue1 = hueBindings[hue1Alias];
    const hue2 = hueBindings[hue2Alias];
    if (!hue1 || !hue2) {
      throw new Error(
        `Unknown hue alias in gradient: ${expr}`
      );
    }

    const scale1 = allScales[hue1];
    const scale2 = allScales[hue2];
    if (!scale1 || !scale2) {
      throw new Error(
        `Cannot generate gradient: missing scale for ${!scale1 ? hue1 : hue2}`
      );
    }

    const color1 = scale1[500];
    const color2 = scale2[500];

    return `linear-gradient(in oklch, ${color1} 0%, ${color2} 100%)`;
  }

  // alpha(expr, pct) format: color with opacity
  const alphaMatch = expr.match(/^alpha\(([^,]+),\s*(\d+)\)$/i);
  if (alphaMatch) {
    const [, innerExpr, pctStr] = alphaMatch;
    const pct = parseInt(pctStr);
    const base = parseColorExpr(innerExpr, hueBindings, allScales);

    // Parse the resolved color and add opacity
    const c = parseColor(base);
    if (!c) {
      throw new Error(`Could not parse color from expression: ${innerExpr}`);
    }

    // Add alpha channel
    (c as any).alpha = pct / 100;

    // Serialize back to CSS
    return formatCss(c);
  }

  // If it looks like an OKLCH literal, validate and return it
  if (expr.startsWith("oklch(")) {
    const c = parseColor(expr);
    if (!c) {
      throw new Error(`Invalid OKLCH literal: ${expr}`);
    }
    return formatCss(c);
  }

  throw new Error(`Could not parse color expression: ${expr}`);
}

/**
 * Resolved theme containing CSS variables and utility classes
 */
export interface ResolvedTheme {
  cssVars: string;          // :root { --color-primary: ...; ... }
  utilityClasses: string;   // .bg-primary { background-color: var(...); } ...
  tokens: Record<string, string>;  // token name → resolved oklch() string (for components)
}

/**
 * Resolve a ThemeSpec into CSS custom properties and utility classes
 */
export function resolveThemeSpec(
  hueBindings: Record<string, string>,
  tokenExpressions: Record<string, string>
): ResolvedTheme {
  // Generate all required hue scales
  const allScales: Record<string, Record<number, string>> = {};
  const usedHues = new Set(Object.values(hueBindings));

  for (const hueName of usedHues) {
    allScales[hueName] = generateColorScale(hueName);
  }

  // Resolve all token expressions
  const resolvedTokens: Record<string, string> = {};
  for (const [tokenName, expr] of Object.entries(tokenExpressions)) {
    resolvedTokens[tokenName] = parseColorExpr(expr, hueBindings, allScales);
  }

  // Generate CSS variable declarations
  let cssVars = ":root {\n";

  // Include all hue scales as raw CSS vars
  for (const [hueName, scale] of Object.entries(allScales)) {
    for (const [step, value] of Object.entries(scale)) {
      cssVars += `  --${hueName}-${step}: ${value};\n`;
    }
  }

  // Include resolved token vars
  for (const [tokenName, value] of Object.entries(resolvedTokens)) {
    // Escape hyphens in token names by replacing with underscores in var names
    const varName = tokenName.replace(/-/g, "_");
    cssVars += `  --color-${varName}: ${value};\n`;
  }

  cssVars += "}\n";

  // Generate semantic utility classes
  const semanticClasses = [
    "bg-primary",
    "bg-primary-hover",
    "bg-page",
    "bg-subtle",
    "bg-inverse",
    "text-default",
    "text-muted",
    "text-inverse",
    "border-default",
    "bg-feature",
  ];

  let utilityClasses = "";
  for (const className of semanticClasses) {
    if (className.startsWith("bg-")) {
      const tokenName = className.slice(3); // "primary" from "bg-primary"
      const varName = tokenName.replace(/-/g, "_");
      utilityClasses += `.${className} { background-color: var(--color-${varName}); }\n`;
    } else if (className.startsWith("text-")) {
      const tokenName = className.slice(5); // "default" from "text-default"
      const varName = tokenName.replace(/-/g, "_");
      utilityClasses += `.${className} { color: var(--color-${varName}); }\n`;
    } else if (className.startsWith("border-")) {
      const tokenName = className.slice(7); // "default" from "border-default"
      const varName = tokenName.replace(/-/g, "_");
      utilityClasses += `.${className} { border-color: var(--color-${varName}); }\n`;
    }
  }

  return {
    cssVars,
    utilityClasses,
    tokens: resolvedTokens,
  };
}
