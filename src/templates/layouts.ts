import { PageLayout } from "../types.js";
import type { ThemeSpec } from "chromata";

/**
 * Get layout-specific CSS classes
 */
export function getLayoutClasses(layout?: PageLayout, theme?: ThemeSpec): Record<string, string> {
  const type = layout?.type || "standard";

  const containerClasses = {
    standard: "max-w-7xl",
    wide: "max-w-[1400px]",
    narrow: "max-w-4xl",
    docs: "max-w-7xl",
  };

  // Use semantic class names for background instead of hardcoded Tailwind
  const themeClasses = "bg-page text-default";

  return {
    container: containerClasses[type],
    theme: themeClasses,
  };
}

/**
 * Wrap content with layout-specific structure
 */
export function applyLayout(content: string, layout?: PageLayout, theme?: ThemeSpec): string {
  const classes = getLayoutClasses(layout, theme);
  
  // For docs layout, we might add a sidebar in the future
  if (layout?.type === "docs") {
    return `<div class="${classes.theme}">
  <div class="flex">
    <main class="flex-1">${content}</main>
  </div>
</div>`;
  }

  return `<div class="${classes.theme}">${content}</div>`;
}
