import type { BadgeSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

export function renderBadge(spec: BadgeSpec, ctx: RenderContext): string {
  const items = spec.items;
  const effectiveScheme = spec.palette ?? ctx.themeName;
  const resolved = resolveColors(items, effectiveScheme, undefined, ctx.themeTokens.shades);

  const pills = items.map((item, i) => {
    const c = resolved[i];
    return `<span class="gb-badge-pill" role="listitem" style="--gb-badge-bg: ${c.bg}; --gb-badge-text: ${c.text}">${renderInline(item.label)}</span>`;
  });

  const sizeClass = spec.size === 'md' ? ' gb-badges-md' : '';
  return `<div class="gb-badges${sizeClass}" role="list">
${pills.join("\n")}
</div>`;
}
