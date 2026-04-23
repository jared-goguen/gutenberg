import type { TimelineSpec, TimelineItemSpec, TimelineTrackSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

// ── Timeline block ───────────────────────────────────────────
// Temporal positioning element. Shows what happened, in what order,
// with what status. Two layouts from one semantic:
//   - Single-track (items): horizontal axis with dots and arrows
//   - Multi-track (tracks): stacked axes with shared date columns

export function renderTimeline(spec: TimelineSpec, ctx: RenderContext): string {
  const scheme = spec.palette ?? ctx.themeName;

  if (spec.tracks?.length) {
    return renderMultiAxis(spec.tracks, scheme, spec, ctx);
  }
  if (spec.items?.length) {
    return renderSingleAxis(spec.items, scheme, spec, ctx);
  }
  return "<!-- gb-timeline: no items or tracks -->";
}

// ── Single-track axis ────────────────────────────────────────
// Horizontal line with dots at each item. Date above, label below.
// Arrow chevrons between dots show direction. Optional terminus
// extends past the last item.

function renderSingleAxis(
  items: TimelineItemSpec[],
  scheme: string,
  spec: TimelineSpec,
  ctx: RenderContext,
): string {
  const resolved = resolveColors(items, scheme, undefined, ctx.themeTokens.shades);

  const parts: string[] = [];
  parts.push(`<div class="gb-timeline">`);
  parts.push(`<div class="gb-timeline-row">`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const c = resolved[i];

    if (i > 0) {
      parts.push(`<div class="gb-timeline-arrow"></div>`);
    }

    const tag = item.link ? "a" : "div";
    const href = item.link ? ` href="${esc(item.link)}"` : "";
    parts.push(`<${tag}${href} class="gb-timeline-item" data-status="${item.status}" style="--tl-accent: ${c.border}">`);
    parts.push(`  <div class="gb-timeline-date">${esc(item.date)}</div>`);
    parts.push(`  <div class="gb-timeline-dot"></div>`);
    parts.push(`  <div class="gb-timeline-label">${renderInline(item.label)}</div>`);
    parts.push(`</${tag}>`);
  }

  // Terminus
  if (spec.terminus) {
    parts.push(`<div class="gb-timeline-arrow"></div>`);
    parts.push(`<div class="gb-timeline-item gb-timeline-terminus">`);
    parts.push(`  <div class="gb-timeline-date">&nbsp;</div>`);
    parts.push(`  <div class="gb-timeline-dot"></div>`);
    parts.push(`  <div class="gb-timeline-label">${renderInline(spec.terminus)}</div>`);
    parts.push(`</div>`);
  }

  parts.push(`</div>`);

  if (spec.caption) {
    parts.push(`<div class="gb-timeline-caption">${renderInline(spec.caption)}</div>`);
  }

  parts.push(`</div>`);
  return parts.join("\n");
}

// ── Multi-track axis ─────────────────────────────────────────
// CSS grid: date columns across the top, track rows below.
// Each track row has a horizontal axis line through dot centers.
// Shared phase alignment across all tracks.

function renderMultiAxis(
  tracks: TimelineTrackSpec[],
  scheme: string,
  spec: TimelineSpec,
  ctx: RenderContext,
): string {
  // Derive phase columns from all items across all tracks
  const phaseOrder: string[] = [];
  const phaseSet = new Set<string>();
  for (const track of tracks) {
    for (const item of track.items) {
      if (!phaseSet.has(item.date)) {
        phaseSet.add(item.date);
        phaseOrder.push(item.date);
      }
    }
  }

  const trackColors = resolveColors(tracks, scheme, undefined, ctx.themeTokens.shades);

  const parts: string[] = [];
  const phaseCols = phaseOrder.length;
  parts.push(`<div class="gb-timeline" data-mode="multi" style="--tl-phases: ${phaseCols}">`);

  // Phase header row
  parts.push(`<div class="gb-timeline-header">`);
  parts.push(`  <div class="gb-timeline-track-spacer"></div>`);
  for (const phase of phaseOrder) {
    parts.push(`  <div class="gb-timeline-phase">${esc(phase)}</div>`);
  }
  parts.push(`</div>`);

  // Track rows
  for (let t = 0; t < tracks.length; t++) {
    const track = tracks[t];
    const tc = trackColors[t];

    const itemByDate = new Map<string, TimelineItemSpec>();
    for (const item of track.items) {
      itemByDate.set(item.date, item);
    }

    parts.push(`<div class="gb-timeline-track" style="--tl-track-accent: ${tc.border}">`);
    parts.push(`  <div class="gb-timeline-track-label">`);
    parts.push(`    <div class="gb-timeline-track-name">${renderInline(track.label)}</div>`);
    if (track.sublabel) {
      parts.push(`    <div class="gb-timeline-track-sublabel">${renderInline(track.sublabel)}</div>`);
    }
    parts.push(`  </div>`);

    for (const phase of phaseOrder) {
      const item = itemByDate.get(phase);
      if (item) {
        const tag = item.link ? "a" : "div";
        const href = item.link ? ` href="${esc(item.link)}"` : "";
        parts.push(`  <${tag}${href} class="gb-timeline-cell" data-status="${item.status}">`);
        parts.push(`    <div class="gb-timeline-dot"></div>`);
        parts.push(`    <div class="gb-timeline-label">${esc(item.label)}</div>`);
        parts.push(`  </${tag}>`);
      } else {
        parts.push(`  <div class="gb-timeline-cell" data-status="empty"></div>`);
      }
    }

    parts.push(`</div>`);
  }

  if (spec.caption) {
    parts.push(`<div class="gb-timeline-caption">${renderInline(spec.caption)}</div>`);
  }

  parts.push(`</div>`);
  return parts.join("\n");
}
