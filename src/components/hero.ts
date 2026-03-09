/**
 * Hero Section — Semantic-first rendering
 * Completely rewritten to use SemanticStyles
 */

import { HeroSection, RenderOptions, CTA } from "../types.js";
import { SemanticStyles } from "../semantic.js";
import {
  renderHeading,
  renderParagraph,
  renderButton,
  renderContainer,
} from "../primitives.js";
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
        ${ctas.map((cta) => renderButton(cta, styles, "primary")).join("\n")}
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
        ${ctas.map((cta) => renderButton(cta, styles, "primary")).join("\n")}
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
  });
}

/**
 * Full-Bleed Hero
 * Background image with overlay, text and CTAs centered over it
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

  // For full-bleed, adapt text colors based on theme
  // Light theme: white text over dark overlay
  // Dark theme: dark text over light overlay
  const isDarkTheme = options.theme?.name.toLowerCase() === "dark";
  const textColorClass = isDarkTheme ? "text-neutral-900" : "text-white";
  const mutedColorClass = isDarkTheme ? "text-neutral-700" : "text-gray-200";

  const backgroundStyle = content.backgroundImage
    ? `background-image: url('${escapeHTML(content.backgroundImage)}');`
    : "";

  const heading = `<h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 ${textColorClass}">
    ${escapeHTML(content.heading)}
  </h1>`;

  const subheading = content.subheading
    ? `<p class="text-2xl md:text-3xl mb-8 ${mutedColorClass}">
        ${escapeHTML(content.subheading)}
      </p>`
    : "";

  const description = content.description
    ? `<p class="text-xl mb-10 ${mutedColorClass} max-w-2xl mx-auto">
        ${escapeHTML(content.description)}
      </p>`
    : "";

  const ctaButtons = ctas.length
    ? `<div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
        ${ctas.map((cta) => renderFullBleedButton(cta, isDarkTheme)).join("\n")}
      </div>`
    : "";

  // For dark theme, use lighter overlay so dark text is visible
  const overlayOpacity = isDarkTheme ? "bg-opacity-30" : "bg-opacity-50";

  const innerContent = `
    <div class="relative min-h-screen bg-cover bg-center flex items-center justify-center ${content.backgroundImage ? "bg-cover" : "bg-gradient-to-br from-primary-600 to-primary-900"}"
         ${backgroundStyle ? `style="${backgroundStyle}"` : ""}>
      <div class="absolute inset-0 bg-${isDarkTheme ? "white" : "black"} ${overlayOpacity}"></div>
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

/**
 * Render a CTA button styled for full-bleed (white/contrasting)
 */
function renderFullBleedButton(cta: CTA, isDarkTheme: boolean = false): string {
  const variant = cta.variant || "primary";
  
  // Light theme: white/light buttons
  // Dark theme: dark/neutral buttons
  const variantClasses = isDarkTheme ? {
    primary: "bg-neutral-900 text-white hover:bg-neutral-800",
    secondary: "bg-neutral-200 text-neutral-900 hover:bg-neutral-300 border-2 border-neutral-200",
    outline: "border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white",
    ghost: "text-neutral-900 hover:bg-neutral-900 hover:bg-opacity-10",
  } : {
    primary: "bg-white text-gray-900 hover:bg-gray-100",
    secondary: "bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-800",
    outline: "border-2 border-white text-white hover:bg-white hover:text-gray-900",
    ghost: "text-white hover:bg-white hover:bg-opacity-10",
  };

  const classes = `inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg transition-colors ${variantClasses[variant]}`;

  return `<a href="${escapeHTML(cta.href)}" class="${classes}">${escapeHTML(cta.text)}</a>`;
}
