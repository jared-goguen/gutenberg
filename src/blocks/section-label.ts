import type { SectionLabelSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc, slugify } from "./types.js";

export function renderSectionLabel(
  spec: SectionLabelSpec,
  _ctx: RenderContext,
): string {
  const slug = spec.anchor ?? slugify(spec.text);
  return `<div class="gb-section-label" role="heading" aria-level="2" id="${esc(slug)}"><a href="#${esc(slug)}" class="gb-section-anchor">${esc(spec.text)}</a></div>`;
}
