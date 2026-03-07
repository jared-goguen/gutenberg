import { CTASection, RenderOptions, CTA } from "../types.js";
import { escapeHTML } from "../renderer.js";
import { renderSection } from "../templates/base.js";

/**
 * Render a CTA section
 */
export function renderCTA(section: CTASection, options: RenderOptions = {}): string {
  const variant = section.variant || "centered";

  switch (variant) {
    case "centered":
      return renderCTACentered(section, options);
    case "split":
      return renderCTASplit(section, options);
    case "banner":
      return renderCTABanner(section, options);
    default:
      return renderCTACentered(section, options);
  }
}

function renderCTACentered(section: CTASection, options: RenderOptions): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];

  const content = `
    <div class="text-center max-w-3xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHTML(section.heading)}</h2>
      ${section.description ? `
      <p class="text-xl text-gray-600 mb-8">${escapeHTML(section.description)}</p>
      ` : ""}
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        ${ctas.map(cta => renderCTAButton(cta)).join("\n")}
      </div>
    </div>
  `;

  return renderSection(content, {
    id: section.id,
    className: `bg-gradient-to-br from-blue-50 to-purple-50 ${section.className || ""}`,
    spacing: "xl",
  });
}

function renderCTASplit(section: CTASection, options: RenderOptions): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];

  const content = `
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHTML(section.heading)}</h2>
        ${section.description ? `
        <p class="text-xl text-gray-600">${escapeHTML(section.description)}</p>
        ` : ""}
      </div>
      <div class="flex flex-col gap-4">
        ${ctas.map(cta => renderCTAButton(cta)).join("\n")}
      </div>
    </div>
  `;

  return renderSection(content, {
    id: section.id,
    className: section.className,
    spacing: "xl",
  });
}

function renderCTABanner(section: CTASection, options: RenderOptions): string {
  const ctas = Array.isArray(section.cta) ? section.cta : [section.cta];

  const content = `
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold mb-2">${escapeHTML(section.heading)}</h2>
        ${section.description ? `
        <p class="text-lg text-gray-600">${escapeHTML(section.description)}</p>
        ` : ""}
      </div>
      <div class="flex gap-4 flex-shrink-0">
        ${ctas.map(cta => renderCTAButton(cta)).join("\n")}
      </div>
    </div>
  `;

  return renderSection(content, {
    id: section.id,
    className: `bg-blue-600 text-white ${section.className || ""}`,
    spacing: "md",
  });
}

function renderCTAButton(cta: CTA): string {
  const variant = cta.variant || "primary";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-800 text-white hover:bg-gray-900",
    outline: "border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white",
    ghost: "text-gray-800 hover:bg-gray-100",
  };

  const classes = `inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg transition-colors ${variantClasses[variant]}`;

  return `<a href="${escapeHTML(cta.href)}" class="${classes}">${escapeHTML(cta.text)}</a>`;
}
