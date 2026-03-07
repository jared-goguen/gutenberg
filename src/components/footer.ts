import { FooterSection, RenderOptions } from "../types.js";
import { escapeHTML } from "../renderer.js";
import { renderSection } from "../templates/base.js";

/**
 * Render a footer section
 */
export function renderFooter(section: FooterSection, options: RenderOptions = {}): string {
  const variant = section.variant || "simple";

  switch (variant) {
    case "simple":
      return renderFooterSimple(section, options);
    case "detailed":
      return renderFooterDetailed(section, options);
    case "newsletter":
      return renderFooterNewsletter(section, options);
    default:
      return renderFooterSimple(section, options);
  }
}

function renderFooterSimple(section: FooterSection, options: RenderOptions): string {
  const logo = section.logo ? `
    <div class="flex items-center gap-2">
      ${section.logo.image ? `<img src="${escapeHTML(section.logo.image)}" alt="Logo" class="h-8" />` : ""}
      ${section.logo.text ? `<span class="text-xl font-bold">${escapeHTML(section.logo.text)}</span>` : ""}
    </div>
  ` : "";

  const social = section.social ? renderSocialLinks(section.social) : "";

  const content = `
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      ${logo}
      ${social}
    </div>
    ${section.copyright ? `
    <div class="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
      <p>${escapeHTML(section.copyright)}</p>
    </div>
    ` : ""}
  `;

  return renderSection(content, {
    id: section.id,
    className: `bg-gray-50 ${section.className || ""}`,
    spacing: "lg",
  });
}

function renderFooterDetailed(section: FooterSection, options: RenderOptions): string {
  const logo = section.logo ? `
    <div>
      <div class="flex items-center gap-2 mb-4">
        ${section.logo.image ? `<img src="${escapeHTML(section.logo.image)}" alt="Logo" class="h-8" />` : ""}
        ${section.logo.text ? `<span class="text-xl font-bold">${escapeHTML(section.logo.text)}</span>` : ""}
      </div>
      ${section.description ? `<p class="text-gray-600 max-w-xs">${escapeHTML(section.description)}</p>` : ""}
    </div>
  ` : "";

  const linkGroups = section.links ? section.links.map(group => `
    <div>
      <h3 class="font-semibold mb-4">${escapeHTML(group.heading)}</h3>
      <ul class="space-y-2">
        ${group.links.map(link => `
          <li>
            <a href="${escapeHTML(link.href)}" class="text-gray-600 hover:text-gray-900 transition-colors">
              ${escapeHTML(link.text)}
            </a>
          </li>
        `).join("")}
      </ul>
    </div>
  `).join("") : "";

  const social = section.social ? `
    <div>
      <h3 class="font-semibold mb-4">Follow Us</h3>
      ${renderSocialLinks(section.social)}
    </div>
  ` : "";

  const content = `
    <div class="grid md:grid-cols-2 lg:grid-cols-${section.links ? section.links.length + 2 : 2} gap-8 mb-8">
      ${logo}
      ${linkGroups}
      ${social}
    </div>
    ${section.copyright ? `
    <div class="pt-8 border-t border-gray-200 text-center text-gray-600">
      <p>${escapeHTML(section.copyright)}</p>
    </div>
    ` : ""}
  `;

  return renderSection(content, {
    id: section.id,
    className: `bg-gray-50 ${section.className || ""}`,
    spacing: "xl",
  });
}

function renderFooterNewsletter(section: FooterSection, options: RenderOptions): string {
  const content = `
    <div class="max-w-2xl mx-auto text-center mb-8">
      <h2 class="text-2xl font-bold mb-4">Subscribe to our newsletter</h2>
      ${section.description ? `<p class="text-gray-600 mb-6">${escapeHTML(section.description)}</p>` : ""}
      <form class="flex gap-2 max-w-md mx-auto">
        <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Subscribe
        </button>
      </form>
    </div>
    ${section.copyright ? `
    <div class="pt-8 border-t border-gray-200 text-center text-gray-600">
      <p>${escapeHTML(section.copyright)}</p>
    </div>
    ` : ""}
  `;

  return renderSection(content, {
    id: section.id,
    className: `bg-gray-50 ${section.className || ""}`,
    spacing: "lg",
  });
}

function renderSocialLinks(social: any[]): string {
  const icons: Record<string, string> = {
    twitter: "𝕏",
    facebook: "f",
    linkedin: "in",
    github: "GitHub",
    youtube: "▶",
    instagram: "📷",
  };

  return `
    <div class="flex gap-4">
      ${social.map(link => `
        <a href="${escapeHTML(link.href)}" class="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors" aria-label="${link.platform}">
          ${icons[link.platform] || link.platform[0].toUpperCase()}
        </a>
      `).join("")}
    </div>
  `;
}
