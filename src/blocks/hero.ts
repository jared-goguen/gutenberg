import type { HeroSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc, renderEyebrow } from "./types.js";
import { renderInline } from "../inline.js";
import { renderMarkdown } from "../markdown.js";

/**
 * Render a hero block — inline page header box.
 * Dark surface, category eyebrow, title, body, accent bar.
 * No showcase effects — those live in superhero.
 */
export function renderHero(spec: HeroSpec, ctx: RenderContext): string {
  const accent = ctx.themeTokens.accent;
  const parts: string[] = [];

  if (spec.categories?.length) {
    parts.push(renderEyebrow(spec.categories));
  }

  parts.push(`  <h1 class="gb-hero-title">${esc(spec.title)}</h1>`);

  if (spec.subtitle) {
    parts.push(`  <p class="gb-hero-subtitle">${renderInline(spec.subtitle)}</p>`);
  }

  if (spec.body) {
    parts.push(`  <div class="gb-hero-body">${renderMarkdown(spec.body)}</div>`);
  }

  parts.push(`  <div class="gb-hero-accent" style="--gb-hero-accent-bg: ${accent}"></div>`);

  return `<section class="gb-hero" role="banner" data-align="${ctx.align}">
${parts.join("\n")}
</section>`;
}
