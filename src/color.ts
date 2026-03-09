/**
 * Color System - Re-exports from Chromata
 * 
 * This module re-exports the OKLCH color system from the chromata package
 * for backwards compatibility with gutenberg components.
 */

export {
  generateColorScale,
  parseColorExpr,
  resolveThemeSpec,
  type ResolvedTheme,
} from "chromata";

export {
  hues,
  lightnessStops,
  chromaMultipliers,
  type HueDefinition,
} from "chromata";
