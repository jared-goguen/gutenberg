import type { PageNavSpec, SpecBlock } from "../specs/page/index.js";
import { blockType, blockValue } from "../specs/page/index.js";
import type { SectionLabelSpec, HeadingSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc, slugify } from "./types.js";

interface NavItem {
  text: string;
  anchor: string;
  kind: "section" | "heading";
}

/**
 * Render a page navigation bar.
 *
 * If entries are provided explicitly, use those.
 * Otherwise, auto-generate from allBlocks by scanning for section_label
 * and heading blocks. Headings appear as lighter sub-items; vertical
 * separators divide section groups.
 */
export function renderPageNav(
  spec: PageNavSpec,
  ctx: RenderContext,
  allBlocks?: SpecBlock[],
): string {
  // Explicit entries — render flat (backward compatible)
  if (spec.entries && spec.entries.length > 0) {
    const links = spec.entries.map(
      (e) =>
        `<a class="gb-page-nav-link" href="#${esc(e.anchor)}">${esc(e.text)}</a>`,
    );
    return `<nav class="gb-page-nav" aria-label="Page sections">\n${links.join("\n")}\n</nav>`;
  }

  if (!allBlocks) return "";

  // Auto-generate: sections + headings
  const items: NavItem[] = [];
  for (const b of allBlocks) {
    const type = blockType(b);
    if (type === "section_label") {
      const val = blockValue(b);
      const text = typeof val === "string" ? val : (val as SectionLabelSpec).text;
      items.push({ text, anchor: slugify(text), kind: "section" });
    } else if (type === "heading") {
      const val = blockValue(b) as HeadingSpec;
      const anchor = val.anchor ?? slugify(val.text);
      // Truncate at colon for compact nav pills
      const navText = val.text.includes(":") ? val.text.split(":")[0].trim() : val.text;
      items.push({ text: navText, anchor, kind: "heading" });
    }
  }

  if (items.length === 0) return "";

  const parts: string[] = [];
  let prevKind: "section" | "heading" | null = null;

  for (const item of items) {
    // Add separator before a new section group (except the first)
    if (item.kind === "section" && prevKind !== null) {
      parts.push(`<span class="gb-page-nav-sep" aria-hidden="true"></span>`);
    }

    const cls = item.kind === "heading" ? "gb-page-nav-link gb-page-nav-sub" : "gb-page-nav-link";
    parts.push(`<a class="${cls}" href="#${esc(item.anchor)}">${esc(item.text)}</a>`);
    prevKind = item.kind;
  }

  return `<nav class="gb-page-nav" aria-label="Page sections">\n${parts.join("\n")}\n</nav>`;
}
