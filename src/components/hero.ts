import { HeroSection, RenderOptions, CTA } from "../types.js";
import { escapeHTML } from "../renderer.js";
import { renderSection } from "../templates/base.js";
import { defaultThemeSpec } from "../theme.js";

/**
 * Render a hero section
 */
export function renderHero(section: HeroSection, options: RenderOptions = {}): string {
  const variant = section.variant || "centered";
  const theme = options.theme || defaultThemeSpec;

  switch (variant) {
    case "centered":
      return renderHeroCentered(section, options, theme);
    case "split":
      return renderHeroSplit(section, options, theme);
    case "full-bleed":
      return renderHeroFullBleed(section, options, theme);
    default:
      return renderHeroCentered(section, options, theme);
  }
}

/**
 * Centered hero variant
 */
function renderHeroCentered(section: HeroSection, options: RenderOptions, theme: any): string {
  const { content } = section;
  const ctas = Array.isArray(content.cta) ? content.cta : content.cta ? [content.cta] : [];

  const heroContent = `
    <div class="text-center max-w-4xl mx-auto">
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
        ${escapeHTML(content.heading)}
      </h1>
      ${content.subheading ? `
      <p class="text-xl md:text-2xl text-muted mb-8">
        ${escapeHTML(content.subheading)}
      </p>
      ` : ""}
      ${content.description ? `
      <p class="text-lg text-muted mb-10 max-w-2xl mx-auto">
        ${escapeHTML(content.description)}
      </p>
      ` : ""}
      ${ctas.length > 0 ? `
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        ${ctas.map(cta => renderCTAButton(cta, theme)).join("\n")}
      </div>
      ` : ""}
      ${content.image ? `
      <div class="mt-12">
        <img src="${escapeHTML(content.image)}" alt="${escapeHTML(content.heading)}" class="rounded-lg shadow-2xl mx-auto" />
      </div>
      ` : ""}
    </div>
  `;

  return renderSection(heroContent, {
    id: section.id,
    spacing: "xl",
    theme,
  });
}

/**
 * Split hero variant (text on one side, image on other)
 */
function renderHeroSplit(section: HeroSection, options: RenderOptions, theme: any): string {
  const { content } = section;
  const ctas = Array.isArray(content.cta) ? content.cta : content.cta ? [content.cta] : [];

  const heroContent = `
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          ${escapeHTML(content.heading)}
        </h1>
        ${content.subheading ? `
        <p class="text-xl text-muted mb-6">
          ${escapeHTML(content.subheading)}
        </p>
        ` : ""}
        ${content.description ? `
        <p class="text-lg text-muted mb-8">
          ${escapeHTML(content.description)}
        </p>
        ` : ""}
        ${ctas.length > 0 ? `
        <div class="flex flex-col sm:flex-row gap-4">
          ${ctas.map(cta => renderCTAButton(cta, theme)).join("\n")}
        </div>
        ` : ""}
      </div>
      ${content.image ? `
      <div>
        <img src="${escapeHTML(content.image)}" alt="${escapeHTML(content.heading)}" class="rounded-lg shadow-xl w-full" />
      </div>
      ` : ""}
    </div>
  `;

  return renderSection(heroContent, {
    id: section.id,
    spacing: "xl",
    theme,
  });
}

/**
 * Full-bleed hero variant (background image with overlay)
 */
function renderHeroFullBleed(section: HeroSection, options: RenderOptions, theme: any): string {
  const { content } = section;
  const ctas = Array.isArray(content.cta) ? content.cta : content.cta ? [content.cta] : [];

  const heroContent = `
    <div class="relative min-h-screen flex items-center justify-center ${content.backgroundImage ? 'bg-cover bg-center' : 'bg-gradient-to-br from-blue-500 to-purple-600'}" ${content.backgroundImage ? `style="background-image: url('${escapeHTML(content.backgroundImage)}');"` : ''}>
      <div class="absolute inset-0 bg-black bg-opacity-40"></div>
      <div class="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          ${escapeHTML(content.heading)}
        </h1>
        ${content.subheading ? `
        <p class="text-2xl md:text-3xl mb-8 text-gray-100">
          ${escapeHTML(content.subheading)}
        </p>
        ` : ""}
        ${content.description ? `
        <p class="text-xl mb-10 text-gray-200 max-w-2xl mx-auto">
          ${escapeHTML(content.description)}
        </p>
        ` : ""}
        ${ctas.length > 0 ? `
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          ${ctas.map(cta => renderCTAButton(cta, theme, true)).join("\n")}
        </div>
        ` : ""}
      </div>
    </div>
  `;

  return renderSection(heroContent, {
    id: section.id,
    spacing: "none",
    theme,
  });
}

/**
 * Render a CTA button
 */
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
