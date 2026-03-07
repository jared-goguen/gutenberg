import { FeaturesSection, RenderOptions } from "../types.js";
import { escapeHTML } from "../renderer.js";
import { renderSection } from "../templates/base.js";

/**
 * Render a features section
 */
export function renderFeatures(section: FeaturesSection, options: RenderOptions = {}): string {
  const variant = section.variant || "grid-3";

  const content = `
    ${section.heading || section.subheading ? `
    <div class="text-center mb-12">
      ${section.heading ? `<h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHTML(section.heading)}</h2>` : ""}
      ${section.subheading ? `<p class="text-xl text-gray-600 max-w-2xl mx-auto">${escapeHTML(section.subheading)}</p>` : ""}
    </div>
    ` : ""}
    
    ${renderFeaturesGrid(section, variant)}
  `;

  return renderSection(content, {
    id: section.id,
    className: section.className,
    spacing: "lg",
  });
}

function renderFeaturesGrid(section: FeaturesSection, variant: string): string {
  const gridClasses = {
    "grid-2": "grid md:grid-cols-2 gap-8",
    "grid-3": "grid md:grid-cols-2 lg:grid-cols-3 gap-8",
    "grid-4": "grid md:grid-cols-2 lg:grid-cols-4 gap-6",
    "list": "space-y-8 max-w-3xl mx-auto",
  };

  const gridClass = gridClasses[variant as keyof typeof gridClasses] || gridClasses["grid-3"];

  const items = section.items.map(item => {
    if (variant === "list") {
      return `
        <div class="flex gap-4">
          ${item.icon ? `<div class="flex-shrink-0">${renderIcon(item.icon)}</div>` : ""}
          <div>
            <h3 class="text-xl font-semibold mb-2">${escapeHTML(item.title)}</h3>
            <p class="text-gray-600">${escapeHTML(item.description)}</p>
            ${item.link ? `<a href="${escapeHTML(item.link)}" class="text-blue-600 hover:text-blue-700 mt-2 inline-block">Learn more →</a>` : ""}
          </div>
        </div>
      `;
    }

    return `
      <div class="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
        ${item.icon ? `<div class="mb-4 flex justify-center">${renderIcon(item.icon)}</div>` : ""}
        <h3 class="text-xl font-semibold mb-3">${escapeHTML(item.title)}</h3>
        <p class="text-gray-600">${escapeHTML(item.description)}</p>
        ${item.link ? `<a href="${escapeHTML(item.link)}" class="text-blue-600 hover:text-blue-700 mt-3 inline-block">Learn more →</a>` : ""}
      </div>
    `;
  }).join("\n");

  return `<div class="${gridClass}">${items}</div>`;
}

function renderIcon(icon: string): string {
  // Simple icon mapping - in production you'd use a proper icon library
  const icons: Record<string, string> = {
    rocket: "🚀",
    shield: "🛡️",
    star: "⭐",
    heart: "❤️",
    check: "✓",
    bolt: "⚡",
    globe: "🌍",
    lock: "🔒",
    search: "🔍",
    chart: "📊",
    code: "💻",
    mobile: "📱",
    cloud: "☁️",
    database: "🗄️",
    api: "🔌",
    users: "👥",
    settings: "⚙️",
    dollar: "💰",
  };

  const iconContent = icons[icon] || icon;
  return `<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">${iconContent}</div>`;
}
