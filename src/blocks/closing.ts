import type { ClosingSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { renderMarkdown } from "../markdown.js";

export function renderClosing(spec: ClosingSpec, ctx: RenderContext): string {
  const align = ctx.align;
  return `<section class="gb-closing" role="contentinfo" data-align="${align}">
  ${renderMarkdown(spec.text)}
</section>`;
}
