/**
 * Semantic-aware primitive components
 * These are building blocks for composing larger sections with semantic styles
 */

import { CTA, Cohesion } from "./types.js";
import { SemanticStyles } from "./semantic.js";
import { escapeHTML } from "./renderer.js";

/**
 * Render a heading with semantic styles
 */
export function renderHeading(
  text: string,
  level: 1 | 2 | 3 | 4,
  styles: SemanticStyles,
  options: { id?: string } = {}
): string {
  const headingClasses = styles.typography.heading;
  const textColorClass = styles.colors.text;
  const tag = `h${level}`;

  const idAttr = options.id ? ` id="${escapeHTML(options.id)}"` : "";

  return `<${tag}${idAttr} class="${headingClasses} ${textColorClass}">${escapeHTML(text)}</${tag}>`;
}

/**
 * Render a paragraph with semantic styles
 */
export function renderParagraph(
  text: string,
  styles: SemanticStyles,
  variant: "body" | "muted" | "lead" = "body"
): string {
  let classes = "leading-relaxed";

  if (variant === "body") {
    classes = `${styles.typography.body} ${styles.colors.text} ${classes}`;
  } else if (variant === "muted") {
    classes = `${styles.typography.muted} ${styles.colors.textMuted} ${classes}`;
  } else if (variant === "lead") {
    classes = `${styles.typography.body} font-semibold text-lg ${styles.colors.text} ${classes}`;
  }

  return `<p class="${classes}">${escapeHTML(text)}</p>`;
}

/**
 * Render a CTA button with semantic styles
 */
export function renderButton(
  cta: CTA,
  styles: SemanticStyles,
  variant: "primary" | "secondary" = "primary"
): string {
  let classes: string;

  if (variant === "primary") {
    classes = `${styles.interactive.buttonPrimary} px-8 py-3 rounded-lg font-medium inline-flex items-center justify-center transition-colors`;
  } else {
    classes = `${styles.interactive.buttonSecondary} px-8 py-3 rounded-lg font-medium inline-flex items-center justify-center transition-colors`;
  }

  return `<a href="${escapeHTML(cta.href)}" class="${classes}">${escapeHTML(cta.text)}</a>`;
}

/**
 * Render a semantic container (wrapper div with styles)
 */
export function renderContainer(
  content: string,
  styles: SemanticStyles,
  options: { id?: string; maxWidth?: string } = {}
): string {
  const idAttr = options.id ? ` id="${escapeHTML(options.id)}"` : "";
  const maxWidthClass = options.maxWidth || "max-w-6xl";

  const classes = `
    ${styles.container.padding}
    ${styles.container.margin}
    ${styles.container.background}
    ${styles.colors.background}
    ${maxWidthClass}
    mx-auto px-4 md:px-6 lg:px-8
  `.trim().replace(/\s+/g, " ");

  return `<section${idAttr} class="${classes}">${content}</section>`;
}

/**
 * Render a visual separator/divider based on cohesion
 */
export function renderSeparator(cohesion: Cohesion, styles: SemanticStyles): string {
  const dividerClass = styles.container.divider;

  // Different cohesion values need different separators
  if (!dividerClass || dividerClass === "border-0" || dividerClass === "") {
    return "";
  }

  return `<div class="${dividerClass}"></div>`;
}

/**
 * Render a feature item (icon + title + description)
 */
export function renderFeatureItem(
  item: {
    icon?: string;
    title: string;
    description: string;
    link?: string;
  },
  styles: SemanticStyles
): string {
  const iconHTML = item.icon
    ? `<div class="mb-4 text-4xl">${escapeHTML(item.icon)}</div>`
    : "";

  const titleHTML = `<h3 class="${styles.typography.heading.replace(/text-\d+xl/, "text-xl")} ${styles.colors.text} mb-2">${escapeHTML(item.title)}</h3>`;

  const descHTML = `<p class="${styles.colors.textMuted} text-sm">${escapeHTML(item.description)}</p>`;

  const linkHTML = item.link
    ? `<a href="${escapeHTML(item.link)}" class="${styles.interactive.link} text-sm font-medium mt-3 inline-block">Learn more →</a>`
    : "";

  return `
    <div class="p-6">
      ${iconHTML}
      ${titleHTML}
      ${descHTML}
      ${linkHTML}
    </div>
  `.trim();
}

/**
 * Render a link with semantic styles
 */
export function renderLink(
  text: string,
  href: string,
  styles: SemanticStyles,
  options: { newTab?: boolean; underline?: boolean } = {}
): string {
  const targetAttr = options.newTab ? ' target="_blank" rel="noopener"' : "";
  const underlineClass = options.underline !== false ? "hover:underline" : "";

  return `<a href="${escapeHTML(href)}" class="${styles.interactive.link} ${underlineClass}"${targetAttr}>${escapeHTML(text)}</a>`;
}

/**
 * Render a grid wrapper with responsive classes
 */
export function renderGrid(
  content: string,
  columns: 1 | 2 | 3 | 4 = 3
): string {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return `<div class="grid ${gridClasses[columns]} gap-6">${content}</div>`;
}

/**
 * Render a text wrapper with semantic color classes
 */
export function renderText(
  text: string,
  styles: SemanticStyles,
  options: { muted?: boolean; strong?: boolean } = {}
): string {
  const colorClass = options.muted ? styles.colors.textMuted : styles.colors.text;
  const weightClass = options.strong ? "font-semibold" : "font-normal";

  return `<span class="${colorClass} ${weightClass}">${escapeHTML(text)}</span>`;
}

export default {
  renderHeading,
  renderParagraph,
  renderButton,
  renderContainer,
  renderSeparator,
  renderFeatureItem,
  renderLink,
  renderGrid,
  renderText,
};
