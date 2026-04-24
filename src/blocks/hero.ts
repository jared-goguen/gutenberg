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
  const si = ctx.specIndex ?? 0;

  if (spec.categories?.length) {
    parts.push(renderEyebrow(spec.categories));
  }

  // Edit mode: title becomes a text input styled identically to the display title
  if (ctx.editMode) {
    parts.push(`  <input class="gb-hero-title gb-edit-field" type="text" name="section_${si}__title" value="${esc(spec.title)}" placeholder="Page title…">`);
  } else {
    parts.push(`  <h1 class="gb-hero-title">${esc(spec.title)}</h1>`);
  }

  if (spec.subtitle) {
    if (ctx.editMode) {
      parts.push(`  <input class="gb-hero-subtitle gb-edit-field" type="text" name="section_${si}__subtitle" value="${esc(spec.subtitle)}" placeholder="Subtitle…">`);
    } else {
      parts.push(`  <p class="gb-hero-subtitle">${renderInline(spec.subtitle)}</p>`);
    }
  }

  if (spec.body) {
    if (ctx.editMode) {
      parts.push(`  <textarea class="gb-hero-body gb-edit-field" name="section_${si}__body" rows="4" placeholder="Body…">${esc(spec.body)}</textarea>`);
    } else {
      parts.push(`  <div class="gb-hero-body">${renderMarkdown(spec.body)}</div>`);
    }
  }

  parts.push(`  <div class="gb-hero-accent" style="--gb-hero-accent-bg: ${accent}"></div>`);

  return `<section class="gb-hero" role="banner" data-align="${ctx.align}">
${parts.join("\n")}
</section>`;
}
