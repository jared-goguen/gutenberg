import type { ProseSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderMarkdown } from "../markdown.js";
import type { BlockEnrichment } from "../enrich.js";

export function renderProse(spec: ProseSpec, ctx: RenderContext, enrichment?: BlockEnrichment): string {
  const role = spec.role ?? "body";
  const highlighted = enrichment?.highlight ? " gb-prose-highlighted" : "";
  const roleClass = `gb-prose-${role}`;
  const si = ctx.specIndex ?? 0;

  // Edit mode: textarea with the raw markdown text, styled to match the prose block
  if (ctx.editMode) {
    const revealAttr = enrichment?.reveal ? ` data-reveal="${enrichment.reveal}"` : "";
    // Estimate row count from content for a natural fit
    const lineCount = Math.max(8, (spec.text ?? "").split("\n").length + 2);
    return `<div class="gb-prose ${roleClass}${highlighted}"${revealAttr}>
<textarea class="gb-edit-field gb-edit-textarea" name="section_${si}__text" rows="${lineCount}" placeholder="Markdown content…">${esc(spec.text ?? "")}</textarea>
</div>`;
  }

  const html = renderMarkdown(spec.text);
  const revealAttr = enrichment?.reveal ? ` data-reveal="${enrichment.reveal}"` : "";
  return `<div class="gb-prose ${roleClass}${highlighted}"${revealAttr}>
${html}
</div>`;
}
