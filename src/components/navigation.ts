/**
 * Navigation Section — Semantic-aware header/nav bar
 * Structural component with light semantic integration
 */

import { NavigationSection, RenderOptions } from "../types.js";
import { SemanticStyles } from "../semantic.js";
import { escapeHTML } from "../renderer.js";
import { renderButton } from "./buttons.js";

/**
 * Main navigation renderer - dispatches to variant renderers
 */
export function renderNavigation(
  section: NavigationSection,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  const variant = section.variant || "default";

  switch (variant) {
    case "centered":
      return renderNavigationCentered(section, styles, options);
    case "split":
      return renderNavigationSplit(section, styles, options);
    default:
      return renderNavigationDefault(section, styles, options);
  }
}

/**
 * Default navigation: logo left, links center, CTA right
 */
function renderNavigationDefault(
  section: NavigationSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const logo = renderLogo(section);
  const links = renderLinks(section.links, styles);
  const ctaButton = section.cta ? renderButton(section.cta, styles, { size: "sm" }) : "";

  const idAttr = section.id ? ` id="${escapeHTML(section.id)}"` : "";

  return `
    <nav class="sticky top-0 z-50 ${styles.colors.background} border-b ${styles.colors.border}"${idAttr}>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          ${logo}
          <div class="hidden md:flex items-center gap-8">
            ${links}
          </div>
          ${ctaButton ? `<div class="hidden md:block">${ctaButton}</div>` : ""}
          <button class="md:hidden ${styles.colors.text}" aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Centered navigation: logo centered on top row, links centered below
 */
function renderNavigationCentered(
  section: NavigationSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const logo = renderLogo(section);
  const links = renderLinks(section.links, styles);
  const ctaButton = section.cta ? renderButton(section.cta, styles, { size: "sm" }) : "";

  const idAttr = section.id ? ` id="${escapeHTML(section.id)}"` : "";

  return `
    <nav class="sticky top-0 z-50 ${styles.colors.background} border-b ${styles.colors.border}"${idAttr}>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center py-4 gap-4">
          <div class="flex items-center gap-4">
            ${logo}
            ${ctaButton ? `<div class="hidden md:block">${ctaButton}</div>` : ""}
          </div>
          <div class="hidden md:flex items-center gap-8">
            ${links}
          </div>
          <button class="absolute right-4 top-4 md:hidden ${styles.colors.text}" aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Split navigation: logo on left, links split across center and right
 */
function renderNavigationSplit(
  section: NavigationSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const logo = renderLogo(section);
  const links = renderLinks(section.links, styles);
  const ctaButton = section.cta ? renderButton(section.cta, styles, { size: "sm" }) : "";

  const idAttr = section.id ? ` id="${escapeHTML(section.id)}"` : "";

  return `
    <nav class="sticky top-0 z-50 ${styles.colors.background} border-b ${styles.colors.border}"${idAttr}>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-12">
            ${logo}
            <div class="hidden md:flex items-center gap-8">
              ${links}
            </div>
          </div>
          ${ctaButton ? `<div class="hidden md:flex">${ctaButton}</div>` : ""}
          <button class="md:hidden ${styles.colors.text}" aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Render logo (text or image)
 */
function renderLogo(section: NavigationSection): string {
  const logo = section.logo;

  if (!logo) {
    return "";
  }

  if (logo.image) {
    const href = logo.href || "/";
    return `
      <a href="${escapeHTML(href)}" class="flex items-center gap-2">
        <img src="${escapeHTML(logo.image)}" alt="Logo" class="h-8 w-auto" />
      </a>
    `;
  }

  if (logo.text) {
    const href = logo.href || "/";
    return `
      <a href="${escapeHTML(href)}" class="font-bold text-lg">
        ${escapeHTML(logo.text)}
      </a>
    `;
  }

  return "";
}

/**
 * Render navigation links
 */
function renderLinks(links: any[], styles: SemanticStyles): string {
  return links
    .map((link) => {
      return `
        <a href="${escapeHTML(link.href)}" class="${styles.interactive.link} hover:underline">
          ${escapeHTML(link.text)}
        </a>
      `;
    })
    .join("\n");
}

/**
 * Render a CTA button in the navigation
 */
