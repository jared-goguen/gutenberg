import type { ProseSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { renderMarkdown } from "../markdown.js";
import type { BlockEnrichment } from "../enrich.js";

export function renderProse(spec: ProseSpec, _ctx: RenderContext, enrichment?: BlockEnrichment): string {
  const role = spec.role ?? "body";
  const highlighted = enrichment?.highlight ? " gb-prose-highlighted" : "";

  const roleClass = `gb-prose-${role}`;
  const html = renderMarkdown(spec.text);

  const revealAttr = enrichment?.reveal ? ` data-reveal="${enrichment.reveal}"` : "";
  return `<div class="gb-prose ${roleClass}${highlighted}"${revealAttr}>
${html}
</div>`;
}
