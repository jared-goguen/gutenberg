import type { TrackerSpec, TrackerItemSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

// ── Tracker block ────────────────────────────────────────────
// Responsive grid of labeled items. Three item types:
//   rating  — 5-segment scale bar, deviation from neutral drives color intensity
//   toggle  — colored pill, active (Yes) or dim (No)
//   text    — clean inline value
//
// Edit mode renders appropriate input types for each:
//   rating  → radio-button segments (pure CSS, no JS)
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
// 5-segment scale. Deviation from neutral (3) drives color intensity.
// Polarity determines whether deviation is good (green) or bad (red).
// View mode: static segments. Edit mode: radio-button segments (pure CSS).

function ratingScaleVars(item: TrackerItemSpec): string {
  const polarity = item.polarity;
  // --scale-low: color when value is 1-2 (below neutral)
  // --scale-high: color when value is 4-5 (above neutral)
  if (polarity === "negative") {
    return "--scale-low: var(--gb-success); --scale-high: var(--gb-danger)";
  }
  if (polarity === "positive") {
    return "--scale-low: var(--gb-danger); --scale-high: var(--gb-success)";
  }
  // No polarity — use accent for both directions
  return "--scale-low: var(--tracker-accent); --scale-high: var(--tracker-accent)";
}

function ratingColor(numVal: number, polarity?: "positive" | "negative"): { color: string; intensity: number } {
  const neutral = 3;
  const deviation = Math.abs(numVal - neutral);
  const intensity = Math.min(1, deviation / 2); // 0 at 3, 0.5 at 2/4, 1.0 at 1/5

  if (numVal === neutral) {
    return { color: "color-mix(in srgb, currentColor 25%, transparent)", intensity: 0 };
  }

  const isGoodDirection =
    (polarity === "positive" && numVal > neutral) ||
    (polarity === "negative" && numVal < neutral);

  if (!polarity) {
    return { color: "var(--tracker-accent)", intensity };
  }

  return {
    color: isGoodDirection ? "var(--gb-success)" : "var(--gb-danger)",
    intensity,
  };
}

function renderRating(
  item: TrackerItemSpec,
  idx: number,
  specIdx: number,
  accent: string,
  ctx: RenderContext,
): string {
  const max = item.max ?? 5;
  const numVal = Math.max(1, Math.min(max, parseInt(item.value, 10) || 3));
  const { color, intensity } = ratingColor(numVal, item.polarity);

  const scaleVars = ratingScaleVars(item);
  const style = `--tracker-accent: ${accent}; --scale-color: ${color}; --scale-intensity: ${intensity.toFixed(2)}; ${scaleVars}`;

  if (ctx.editMode) {
    return renderRatingEdit(item, idx, specIdx, numVal, max, style, ctx);
  }
  return renderRatingView(item, numVal, max, style, ctx);
}

function renderRatingView(
  item: TrackerItemSpec,
  numVal: number,
  max: number,
  style: string,
  ctx: RenderContext,
): string {
  const segs: string[] = [];
  for (let v = 1; v <= max; v++) {
    const classes = ["gb-tracker-seg"];
    if (v === 3) classes.push("gb-tracker-neutral");
    if (v === numVal) classes.push("gb-tracker-active");
    segs.push(`<div class="${classes.join(" ")}"></div>`);
  }

  return `<div class="gb-tracker-item gb-tracker-rating" style="${style}">
  <dd class="gb-tracker-value">
    <div class="gb-tracker-scale">${segs.join("")}</div>
  </dd>
  <dt class="gb-tracker-label">${renderInline(item.label)}</dt>
</div>`;
}

function renderRatingEdit(
  item: TrackerItemSpec,
  idx: number,
  specIdx: number,
  numVal: number,
  max: number,
  style: string,
  ctx: RenderContext,
): string {
  const name = `section_${specIdx}__item_${idx}`;
  const segs: string[] = [];
  for (let v = 1; v <= max; v++) {
    const id = `s${specIdx}i${idx}v${v}`;
    const checked = v === numVal ? " checked" : "";
    const neutralCls = v === 3 ? " gb-tracker-neutral" : "";
    segs.push(`<input type="radio" name="${name}" value="${v}" id="${id}"${checked}>`);
    segs.push(`<label for="${id}" class="gb-tracker-seg${neutralCls}"></label>`);
  }

  return `<div class="gb-tracker-item gb-tracker-rating" style="${style}">
  <dd class="gb-tracker-value">
    <div class="gb-tracker-scale gb-tracker-scale-edit">${segs.join("")}</div>
  </dd>
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
