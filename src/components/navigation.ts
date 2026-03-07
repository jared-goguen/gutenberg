import { NavigationSection, RenderOptions } from "../types.js";
import { escapeHTML } from "../renderer.js";

/**
 * Render a navigation section
 */
export function renderNavigation(section: NavigationSection, options: RenderOptions = {}): string {
  const variant = section.variant || "default";

  const logo = section.logo ? `
    <a href="${escapeHTML(section.logo.href || "/")}" class="flex items-center gap-2">
      ${section.logo.image ? `<img src="${escapeHTML(section.logo.image)}" alt="Logo" class="h-8" />` : ""}
      ${section.logo.text ? `<span class="text-xl font-bold">${escapeHTML(section.logo.text)}</span>` : ""}
    </a>
  ` : "";

  const links = section.links.map(link => `
    <a href="${escapeHTML(link.href)}" class="text-gray-700 hover:text-gray-900 transition-colors">
      ${escapeHTML(link.text)}
    </a>
  `).join("\n");

  const ctaButton = section.cta ? `
    <a href="${escapeHTML(section.cta.href)}" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
      ${escapeHTML(section.cta.text)}
    </a>
  ` : "";

  return `
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-200" ${section.id ? `id="${escapeHTML(section.id)}"` : ""}>
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
