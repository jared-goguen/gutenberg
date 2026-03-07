/**
 * Footer Section — Semantic-aware footer
 * Structural component with light semantic integration
 */

import { FooterSection, RenderOptions } from "../types.js";
import { SemanticStyles } from "../semantic.js";
import { escapeHTML } from "../renderer.js";
import { renderContainer } from "../primitives.js";

/**
 * Main footer renderer - dispatches to variant renderers
 */
export function renderFooter(
  section: FooterSection,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  const variant = section.variant || "simple";

  switch (variant) {
    case "simple":
      return renderFooterSimple(section, styles, options);
    case "detailed":
      return renderFooterDetailed(section, styles, options);
    case "newsletter":
      return renderFooterNewsletter(section, styles, options);
    default:
      return renderFooterSimple(section, styles, options);
  }
}

/**
 * Simple footer: logo, social links, copyright
 */
function renderFooterSimple(
  section: FooterSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const logo = renderLogo(section, styles);
  const social = section.social ? renderSocialLinks(section.social, styles) : "";

  const copyrightHTML = section.copyright
    ? `
      <div class="mt-8 pt-8 border-t ${styles.colors.border} text-center">
        <p class="${styles.colors.textMuted} text-sm">${escapeHTML(section.copyright)}</p>
      </div>
    `.trim()
    : "";

  const innerContent = `
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      ${logo}
      ${social}
    </div>
    ${copyrightHTML}
  `
    .trim();

  return renderContainer(innerContent, styles, {
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * Detailed footer: logo + description, link groups, social media
 */
function renderFooterDetailed(
  section: FooterSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const logo = renderLogo(section, styles);

  const linkGroups = section.links
    ? section.links
        .map(
          (group) => `
      <div>
        <h3 class="${styles.colors.text} font-semibold mb-4 text-sm">${escapeHTML(group.heading)}</h3>
        <ul class="space-y-2">
          ${group.links
            .map(
              (link) => `
            <li>
              <a href="${escapeHTML(link.href)}" class="${styles.interactive.link} hover:underline text-sm">
                ${escapeHTML(link.text)}
              </a>
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `
        )
        .join("")
    : "";

  const social = section.social
    ? `
      <div>
        <h3 class="${styles.colors.text} font-semibold mb-4 text-sm">Follow Us</h3>
        ${renderSocialLinks(section.social, styles)}
      </div>
    `
    : "";

  const copyrightHTML = section.copyright
    ? `
      <div class="pt-8 border-t ${styles.colors.border} text-center">
        <p class="${styles.colors.textMuted} text-sm">${escapeHTML(section.copyright)}</p>
      </div>
    `.trim()
    : "";

  const innerContent = `
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
      ${logo}
      ${linkGroups}
      ${social}
    </div>
    ${copyrightHTML}
  `
    .trim();

  return renderContainer(innerContent, styles, {
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * Newsletter footer: CTA for email signup + links
 */
function renderFooterNewsletter(
  section: FooterSection,
  styles: SemanticStyles,
  options: RenderOptions
): string {
  const logo = renderLogo(section, styles);

  const newsletter = `
    <div class="bg-opacity-50 ${styles.container.background} p-8 rounded-lg">
      <h3 class="${styles.colors.text} font-semibold mb-2">Subscribe to our newsletter</h3>
      <p class="${styles.colors.textMuted} text-sm mb-4">${section.description || "Get updates delivered to your inbox"}</p>
      <form class="flex gap-2">
        <input
          type="email"
          placeholder="Enter your email"
          class="flex-1 px-4 py-2 rounded-lg border ${styles.colors.border} text-sm"
          required
        />
        <button type="submit" class="${styles.interactive.buttonPrimary} px-4 py-2 rounded-lg text-sm font-medium">
          Subscribe
        </button>
      </form>
    </div>
  `.trim();

  const linkGroups = section.links
    ? section.links
        .map(
          (group) => `
      <div>
        <h3 class="${styles.colors.text} font-semibold mb-4 text-sm">${escapeHTML(group.heading)}</h3>
        <ul class="space-y-2">
          ${group.links
            .map(
              (link) => `
            <li>
              <a href="${escapeHTML(link.href)}" class="${styles.interactive.link} hover:underline text-sm">
                ${escapeHTML(link.text)}
              </a>
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `
        )
        .join("")
    : "";

  const copyrightHTML = section.copyright
    ? `
      <div class="pt-8 border-t ${styles.colors.border} text-center">
        <p class="${styles.colors.textMuted} text-sm">${escapeHTML(section.copyright)}</p>
      </div>
    `.trim()
    : "";

  const innerContent = `
    <div class="grid md:grid-cols-2 gap-8 mb-8">
      ${newsletter}
      <div class="grid md:grid-cols-2 gap-8">
        ${linkGroups}
      </div>
    </div>
    ${copyrightHTML}
  `
    .trim();

  return renderContainer(innerContent, styles, {
    id: section.id,
    maxWidth: "max-w-6xl",
  });
}

/**
 * Render footer logo
 */
function renderLogo(section: FooterSection, styles: SemanticStyles): string {
  const logo = section.logo;

  if (!logo) {
    return "";
  }

  return `
    <div>
      <div class="flex items-center gap-2 mb-2">
        ${logo.image ? `<img src="${escapeHTML(logo.image)}" alt="Logo" class="h-8 w-auto" />` : ""}
        ${logo.text ? `<span class="${styles.colors.text} text-lg font-bold">${escapeHTML(logo.text)}</span>` : ""}
      </div>
      ${section.description ? `<p class="${styles.colors.textMuted} text-sm max-w-xs">${escapeHTML(section.description)}</p>` : ""}
    </div>
  `;
}

/**
 * Render social media links
 */
function renderSocialLinks(
  social: any[],
  styles: SemanticStyles
): string {
  const iconMap: Record<string, string> = {
    twitter: "𝕏",
    facebook: "f",
    linkedin: "in",
    github: "⚙",
    youtube: "▶",
    instagram: "📷",
  };

  return `
    <div class="flex gap-4">
      ${social
        .map(
          (link) => `
        <a href="${escapeHTML(link.href)}" class="${styles.interactive.link} hover:opacity-70 transition-opacity" aria-label="${escapeHTML(link.platform)}">
          <span class="text-lg">${iconMap[link.platform] || link.platform}</span>
        </a>
      `
        )
        .join("")}
    </div>
  `;
}
