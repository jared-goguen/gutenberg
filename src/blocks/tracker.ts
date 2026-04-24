import type { TrackerSpec, TrackerItemSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

// ── Tracker block ────────────────────────────────────────────
// Responsive grid of labeled items. Three item types:
//   rating  — big accent-colored number, intensity scales with value
//   toggle  — colored pill, active (Yes) or dim (No)
//   text    — clean inline value
//
// Edit mode renders appropriate input types for each:
//   rating  → <input type="number">  styled as big accent number
//   toggle  → checkbox as clickable pill
//   text    → <input type="text">

export function renderTracker(spec: TrackerSpec, ctx: RenderContext): string {
  const items = spec.items;
  const cols = spec.cols ?? Math.min(items.length, 4);
  const si = ctx.specIndex ?? 0;

  // Resolve per-item accent colors via chromata
  const effectiveScheme = spec.palette ?? ctx.themeName;
  const resolved = resolveColors(items, effectiveScheme, undefined, ctx.themeTokens.shades);

  const cells = items.map((item, i) => {
    const c = resolved[i];
    switch (item.type) {
      case "rating":
        return renderRating(item, i, si, c.border, ctx);
      case "toggle":
        return renderToggle(item, i, si, c.border, ctx);
      case "text":
      default:
        return renderText(item, i, si, ctx);
    }
  });

  const captionHtml = spec.caption
    ? `<div class="gb-tracker-caption">${renderInline(spec.caption)}</div>`
    : "";

  return `<div class="gb-tracker" style="--tracker-cols: ${cols}">
${captionHtml}
${cells.join("\n")}
</div>`;
}

// ── Rating ────────────────────────────────────────────────────

function renderRating(
  item: TrackerItemSpec,
  idx: number,
  specIdx: number,
  accent: string,
  ctx: RenderContext,
): string {
  const max = item.max ?? 10;
  const numVal = parseFloat(item.value) || 0;
  const intensity = Math.min(1, Math.max(0, numVal / max));

  const style = `--tracker-accent: ${accent}; --tracker-intensity: ${intensity.toFixed(2)}`;

  if (ctx.editMode) {
    return `<div class="gb-tracker-item gb-tracker-rating" style="${style}">
  <dd class="gb-tracker-value">
    <input type="number" class="gb-tracker-input-rating"
           name="section_${specIdx}__item_${idx}" value="${esc(item.value)}"
           min="0" max="${max}" step="1">
  </dd>
  <dt class="gb-tracker-label">${renderInline(item.label)}</dt>
</div>`;
  }

  return `<div class="gb-tracker-item gb-tracker-rating" style="${style}">
  <dd class="gb-tracker-value">${esc(item.value)}</dd>
  <dt class="gb-tracker-label">${renderInline(item.label)}</dt>
</div>`;
}

// ── Toggle ────────────────────────────────────────────────────

function renderToggle(
  item: TrackerItemSpec,
  idx: number,
  specIdx: number,
  accent: string,
  ctx: RenderContext,
): string {
  const isActive = item.value.toLowerCase() === "yes" || item.value === "true";
  const style = `--tracker-accent: ${accent}`;

  if (ctx.editMode) {
    const checked = isActive ? " checked" : "";
    return `<div class="gb-tracker-item gb-tracker-toggle" data-active="${isActive}" style="${style}">
  <dd class="gb-tracker-value">
    <input type="hidden" name="section_${specIdx}__item_${idx}" value="No">
    <label class="gb-tracker-toggle-switch">
      <input type="checkbox" name="section_${specIdx}__item_${idx}" value="Yes"${checked}>
      <span class="gb-tracker-pill">${isActive ? "Yes" : "No"}</span>
    </label>
  </dd>
  <dt class="gb-tracker-label">${renderInline(item.label)}</dt>
</div>`;
  }

  return `<div class="gb-tracker-item gb-tracker-toggle" data-active="${isActive}" style="${style}">
  <dd class="gb-tracker-value">
    <span class="gb-tracker-pill">${isActive ? "Yes" : "No"}</span>
  </dd>
  <dt class="gb-tracker-label">${renderInline(item.label)}</dt>
</div>`;
}

// ── Text ──────────────────────────────────────────────────────

function renderText(
  item: TrackerItemSpec,
  idx: number,
  specIdx: number,
  ctx: RenderContext,
): string {
  if (ctx.editMode) {
    return `<div class="gb-tracker-item gb-tracker-text">
  <dd class="gb-tracker-value">
    <input type="text" class="gb-tracker-input-text"
           name="section_${specIdx}__item_${idx}" value="${esc(item.value)}"
           placeholder="${esc(item.label)}…">
  </dd>
  <dt class="gb-tracker-label">${renderInline(item.label)}</dt>
</div>`;
  }

  const display = item.value || "—";
  return `<div class="gb-tracker-item gb-tracker-text">
  <dd class="gb-tracker-value">${renderInline(display)}</dd>
  <dt class="gb-tracker-label">${renderInline(item.label)}</dt>
</div>`;
}
