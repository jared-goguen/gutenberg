import { Section, RenderOptions, ComponentType } from "../types.js";
import { renderHero } from "./hero.js";
import { renderFeatures } from "./features.js";
import { renderContent } from "./content.js";
import { renderCTA } from "./cta.js";
import { renderNavigation } from "./navigation.js";
import { renderFooter } from "./footer.js";

/**
 * Component registry mapping types to renderers
 */
const componentRenderers: Record<ComponentType, (section: any, options: RenderOptions) => string> = {
  hero: renderHero,
  features: renderFeatures,
  content: renderContent,
  cta: renderCTA,
  navigation: renderNavigation,
  footer: renderFooter,
};

/**
 * Render a section based on its type
 */
export function renderSection(section: Section, options: RenderOptions = {}): string {
  const renderer = componentRenderers[section.type];
  
  if (!renderer) {
    throw new Error(`Unknown component type: ${section.type}`);
  }

  const html = renderer(section, options);

  if (options.includeComments !== false) {
    const label = section.id ? `${section.type}#${section.id}` : section.type;
    return `<!-- section: ${label} -->\n${html}`;
  }

  return html;
}

/**
 * Get list of all available components with their variants
 */
export function getComponentList(): Array<{ type: ComponentType; variants: string[]; description: string }> {
  return [
    {
      type: "hero",
      variants: ["centered", "split", "full-bleed"],
      description: "Hero sections for landing pages with heading, subheading, CTA buttons, and optional images",
    },
    {
      type: "features",
      variants: ["grid-2", "grid-3", "grid-4", "list"],
      description: "Feature showcases with icons, titles, and descriptions in various grid layouts",
    },
    {
      type: "content",
      variants: ["prose", "narrow", "wide"],
      description: "Rich text content sections supporting markdown and HTML with typography styles",
    },
    {
      type: "cta",
      variants: ["centered", "split", "banner"],
      description: "Call-to-action sections to drive user engagement with compelling messaging",
    },
    {
      type: "navigation",
      variants: ["default", "centered", "split"],
      description: "Header navigation bars with logo, links, and optional CTA button",
    },
    {
      type: "footer",
      variants: ["simple", "detailed", "newsletter"],
      description: "Footer sections with links, social media, copyright, and optional newsletter signup",
    },
  ];
}
