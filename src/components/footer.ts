import { FooterSection, RenderOptions } from "../types.js";
import { escapeHTML } from "../renderer.js";
import { renderSection } from "../templates/base.js";
import { defaultThemeSpec } from "../theme.js";

/**
 * Render a footer section
 */
export function renderFooter(section: FooterSection, options: RenderOptions = {}): string {
  const variant = section.variant || "simple";
  const theme = options.theme || defaultThemeSpec;

  switch (variant) {
    case "simple":
      return renderFooterSimple(section, options, theme);
    case "detailed":
      return renderFooterDetailed(section, options, theme);
    case "newsletter":
      return renderFooterNewsletter(section, options, theme);
    default:
      return renderFooterSimple(section, options, theme);
  }
}

function renderFooterSimple(section: FooterSection, options: RenderOptions, theme: any): string {
  const tone = section.tone || "light";
  
  const logo = section.logo ? `
    <div class="flex items-center gap-2">
      ${section.logo.image ? `<img src="${escapeHTML(section.logo.image)}" alt="Logo" class="h-8" />` : ""}
      ${section.logo.text ? `<span class="text-xl font-bold">${escapeHTML(section.logo.text)}</span>` : ""}
    </div>
  ` : "";

  const social = section.social ? renderSocialLinks(section.social, theme) : "";

  const content = `
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      ${logo}
      ${social}
    </div>
    ${section.copyright ? `
    <div class="mt-8 pt-8 border-t border-default text-center text-muted">
      <p>${escapeHTML(section.copyright)}</p>
    </div>
    ` : ""}
  `;

  return renderSection(content, {
    id: section.id,
    spacing: "lg",
    theme,
    tone,
  });
}

function renderFooterDetailed(section: FooterSection, options: RenderOptions, theme: any): string {
  const tone = section.tone || "light";
  
  const logo = section.logo ? `
    <div>
      <div class="flex items-center gap-2 mb-4">
        ${section.logo.image ? `<img src="${escapeHTML(section.logo.image)}" alt="Logo" class="h-8" />` : ""}
        ${section.logo.text ? `<span class="text-xl font-bold">${escapeHTML(section.logo.text)}</span>` : ""}
      </div>
      ${section.description ? `<p class="text-muted max-w-xs">${escapeHTML(section.description)}</p>` : ""}
    </div>
  ` : "";

  const linkGroups = section.links ? section.links.map(group => `
    <div>
      <h3 class="font-semibold mb-4">${escapeHTML(group.heading)}</h3>
      <ul class="space-y-2">
        ${group.links.map(link => `
          <li>
            <a href="${escapeHTML(link.href)}" class="text-muted hover:text-default transition-colors">
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
      ${renderSocialLinks(section.social, theme)}
    </div>
  ` : "";

  const content = `
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
      ${logo}
      ${linkGroups}
      ${social}
    </div>
    ${section.copyright ? `
    <div class="pt-8 border-t border-default text-center text-muted">
      <p>${escapeHTML(section.copyright)}</p>
    </div>
    ` : ""}
  `;

  return renderSection(content, {
    id: section.id,
    spacing: "xl",
    theme,
    tone,
  });
}

function renderFooterNewsletter(section: FooterSection, options: RenderOptions, theme: any): string {
  const tone = section.tone || "light";
  
  const content = `
    <div class="max-w-2xl mx-auto text-center mb-8">
      <h2 class="text-2xl font-bold mb-4">Subscribe to our newsletter</h2>
      ${section.description ? `<p class="text-muted mb-6">${escapeHTML(section.description)}</p>` : ""}
      <form class="flex gap-2 max-w-md mx-auto">
        <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-2 border border-default ${theme.radius.card} focus:outline-none focus:ring-2 focus:ring-primary" />
        <button type="submit" class="bg-primary text-inverse px-6 py-2 ${theme.radius.button} hover:opacity-90 transition-opacity">
          Subscribe
        </button>
      </form>
    </div>
    ${section.copyright ? `
    <div class="pt-8 border-t border-default text-center text-muted">
      <p>${escapeHTML(section.copyright)}</p>
    </div>
    ` : ""}
  `;

  return renderSection(content, {
    id: section.id,
    spacing: "lg",
    theme,
    tone,
  });
}

function renderSocialLinks(social: any[], theme: any): string {
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
        <a href="${escapeHTML(link.href)}" class="w-10 h-10 bg-feature hover:border-default ${theme.radius.button} flex items-center justify-center transition-colors" aria-label="${link.platform}">
          ${icons[link.platform] || link.platform[0].toUpperCase()}
        </a>
      `).join("")}
    </div>
  `;
}
