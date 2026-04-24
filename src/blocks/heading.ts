import type { HeadingSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc, slugify } from "./types.js";
import { renderInline } from "../inline.js";

export function renderHeading(spec: HeadingSpec, _ctx: RenderContext): string {
  const level = spec.level ?? 2;
  const tag = `h${level}`;
  const id = spec.anchor ?? slugify(spec.text);
  return `<${tag} class="gb-heading" id="${esc(id)}">${renderInline(spec.text)}</${tag}>`;
}
