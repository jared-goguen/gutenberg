import type { InfoBoxSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";
import { renderMarkdown } from "../markdown.js";

const LABELS: Record<string, string> = {
  note: "Note",
  info: "Info",
  warning: "Warning",
  tip: "Tip",
};

export function renderInfoBox(spec: InfoBoxSpec, _ctx: RenderContext): string {
  const boxType = spec.boxType ?? "info";
  const label = spec.title ?? LABELS[boxType] ?? boxType;
  const content = renderMarkdown(spec.content);

  return `<aside class="gb-info-box" data-box-type="${boxType}">
  <div class="gb-info-box-label">${renderInline(label)}</div>
  ${content}
</aside>`;
}
