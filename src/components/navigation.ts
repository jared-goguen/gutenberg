import { NavigationSection, RenderOptions } from "../types.js";
import { escapeHTML } from "../renderer.js";
import { defaultThemeSpec } from "../theme.js";

/**
 * Render a navigation section
 */
export function renderNavigation(section: NavigationSection, options: RenderOptions = {}): string {
  const variant = section.variant || "default";
  const theme = options.theme || defaultThemeSpec;

  switch (variant) {
    case "centered":
      return renderNavigationCentered(section, options, theme);
    case "split":
      return renderNavigationSplit(section, options, theme);
    default:
      return renderNavigationDefault(section, options, theme);
  }
}

/**
 * Default navigation: logo left, links center, CTA right
 */
function renderNavigationDefault(section: NavigationSection, options: RenderOptions, theme: any): string {
  const logo = renderLogo(section);
  const links = renderLinks(section.links);
  const ctaButton = renderCTA(section.cta, theme);

  return `
    <nav class="sticky top-0 z-50 bg-page border-b border-default"${section.id ? ` id="${escapeHTML(section.id)}"` : ""}>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          ${logo}
          <div class="hidden md:flex items-center gap-8">
            ${links}
          </div>
          ${ctaButton ? `<div class="hidden md:block">${ctaButton}</div>` : ""}
          <button class="md:hidden" aria-label="Toggle menu">
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
function renderNavigationCentered(section: NavigationSection, options: RenderOptions, theme: any): string {
  const logo = renderLogo(section);
  const links = renderLinks(section.links);
  const ctaButton = renderCTA(section.cta, theme);

  return `
    <nav class="sticky top-0 z-50 bg-page border-b border-default"${section.id ? ` id="${escapeHTML(section.id)}"` : ""}>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center py-4 gap-4">
          <div class="flex items-center gap-4">
            ${logo}
            ${ctaButton ? `<div class="hidden md:block">${ctaButton}</div>` : ""}
          </div>
          <div class="hidden md:flex items-center gap-8">
            ${links}
          </div>
          <button class="absolute right-4 top-4 md:hidden" aria-label="Toggle menu">
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
 * Split navigation: logo far left, links in center, CTA far right
 */
function renderNavigationSplit(section: NavigationSection, options: RenderOptions, theme: any): string {
  const logo = renderLogo(section);
  const links = renderLinks(section.links);
  const ctaButton = renderCTA(section.cta, theme);

  return `
    <nav class="sticky top-0 z-50 bg-page border-b border-default"${section.id ? ` id="${escapeHTML(section.id)}"` : ""}>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-3 items-center h-16">
          <div class="flex items-center">
            ${logo}
          </div>
          <div class="hidden md:flex items-center justify-center gap-8">
            ${links}
          </div>
          <div class="flex items-center justify-end gap-4">
            ${ctaButton ? `<div class="hidden md:block">${ctaButton}</div>` : ""}
            <button class="md:hidden" aria-label="Toggle menu">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function renderLogo(section: NavigationSection): string {
  if (!section.logo) return "";
  return `
    <a href="${escapeHTML(section.logo.href || "/")}" class="flex items-center gap-2">
      ${section.logo.image ? `<img src="${escapeHTML(section.logo.image)}" alt="Logo" class="h-8" />` : ""}
      ${section.logo.text ? `<span class="text-xl font-bold">${escapeHTML(section.logo.text)}</span>` : ""}
    </a>
  `;
}

function renderLinks(links: NavigationSection["links"]): string {
  return links.map(link => `
    <a href="${escapeHTML(link.href)}" class="text-muted hover:text-default transition-colors">
      ${escapeHTML(link.text)}
    </a>
  `).join("\n");
}

function renderCTA(cta: NavigationSection["cta"], theme: any): string {
  if (!cta) return "";
  return `<a href="${escapeHTML(cta.href)}" class="bg-primary text-inverse px-6 py-2 ${theme.radius.button} hover:opacity-90 transition-opacity">${escapeHTML(cta.text)}</a>`;
}
