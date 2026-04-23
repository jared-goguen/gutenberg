import type { TransformSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

/**
 * Render a transform block: stacked equation grid.
 *
 * Each row is: [input] + [tool] = [output]
 * The output of row N becomes the input of row N+1, creating visual
 * threading through color continuity.
 *
 * Colors are resolved for the flattened unique-cell sequence:
 *   step 0: input, tool, output   (3 items)
 *   step 1: tool, output           (2 items — input reuses prev output)
 *   step 2: tool, output           (2 items)
 *   ...
 * Total: 3 + 2*(steps.length - 1) colorable positions.
 */
export function renderTransform(spec: TransformSpec, ctx: RenderContext): string {
  const steps = spec.steps;
  if (steps.length === 0) return "";

  // Build flat sequence of colorable items for color resolution.
  // Each entry maps to a unique cell in the grid.
  const colorItems: { color?: string }[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (i === 0) {
      colorItems.push({ color: step.color }); // input (first row only)
    }
    colorItems.push({ color: step.color }); // tool
    colorItems.push({ color: step.color }); // output
  }

  const effectiveScheme = spec.palette ?? ctx.themeName;
  const resolved = resolveColors(colorItems, effectiveScheme, undefined, ctx.themeTokens.shades);

  // Map resolved colors back to grid positions.
  // Row 0: input=resolved[0], tool=resolved[1], output=resolved[2]
  // Row N>0: input=resolved[prev_output_idx], tool=resolved[...], output=resolved[...]
  const rows: string[] = [];
  let ci = 0; // color index cursor

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const inputLabel = i === 0
      ? (step.input ?? step.output)
      : steps[i - 1].output;

    // Input color: own slot for first row, previous output slot for subsequent
    const inputColor = i === 0 ? resolved[ci++] : resolved[ci - 1];
    const toolColor = resolved[ci++];
    const outputColor = resolved[ci++];

    // Input pill — threaded inputs get a marker class.
    // If the previous step had an outputLink, the threaded input inherits it.
    const inputCls = i > 0 ? "gb-pill gb-pill-thread" : "gb-pill";
    const inheritedLink = i > 0 ? steps[i - 1].outputLink : undefined;
    const inputPill = inheritedLink
      ? `<a href="${esc(inheritedLink)}" class="${inputCls} gb-pill-linked" style="--gb-pill-bg: ${inputColor.bg}; --gb-pill-text: ${inputColor.text}">${renderInline(inputLabel)}</a>`
      : `<span class="${inputCls}" style="--gb-pill-bg: ${inputColor.bg}; --gb-pill-text: ${inputColor.text}">${renderInline(inputLabel)}</span>`;

    // Tool pill — may be linked
    const toolPill = step.link
      ? `<a href="${esc(step.link)}" class="gb-pill gb-pill-linked" style="--gb-pill-bg: ${toolColor.bg}; --gb-pill-text: ${toolColor.text}">${renderInline(step.tool)}</a>`
      : `<span class="gb-pill" style="--gb-pill-bg: ${toolColor.bg}; --gb-pill-text: ${toolColor.text}">${renderInline(step.tool)}</span>`;

    // Output pill — linked if outputLink is set
    const outputPill = step.outputLink
      ? `<a href="${esc(step.outputLink)}" class="gb-pill gb-pill-linked" style="--gb-pill-bg: ${outputColor.bg}; --gb-pill-text: ${outputColor.text}">${renderInline(step.output)}</a>`
      : `<span class="gb-pill" style="--gb-pill-bg: ${outputColor.bg}; --gb-pill-text: ${outputColor.text}">${renderInline(step.output)}</span>`;

    // Operator colors: + uses tool's color, = uses output's color
    const rowAttrs = [
      i > 0 ? "data-threaded" : "",
      step.featured ? "data-featured" : "",
    ].filter(Boolean).join(" ");
    const rowAttrStr = rowAttrs ? ` ${rowAttrs}` : "";
    rows.push(`  <div class="gb-transform-row"${rowAttrStr}>
    ${inputPill}
    <span class="gb-transform-op" style="--gb-transform-op-color: ${toolColor.bg}">+</span>
    ${toolPill}
    <span class="gb-transform-op" style="--gb-transform-op-color: ${outputColor.bg}">=</span>
    ${outputPill}
  </div>`);
  }

  const hasFeatured = steps.some((s: any) => s.featured);
  const containerAttr = hasFeatured ? ` data-has-featured` : "";
  return `<div class="gb-transform"${containerAttr}>
${rows.join("\n")}
</div>`;
}
