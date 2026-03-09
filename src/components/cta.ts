/**
 * CTA (Call-to-Action) Section — Semantic-first rendering
 * Action-oriented sections with strong intent (direct) for driving conversions
 */

import { CTASection, RenderOptions, CTA } from "../types.js";
import { SemanticStyles } from "../semantic.js";
import {
  renderHeading,
  renderParagraph,
  renderContainer,
} from "../primitives.js";
import { renderButton } from "./buttons.js";
import { escapeHTML } from "../renderer.js";

/**
 * Main CTA renderer - dispatches to variant renderers
 */
export function renderCTA(
  section: CTASection,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  const variant = section.variant || "centered";

  switch (variant) {
    case "centered":
      return renderCTACentered(section, styles, options);
    case "split":
      return renderCTASplit(section, styles, options);
    case "banner":
      return renderCTABanner(section, styles, options);
    default:
      return renderCTACentered(section, styles, options);
  }
}

/**
 * Centered CTA
 * Heading and description centered, CTAs below
 */
function renderCTACentered(
  section: CTASection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];

  const heading = renderHeading(section.heading, 2, styles);
  const description = section.description
    ? renderParagraph(section.description, styles, "lead")
    : "";

  const buttons = `
    <div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
      ${ctas.map((cta) => renderButton(cta, styles, { variant: "primary" })).join("\n")}
    </div>
  `.trim();

  const innerContent = `
    <div class="text-center max-w-3xl mx-auto">
      ${heading}
      ${description}
      ${buttons}
    </div>
  `.trim();

  return renderContainer(innerContent, styles, {
    vibe: section.vibe,
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * Split CTA
 * Text on left, buttons on right
 */
function renderCTASplit(
  section: CTASection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];

  const heading = renderHeading(section.heading, 2, styles);
  const description = section.description
    ? renderParagraph(section.description, styles, "body")
    : "";

  const buttons = `
    <div class="flex flex-col gap-3">
      ${ctas.map((cta) => renderButton(cta, styles, { variant: "primary" })).join("\n")}
    </div>
  `.trim();

  const innerContent = `
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        ${heading}
        ${description}
      </div>
      <div>
        ${buttons}
      </div>
    </div>
  `.trim();

  return renderContainer(innerContent, styles, {
    vibe: section.vibe,
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * Banner CTA
 * Horizontal banner with heading, description, and action buttons
 * Full-width with background color from cohesion
 */
function renderCTABanner(
  section: CTASection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];

  const heading = `<h2 class="${styles.colors.text} text-2xl md:text-3xl font-bold">${escapeHTML(section.heading)}</h2>`;

  const description = section.description
    ? `<p class="${styles.colors.textMuted} text-lg mt-2">${escapeHTML(section.description)}</p>`
    : "";

  const buttons = `
    <div class="flex gap-4 flex-shrink-0">
      ${ctas.map((cta) => renderButton(cta, styles, { variant: "primary" })).join("\n")}
    </div>
  `.trim();

  const innerContent = `
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex-1">
        ${heading}
        ${description}
      </div>
      <div>
        ${buttons}
      </div>
    </div>
  `.trim();

  return renderContainer(innerContent, styles, {
    vibe: section.vibe,
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}
