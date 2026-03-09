/**
 * Hero Section — Semantic-first rendering
 * Completely rewritten to use SemanticStyles
 */

import { HeroSection, RenderOptions, CTA } from "../types.js";
import { SemanticStyles } from "../semantic.js";
import {
  renderHeading,
  renderParagraph,
  renderContainer,
} from "../primitives.js";
import { renderButton } from "./buttons.js";
import { escapeHTML } from "../renderer.js";

/**
 * Main hero renderer - dispatches to variant renderers
 */
export function renderHero(
  section: HeroSection,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  const variant = section.variant || "centered";

  switch (variant) {
    case "centered":
      return renderHeroCentered(section, styles, options);
    case "split":
      return renderHeroSplit(section, styles, options);
    case "full-bleed":
      return renderHeroFullBleed(section, styles, options);
    default:
      return renderHeroCentered(section, styles, options);
  }
}

/**
 * Centered Hero
 * Text and CTAs centered, optional image below
 */
function renderHeroCentered(
  section: HeroSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const { content } = section;
  const ctas = Array.isArray(content.cta)
    ? content.cta
    : content.cta
      ? [content.cta]
      : [];

  // Build inner content
  const heading = renderHeading(content.heading, 1, styles, {
    id: section.id ? `${section.id}-heading` : undefined,
  });

  const subheading = content.subheading
    ? `<p class="${styles.typography.body} ${styles.colors.text} text-xl md:text-2xl mb-8">${escapeHTML(content.subheading)}</p>`
    : "";

  const description = content.description
    ? renderParagraph(content.description, styles, "lead")
    : "";

  const ctaButtons = ctas.length
    ? `<div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
        ${ctas.map((cta) => renderButton(cta, styles, { variant: "primary" })).join("\n")}
      </div>`
    : "";

  const image = content.image
    ? `<div class="mt-16 rounded-lg overflow-hidden ${styles.emphasis.shadow}">
        <img src="${escapeHTML(content.image)}" alt="${escapeHTML(content.heading)}" class="w-full h-auto" />
      </div>`
    : "";

  const innerContent = `
    <div class="text-center max-w-4xl mx-auto">
      ${heading}
      ${subheading}
      ${description}
      ${ctaButtons}
      ${image}
    </div>
  `.trim();

  return renderContainer(innerContent, styles, {
    id: section.id,
    maxWidth: "max-w-6xl",
    vibe: section.vibe,
  });
}

/**
 * Split Hero
 * Text on left, image on right (2-column grid)
 */
function renderHeroSplit(
  section: HeroSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const { content } = section;
  const ctas = Array.isArray(content.cta)
    ? content.cta
    : content.cta
      ? [content.cta]
      : [];

  const heading = renderHeading(content.heading, 1, styles);
  const subheading = content.subheading
    ? `<p class="${styles.typography.body} ${styles.colors.text} text-xl mb-6">${escapeHTML(content.subheading)}</p>`
    : "";
  const description = content.description
    ? renderParagraph(content.description, styles, "body")
    : "";

  const ctaButtons = ctas.length
    ? `<div class="flex flex-col sm:flex-row gap-4 mt-8">
        ${ctas.map((cta) => renderButton(cta, styles, { variant: "primary" })).join("\n")}
      </div>`
    : "";

  const textColumn = `
    <div>
      ${heading}
      ${subheading}
      ${description}
      ${ctaButtons}
    </div>
  `.trim();

  const imageColumn = content.image
    ? `<div class="rounded-lg overflow-hidden ${styles.emphasis.shadow}">
        <img src="${escapeHTML(content.image)}" alt="${escapeHTML(content.heading)}" class="w-full h-auto" />
      </div>`
    : "";

  const innerContent = `
    <div class="grid md:grid-cols-2 gap-12 items-center">
      ${textColumn}
      ${imageColumn}
    </div>
  `.trim();

  return renderContainer(innerContent, styles, {
    id: section.id,
    maxWidth: "max-w-6xl",
    vibe: section.vibe,
  });
}

/**
 * Full-Bleed Hero
 * Background image with overlay, text and CTAs centered over it
 * Uses semantic styles for text colors and overlays
 */
function renderHeroFullBleed(
  section: HeroSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const { content } = section;
  const ctas = Array.isArray(content.cta)
    ? content.cta
    : content.cta
      ? [content.cta]
      : [];

  const backgroundStyle = content.backgroundImage
    ? `background-image: url('${escapeHTML(content.backgroundImage)}');`
    : "";

  // Use semantic styles for headings and text
  // For full-bleed, we use the semantic hierarchy (text for primary, textMuted for secondary)
  const heading = `<h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 ${styles.colors.text}">
    ${escapeHTML(content.heading)}
  </h1>`;

  const subheading = content.subheading
    ? `<p class="text-2xl md:text-3xl mb-8 ${styles.colors.textMuted}">
        ${escapeHTML(content.subheading)}
      </p>`
    : "";

  const description = content.description
    ? `<p class="text-xl mb-10 ${styles.colors.textMuted} max-w-2xl mx-auto">
        ${escapeHTML(content.description)}
      </p>`
    : "";

  const ctaButtons = ctas.length
    ? `<div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
        ${ctas.map((cta) => renderButton(cta, styles, { variant: "primary" })).join("\n")}
      </div>`
    : "";

  // Use semantic background for overlay
  const overlayClasses = `${styles.colors.background} opacity-40`;

  const innerContent = `
    <div class="relative min-h-screen bg-cover bg-center flex items-center justify-center"
         ${backgroundStyle ? `style="${backgroundStyle}"` : ""}>
      <div class="absolute inset-0 ${overlayClasses}"></div>
      <div class="relative z-10 text-center max-w-4xl mx-auto px-4">
        ${heading}
        ${subheading}
        ${description}
        ${ctaButtons}
      </div>
    </div>
  `.trim();

  // Don't use renderContainer for full-bleed, just return the inner div
  return innerContent;
}

