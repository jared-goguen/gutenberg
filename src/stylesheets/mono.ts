import type { ThemeTokens } from "../chromata/themes.js";
import { themeToCSS } from "../theme.js";
import { BASE_STYLES } from "./base.js";
import { MONO_THEME } from "./themes/mono.js";

/**
 * Mono stylesheet — disciplined brutalism on strict 8px grid.
 *
 * Near-black surfaces with red/vermillion accent (Swiss poster reference).
 * Helvetica Neue at normal weights 400–700. Zero radius, zero shadows.
 * Consistent horizontal containment — all blocks share the same 24px
 * left-edge padding. One vertical line, everything aligns.
 * Philosophy: "discipline is clarity."
 */
export function generateMonoStylesheet(t: ThemeTokens): string {
  return `${themeToCSS(t)}\n\n${BASE_STYLES}\n\n${MONO_THEME}`;
}
