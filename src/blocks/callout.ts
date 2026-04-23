import type { CalloutSpec } from "../specs/page/index.js";
import { resolveColor } from "../chromata/resolve-colors.js";
import { primaryHue } from "../chromata/themes.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";
import { renderMarkdown } from "../markdown.js";

/**
 * Render a callout block — bold colored background, white text.
 * Clean CTA: title, body, and an optional button link.
 */
export function renderCallout(spec: CalloutSpec, ctx: RenderContext): string {
  const hueName = spec.color ?? primaryHue(ctx.themeName);
  const { bg, text, border } = resolveColor(hueName, ctx.themeName, { bg: 600, text: 300, border: 600 });

  const parts: string[] = [];

  // Title — optionally linked
  let titleHtml = renderInline(spec.title);
  if (spec.link) {
    const isExternal = spec.link.startsWith("http://") || spec.link.startsWith("https://") || spec.link.startsWith("//");
    const href = isExternal
      ? spec.link
      : ctx.resolveLink?.(spec.link) ?? spec.link;
    titleHtml = `<a href="${esc(href)}">${titleHtml}</a>`;
  }
  parts.push(`  <div class="gb-callout-title">${titleHtml}</div>`);

  // Body text
  if (spec.body) {
    parts.push(`  <div class="gb-callout-body">${renderMarkdown(spec.body)}</div>`);
  }

  // CTA button
  if (spec.label && spec.link) {
    const isExternal = spec.link.startsWith("http://") || spec.link.startsWith("https://") || spec.link.startsWith("//");
    const href = isExternal
      ? spec.link
      : ctx.resolveLink?.(spec.link) ?? spec.link;
    parts.push(`  <div class="gb-callout-cta"><a href="${esc(href)}" class="gb-callout-btn">${esc(spec.label)}</a></div>`);
  }

  const compact = !spec.body && !spec.label;
  const cls = compact ? "gb-callout gb-callout--compact" : "gb-callout";

  return `<div class="${cls}" style="--gb-callout-bg: ${bg}; --gb-callout-text: ${text}; --gb-callout-border: ${border}">
${parts.join("\n")}
</div>`;
}
