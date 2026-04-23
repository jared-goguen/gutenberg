import type { FlowChainSpec } from "../specs/page/index.js";
import { resolveColors } from "../chromata/resolve-colors.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

export function renderFlowChain(spec: FlowChainSpec, ctx: RenderContext): string {
  const steps = spec.steps;
  const effectiveScheme = spec.palette ?? ctx.themeName;
  const resolved = resolveColors(steps, effectiveScheme, undefined, ctx.themeTokens.shades);

  const parts: string[] = [];
  const arrow = `<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M6.5 3.5L12.5 9L6.5 14.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  for (let i = 0; i < steps.length; i++) {
    const c = resolved[i];
    const step = steps[i];
    const pill = `<span class="gb-pill" role="listitem" style="--gb-flow-pill-bg: ${c.bg}; --gb-flow-pill-text: ${c.text}">${renderInline(step.label)}</span>`;
    parts.push(pill);

    if (i < steps.length - 1) {
      const nextC = resolved[i + 1];
      parts.push(`<span class="gb-arrow" aria-hidden="true" style="--gb-flow-arrow-color: ${nextC.bg}">${arrow}</span>`);
    }
  }

  return `<div class="gb-flow-chain" role="list">
${parts.join("\n")}
</div>`;
}
