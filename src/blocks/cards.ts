import type { CardsSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";
import { renderMarkdown } from "../markdown.js";
import type { BlockEnrichment } from "../enrich.js";

export function renderCards(spec: CardsSpec, ctx: RenderContext, enrichment?: BlockEnrichment): string {
  const items = spec.items;
  const cols = enrichment?.cols ?? spec.cols ?? Math.min(items.length, 4);
  const align = ctx.align;

  // Resolve per-item colors (handles explicit, tone/progression-injected, and scheme)
  // Override text shade to 300 — card titles sit on dark backgrounds and need a light, vivid accent
  const effectiveScheme = spec.palette ?? ctx.themeName;
  const cardShades = { ...ctx.themeTokens.shades, text: 300 as const };
  const resolved = resolveColors(items, effectiveScheme, undefined, cardShades);

  const cards = items.map((item, i) => {
    const c = resolved[i];
    const parts: string[] = [];

    const linkedClass = item.link ? " gb-card-linked" : "";
    // Bento size: data attribute drives grid span via CSS
    const sizeAttr = item.size && item.size !== "normal" ? ` data-size="${item.size}"` : "";
    parts.push(`<div class="gb-card${linkedClass}" role="listitem"${sizeAttr} style="--gb-card-border: ${c.border}; --gb-card-accent-color: ${c.text}">`)

    if (item.title) {
      let titleHtml = renderInline(item.title);
      if (item.link) {
        // Object link: { title: "Page Title" } — resolve title to href
        // String link: URL or page reference
        const linkRef = typeof item.link === "object" && item.link !== null
          ? (item.link as { title?: string }).title ?? ""
          : item.link as string;
        const isAbsolute = linkRef.startsWith("/");
        const isExternal = linkRef.startsWith("http://") || linkRef.startsWith("https://") || linkRef.startsWith("//");
        const href = (isExternal || isAbsolute)
          ? linkRef
          : ctx.resolveLink?.(linkRef) ?? `#${linkRef}`;
        titleHtml = `<a href="${esc(href)}">${titleHtml}</a>`;
      }
      parts.push(`  <div class="gb-card-title">${titleHtml}</div>`);
    }

    if (item.subtitle) {
      const sub = Array.isArray(item.subtitle)
        ? item.subtitle.join(" · ")
        : item.subtitle;
      parts.push(`  <div class="gb-card-subtitle">${renderInline(sub)}</div>`);
    }

    if (item.badge) {
      const badges = Array.isArray(item.badge) ? item.badge : [item.badge];
      const pills = badges
        .map((b) => `<span class="gb-card-badge" style="--gb-card-badge-border: ${c.border}">${esc(b)}</span>`)
        .join("");
      parts.push(`  <div class="gb-card-badges">${pills}</div>`);
    }

    if (item.body) {
      parts.push(`  <div class="gb-card-body">${renderMarkdown(item.body)}</div>`);
    }

    if (item.footer) {
      parts.push(`  <div class="gb-card-footer">${renderMarkdown(item.footer)}</div>`);
    }

    parts.push(`</div>`);
    return parts.join("\n");
  });

  const surfaceAttr = enrichment?.surface === "glass" ? ` data-surface="glass"` : "";
  const borderAttr = enrichment?.border === "glow" ? ` data-border="glow"` : "";
  return `<div class="gb-cards" role="list" data-cols="${cols}" data-align="${align}"${surfaceAttr}${borderAttr}>
${cards.join("\n")}
</div>`;
}
