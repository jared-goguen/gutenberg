/**
 * Content Section — Semantic-first rendering
 * Rich text content with markdown support and semantic typography
 */

import { ContentSection, RenderOptions } from "../types.js";
import { SemanticStyles } from "../semantic.js";
import { marked } from "marked";
import { renderContainer } from "../primitives.js";

/**
 * Main content renderer
 */
export function renderContent(
  section: ContentSection,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  const variant = section.variant || "prose";

  let htmlContent = "";

  if (section.markdown) {
    htmlContent = marked.parse(section.markdown) as string;
  } else if (section.html) {
    htmlContent = section.html;
  }

  // Apply semantic styles to markdown/html content
  const styledContent = applySemanticStylesToHTML(htmlContent, styles, options);

  // Width based on variant
  const widthClasses = {
    prose: "max-w-3xl",
    narrow: "max-w-2xl",
    wide: "max-w-5xl",
  };

  const maxWidth = widthClasses[variant as keyof typeof widthClasses] || widthClasses.prose;

  const innerContent = `
    <div class="${maxWidth} mx-auto">
      ${styledContent}
    </div>
  `.trim();

  return renderContainer(innerContent, styles, {
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * Apply semantic styles to HTML/markdown content
 * Wraps headers, paragraphs, lists with semantic classes
 */
function applySemanticStylesToHTML(
  html: string,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  // Replace heading tags with semantic styling
  let styledHTML = html;
  
  // Detect dark theme
  const isDarkTheme = options.theme?.name.toLowerCase() === "dark";

  // h1
  styledHTML = styledHTML.replace(
    /<h1([^>]*)>/g,
    `<h1$1 class="${styles.typography.heading} ${styles.colors.text}">`
  );

  // h2
  styledHTML = styledHTML.replace(
    /<h2([^>]*)>/g,
    `<h2$1 class="${styles.typography.heading.replace(/text-\d+xl/, "text-3xl")} ${styles.colors.text} mt-8 mb-4">`
  );

  // h3
  styledHTML = styledHTML.replace(
    /<h3([^>]*)>/g,
    `<h3$1 class="${styles.colors.text} text-xl font-semibold mt-6 mb-3">`
  );

  // Paragraphs
  styledHTML = styledHTML.replace(
    /<p([^>]*)>/g,
    `<p$1 class="${styles.typography.body} ${styles.colors.text} mb-4">`
  );

  // Unordered lists
  styledHTML = styledHTML.replace(
    /<ul([^>]*)>/g,
    `<ul$1 class="list-disc list-inside mb-4 ${styles.colors.text}">`
  );

  // Ordered lists
  styledHTML = styledHTML.replace(
    /<ol([^>]*)>/g,
    `<ol$1 class="list-decimal list-inside mb-4 ${styles.colors.text}">`
  );

  // List items
  styledHTML = styledHTML.replace(
    /<li([^>]*)>/g,
    `<li$1 class="mb-2 ${styles.colors.text}">`
  );

  // Code blocks - theme-aware
  const codeBlockClass = isDarkTheme
    ? "bg-neutral-800 text-neutral-100 px-2 py-1 rounded text-sm font-mono"
    : "bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono";
  styledHTML = styledHTML.replace(
    /<code([^>]*)>/g,
    `<code$1 class="${codeBlockClass}">`
  );

  // h2
  styledHTML = styledHTML.replace(
    /<h2([^>]*)>/g,
    `<h2$1 class="${styles.typography.heading.replace(/text-\d+xl/, "text-3xl")} ${styles.colors.text} mt-8 mb-4">`
  );

  // h3
  styledHTML = styledHTML.replace(
    /<h3([^>]*)>/g,
    `<h3$1 class="${styles.colors.text} text-xl font-semibold mt-6 mb-3">`
  );

  // h4, h5, h6
  styledHTML = styledHTML.replace(
    /<h[456]([^>]*)>/g,
    `<h$1 class="${styles.colors.text} text-lg font-semibold mt-4 mb-2">`
  );

  // Paragraphs
  styledHTML = styledHTML.replace(
    /<p([^>]*)>/g,
    `<p$1 class="${styles.typography.body} ${styles.colors.text} leading-relaxed mb-4">`
  );

  // Unordered lists
  styledHTML = styledHTML.replace(
    /<ul([^>]*)>/g,
    `<ul$1 class="list-disc list-inside mb-4 ${styles.colors.text}">`
  );

  // Ordered lists
  styledHTML = styledHTML.replace(
    /<ol([^>]*)>/g,
    `<ol$1 class="list-decimal list-inside mb-4 ${styles.colors.text}">`
  );

  // List items
  styledHTML = styledHTML.replace(
    /<li([^>]*)>/g,
    `<li$1 class="mb-2 ${styles.colors.text}">`
  );

  // Code blocks
  styledHTML = styledHTML.replace(
    /<code([^>]*)>/g,
    `<code$1 class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">`
  );

  // Blockquotes
  styledHTML = styledHTML.replace(
    /<blockquote([^>]*)>/g,
    `<blockquote$1 class="border-l-4 ${styles.colors.border} ${styles.colors.textMuted} pl-4 italic my-4">`
  );

  // Strong/bold
  styledHTML = styledHTML.replace(
    /<strong([^>]*)>/g,
    `<strong$1 class="font-bold ${styles.colors.text}">`
  );

  // Emphasis/italic
  styledHTML = styledHTML.replace(
    /<em([^>]*)>/g,
    `<em$1 class="italic ${styles.colors.text}">`
  );

  // Links
  styledHTML = styledHTML.replace(
    /<a([^>]*)>/g,
    `<a$1 class="${styles.interactive.link} hover:underline">`
  );

  return styledHTML;
}
