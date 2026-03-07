import { Section, RenderOptions, ComponentType } from "../types.js";
import { SemanticStyles, SemanticContext, resolveSemanticStyles } from "../semantic.js";
import { renderHero } from "./hero.js";
import { renderFeatures } from "./features.js";
import { renderContent } from "./content.js";
import { renderCTA } from "./cta.js";
import { renderNavigation } from "./navigation.js";
import { renderFooter } from "./footer.js";

/**
 * Component registry mapping types to renderers
 * Now accepts both section and semantic styles
 */
const componentRenderers: Record<
  ComponentType,
  (section: any, styles: SemanticStyles, options: RenderOptions) => string
> = {
  hero: renderHero,
  features: renderFeatures,
  content: renderContent,
  cta: renderCTA,
  navigation: renderNavigation,
  footer: renderFooter,
};

/**
 * Render a section based on its type with semantic styles
 * This is the main entry point that computes semantic context
 */
export function renderSection(
  section: Section,
  styles: SemanticStyles,
  options: RenderOptions = {}
): string {
  const renderer = componentRenderers[section.type];

  if (!renderer) {
    throw new Error(`Unknown component type: ${section.type}`);
  }

  const html = renderer(section, styles, options);

  if (options.includeComments !== false) {
    const label = section.id ? `${section.type}#${section.id}` : section.type;
    return `<!-- section: ${label} (vibe: ${styles.metadata.vibe}, intent: ${styles.metadata.intent}, narrative: ${styles.metadata.narrative}, cohesion: ${styles.metadata.cohesion}) -->\n${html}`;
  }

  return html;
}

/**
 * Legacy wrapper: render a single section without context
 * Useful for preview/snapshot tools that render individual sections
 */
export function renderSectionWithoutContext(
  section: Section,
  options: RenderOptions = {}
): string {
  const ctx: SemanticContext = {
    section,
    prev: undefined,
    next: undefined,
    position: 0,
    totalSections: 1,
    isFirst: true,
    isLast: true,
  };

  const styles = resolveSemanticStyles(ctx, options.theme!);
  return renderSection(section, styles, options);
}

/**
 * Render all sections of a page with semantic context
 * This is called from tools/render_page to handle the full page
 */
export function renderSections(
  sections: Section[],
  options: RenderOptions = {}
): string {
  return sections
    .map((section, index) => {
      const ctx: SemanticContext = {
        section,
        prev: sections[index - 1],
        next: sections[index + 1],
        position: index,
        totalSections: sections.length,
        isFirst: index === 0,
        isLast: index === sections.length - 1,
      };

      const styles = resolveSemanticStyles(ctx, options.theme!);
      return renderSection(section, styles, options);
    })
    .join("\n");
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
