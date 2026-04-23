import type { StatSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";
import type { BlockEnrichment } from "../enrich.js";

/** Currency symbols that render as a prefix before the value. Everything else is a suffix. */
const PREFIX_UNITS = ["$", "€", "£", "¥"];

export function renderStat(spec: StatSpec, ctx: RenderContext, enrichment?: BlockEnrichment): string {
  const items = spec.items;
  const cols = enrichment?.cols ?? Math.min(items.length, 4);

  const effectiveScheme = spec.palette ?? ctx.themeName;
  const resolved = resolveColors(items, effectiveScheme, undefined, ctx.themeTokens.shades);

  const animate = enrichment?.animate ?? false;

  const cells = items.map((item, i) => {
    const c = resolved[i];
    const parts: string[] = [];

    parts.push(`<div class="gb-stat" role="group">`);
    // When animate is true, add data-counter for JS counter script.
    // The visible text is still the real value (graceful degradation).
    const counterAttr = animate ? ` data-counter="${esc(item.value)}"` : "";

    // Value with optional unit (prefix or suffix)
    const isPrefix = item.unit && PREFIX_UNITS.some(p => item.unit!.startsWith(p));
    const prefixHtml = isPrefix && item.unit
      ? `<span class="gb-stat-unit gb-stat-prefix">${esc(item.unit)}</span>` : "";
    const suffixHtml = !isPrefix && item.unit
      ? `<span class="gb-stat-unit gb-stat-suffix">${esc(item.unit)}</span>` : "";

    // Trend indicator
    let trendHtml = "";
    if (item.trend) {
      const t = item.trend;
      const isUp = t.startsWith("+") || t.startsWith("↑");
      const isDown = t.startsWith("-") || t.startsWith("↓");
      const trendClass = isUp ? "gb-stat-trend-up" : isDown ? "gb-stat-trend-down" : "gb-stat-trend-flat";
      trendHtml = ` <span class="gb-stat-trend ${trendClass}">${esc(t)}</span>`;
    }

    parts.push(`  <dd class="gb-stat-value"${counterAttr} style="--gb-stat-accent: ${c.border}">${prefixHtml}${esc(item.value)}${suffixHtml}${trendHtml}</dd>`);
    parts.push(`  <dt class="gb-stat-label">${renderInline(item.label)}</dt>`);
    if (item.detail) {
      parts.push(`  <dd class="gb-stat-detail">${renderInline(item.detail)}</dd>`);
    }
    parts.push(`</div>`);

    return parts.join("\n");
  });

  return `<dl class="gb-stats" data-cols="${cols}">
${cells.join("\n")}
</dl>`;
}
