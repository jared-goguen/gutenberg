import { CTASection, RenderOptions, CTA } from "../types.js";
import { escapeHTML } from "../renderer.js";
import { renderSection } from "../templates/base.js";
import { defaultThemeSpec } from "../theme.js";

/**
 * Render a CTA section
 */
export function renderCTA(section: CTASection, options: RenderOptions = {}): string {
  const variant = section.variant || "centered";
  const theme = options.theme || defaultThemeSpec;

  switch (variant) {
    case "centered":
      return renderCTACentered(section, options, theme);
    case "split":
      return renderCTASplit(section, options, theme);
    case "banner":
      return renderCTABanner(section, options, theme);
    default:
      return renderCTACentered(section, options, theme);
  }
}

function renderCTACentered(section: CTASection, options: RenderOptions, theme: any): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];
  const tone = section.tone || "subtle";

  const content = `
    <div class="text-center max-w-3xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHTML(section.heading)}</h2>
      ${section.description ? `
      <p class="text-xl ${tone === "brand" ? "text-inverse" : "text-muted"} mb-8">${escapeHTML(section.description)}</p>
      ` : ""}
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        ${ctas.map(cta => renderCTAButton(cta, theme)).join("\n")}
      </div>
    </div>
  `;

  return renderSection(content, {
    id: section.id,
    spacing: "xl",
    theme,
    tone,
  });
}

function renderCTASplit(section: CTASection, options: RenderOptions, theme: any): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];

  const content = `
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHTML(section.heading)}</h2>
        ${section.description ? `
        <p class="text-xl text-muted">${escapeHTML(section.description)}</p>
        ` : ""}
      </div>
      <div class="flex flex-col gap-4">
        ${ctas.map(cta => renderCTAButton(cta, theme)).join("\n")}
      </div>
    </div>
  `;

  return renderSection(content, {
    id: section.id,
    spacing: "xl",
    theme,
  });
}

function renderCTABanner(section: CTASection, options: RenderOptions, theme: any): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];
  const tone = section.tone || "brand";

  const content = `
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold mb-2">${escapeHTML(section.heading)}</h2>
        ${section.description ? `
        <p class="text-lg ${tone === "brand" ? "text-inverse" : "text-muted"}">${escapeHTML(section.description)}</p>
        ` : ""}
      </div>
      <div class="flex gap-4 flex-shrink-0">
        ${ctas.map(cta => renderCTAButton(cta, theme, tone === "brand")).join("\n")}
      </div>
    </div>
  `;

  return renderSection(content, {
    id: section.id,
    spacing: "md",
    theme,
    tone,
  });
}

function renderCTAButton(cta: CTA, theme: any, onDark: boolean = false): string {
  const variant = cta.variant || "primary";
  
  const variantClasses = {
    primary: onDark 
      ? "bg-white text-gray-900 hover:bg-gray-100" 
      : "bg-primary text-inverse hover:opacity-90",
    secondary: onDark
      ? "bg-gray-800 text-white hover:bg-gray-700"
      : "bg-gray-800 text-white hover:bg-gray-900",
    outline: onDark
      ? "border-2 border-white text-white hover:bg-white hover:text-gray-900"
      : "border-2 border-default text-default hover:bg-default hover:text-inverse",
    ghost: onDark
      ? "text-white hover:bg-white hover:bg-opacity-10"
      : "text-default hover:bg-subtle",
  };

  const classes = `inline-flex items-center justify-center px-8 py-3 text-base font-medium ${theme.radius.button} transition-colors ${variantClasses[variant]}`;

  return `<a href="${escapeHTML(cta.href)}" class="${classes}">${escapeHTML(cta.text)}</a>`;
}
