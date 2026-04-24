/**
 * Right-rail TOC — "On This Page" navigation with scroll-spy tracking.
 *
 * Scans content blocks for section_label and heading blocks (same pattern
 * as page-nav.ts) and renders a vertical anchor list for the right rail.
 * JS scroll spy drives active highlighting and indicator position.
 *
 * Only rendered when the page has a sidebar layout (project builds) and
 * at least 2 navigable anchors.
 */

import type { SpecBlock } from "./specs/page/index.js";
import { blockType, blockValue } from "./specs/page/index.js";
import type { SectionLabelSpec, HeadingSpec } from "./specs/page/index.js";
import { esc, slugify } from "./blocks/types.js";

interface RailEntry {
  text: string;
  anchor: string;
  kind: "section" | "heading";
}

/** Extract navigable anchors from content blocks. */
function extractEntries(contentBlocks: SpecBlock[]): RailEntry[] {
  const entries: RailEntry[] = [];
  for (const b of contentBlocks) {
    const type = blockType(b);
    if (type === "section_label") {
      const val = blockValue(b);
      const text = typeof val === "string" ? val : (val as SectionLabelSpec).text;
      entries.push({ text, anchor: slugify(text), kind: "section" });
    } else if (type === "heading") {
      const val = blockValue(b) as HeadingSpec;
      const anchor = val.anchor ?? slugify(val.text);
      // Truncate at colon for compact display (consistent with page-nav)
      const navText = val.text.includes(":") ? val.text.split(":")[0].trim() : val.text;
      entries.push({ text: navText, anchor, kind: "heading" });
    }
  }
  return entries;
}

/**
 * Estimate reading time from rendered HTML fragments.
 * Strips tags, counts words, assumes 200 wpm.
 */
export function estimateReadingTime(htmlFragments: string[]): number {
  const text = htmlFragments
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Render the right-rail content: "On This Page" TOC + reading time.
 * Returns empty string when the page has fewer than 2 navigable anchors.
 */
export function renderRightRail(
  contentBlocks: SpecBlock[],
  readingMinutes?: number,
): string {
  const entries = extractEntries(contentBlocks);

  // Not worth showing for pages with < 2 anchors
  if (entries.length < 2) return "";

  const parts: string[] = [];

  // Reading time badge
  if (readingMinutes) {
    parts.push(`    <div class="gb-rail-meta">${readingMinutes} min read</div>`);
  }

  parts.push(`    <div class="gb-rail-title">On this page</div>`);
  parts.push(
    `    <div class="gb-rail-track" aria-hidden="true"><div class="gb-rail-indicator"></div></div>`,
  );

  for (const e of entries) {
    const cls = e.kind === "heading" ? "gb-rail-link gb-rail-sub" : "gb-rail-link";
    parts.push(`    <a class="${cls}" href="#${esc(e.anchor)}">${esc(e.text)}</a>`);
  }

  return `  <nav class="gb-rail-toc" aria-label="On this page">\n${parts.join("\n")}\n  </nav>`;
}
