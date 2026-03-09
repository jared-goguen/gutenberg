/**
 * Features Section — Semantic-first rendering
 * Grid layouts for showcasing feature items with icons and descriptions
 */

import { FeaturesSection, RenderOptions } from "../types.js";
import { SemanticStyles } from "../semantic.js";
import {
  renderHeading,
  renderGrid,
  renderContainer,
} from "../primitives.js";
import { escapeHTML } from "../renderer.js";

/**
 * Main features renderer - dispatches to variant renderers
 */
export function renderFeatures(
  section: FeaturesSection,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  const variant = section.variant || "grid-3";

  switch (variant) {
    case "grid-2":
      return renderFeaturesGrid(section, styles, 2, options);
    case "grid-3":
      return renderFeaturesGrid(section, styles, 3, options);
    case "grid-4":
      return renderFeaturesGrid(section, styles, 4, options);
    case "list":
      return renderFeaturesList(section, styles, options);
    default:
      return renderFeaturesGrid(section, styles, 3, options);
  }
}

/**
 * Grid layout for features
 */
function renderFeaturesGrid(
  section: FeaturesSection,
  styles: SemanticStyles,
  columns: 2 | 3 | 4,
  options: RenderOptions
): string {
  // Header section (if heading/subheading provided)
  const header = section.heading || section.subheading
    ? `
      <div class="text-center mb-16">
        ${section.heading ? renderHeading(section.heading, 2, styles) : ""}
        ${
          section.subheading
            ? `<p class="${styles.colors.textMuted} text-lg mt-4 max-w-2xl mx-auto">${escapeHTML(section.subheading)}</p>`
            : ""
        }
      </div>
    `.trim()
    : "";

  // Grid of feature items
  const gridColsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const items = section.items
    .map((item) => renderFeatureItem(item, styles))
    .join("\n");

  const gridContent = `
    <div class="grid ${gridColsClass[columns]} gap-8">
      ${items}
    </div>
  `.trim();

  const innerContent = `
    ${header}
    ${gridContent}
  `
    .trim();

  return renderContainer(innerContent, styles, {
    vibe: section.vibe,
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * List layout for features (vertical stack with icons on left)
 */
function renderFeaturesList(
  section: FeaturesSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  // Header section
  const header = section.heading || section.subheading
    ? `
      <div class="text-center mb-16">
        ${section.heading ? renderHeading(section.heading, 2, styles) : ""}
        ${
          section.subheading
            ? `<p class="${styles.colors.textMuted} text-lg mt-4">${escapeHTML(section.subheading)}</p>`
            : ""
        }
      </div>
    `.trim()
    : "";

  // List items
  const items = section.items
    .map((item) => {
      const icon = item.icon ? `<div class="mr-6 ${styles.colors.accent}">${renderIcon(item.icon, { className: "w-12 h-12" })}</div>` : "";
      const link = item.link
        ? `<a href="${escapeHTML(item.link)}" class="${styles.interactive.link} text-sm font-medium mt-2 inline-block">Learn more →</a>`
        : "";

      return `
        <div class="flex mb-10 pb-10 border-b ${styles.colors.border}">
          ${icon}
          <div>
            <h3 class="${styles.colors.text} font-semibold text-lg mb-2">${escapeHTML(item.title)}</h3>
            <p class="${styles.colors.textMuted}">${escapeHTML(item.description)}</p>
            ${link}
          </div>
        </div>
      `.trim();
    })
    .join("\n");

  const listContent = `
    <div class="max-w-3xl mx-auto">
      ${items}
    </div>
  `.trim();

  const innerContent = `
    ${header}
    ${listContent}
  `
    .trim();

  return renderContainer(innerContent, styles, {
    vibe: section.vibe,
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * Render a single feature item card
 */
function renderFeatureItem(
  item: { icon?: string; title: string; description: string; link?: string },
  styles: SemanticStyles
): string {
  const iconHTML = item.icon
    ? `<div class="mb-4 ${styles.colors.accent}">${renderIcon(item.icon, { className: "w-10 h-10" })}</div>`
    : "";

  const linkHTML = item.link
    ? `<a href="${escapeHTML(item.link)}" class="${styles.interactive.link} text-sm font-medium mt-3 inline-block">Learn more →</a>`
    : "";

  return `
    <div class="p-6 rounded-lg ${styles.container.background} ${styles.emphasis.shadow} hover:${styles.emphasis.shadow} transition-shadow">
      ${iconHTML}
      <h3 class="${styles.colors.text} font-semibold text-lg mb-2">${escapeHTML(item.title)}</h3>
      <p class="${styles.colors.textMuted} text-sm mb-4">${escapeHTML(item.description)}</p>
      ${linkHTML}
    </div>
  `.trim();
}

/**
 * Import SVG icon rendering
 */
import { renderIcon } from "../icons.js";
