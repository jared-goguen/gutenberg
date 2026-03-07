import { PageLayout } from "../types.js";

/**
 * Get layout-specific CSS classes
 */
export function getLayoutClasses(layout?: PageLayout): Record<string, string> {
  const type = layout?.type || "standard";
  const theme = layout?.theme || "light";

  const containerClasses = {
    standard: "max-w-7xl",
    wide: "max-w-[1400px]",
    narrow: "max-w-4xl",
    docs: "max-w-7xl",
  };

  const themeClasses = {
    light: "bg-white text-gray-900",
    dark: "bg-gray-900 text-white",
    auto: "bg-white text-gray-900 dark:bg-gray-900 dark:text-white",
  };

  return {
    container: containerClasses[type],
    theme: themeClasses[theme],
  };
}

/**
 * Wrap content with layout-specific structure
 */
export function applyLayout(content: string, layout?: PageLayout): string {
  const classes = getLayoutClasses(layout);
  
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
