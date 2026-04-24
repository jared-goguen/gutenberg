import type { SuperheroSpec, DescriptorSpec, ScrollCtaSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc, renderEyebrow } from "./types.js";
import { renderMarkdown } from "../markdown.js";
import type { ShowcaseFlags } from "../enrich.js";

/**
 * Render a superhero block — full-viewport immersive opening.
 *
 * Always renders at 100vh, centered, with scroll indicator.
 * Showcase effects (mesh, particles) are injected based on enrichment flags,
 * NOT from spec fields. The spec author writes `superhero:` and the
 * enrichment layer decides the visual treatment.
 *
 * Supports brutalist enhancements:
 *   - taglines: flanking subtitle rows with horizontal dividers
 *   - descriptors: 3-column feature boxes below title
 *   - scroll_cta: customizable scroll indicator with ring/simple styles
 *   - grid: background grid overlay
 */
export function renderSuperhero(
  spec: SuperheroSpec,
  ctx: RenderContext,
  showcase: ShowcaseFlags,
): string {
  const accent = ctx.themeTokens.accent;
  const parts: string[] = [];

  // Detect brutalist mode: taglines or descriptors present
  const isBrutalist = !!(spec.taglines?.length || spec.descriptors?.length);

  // Mesh gradient overlay — suppressed in brutalist mode (grid replaces it)
  if (showcase.heroMesh && !isBrutalist) {
    parts.push(`  <div class="gb-hero-mesh" aria-hidden="true"></div>`);
  }

  // Grid overlay (brutalist mode — default on)
  if (isBrutalist && spec.grid !== false) {
    parts.push(`  <div class="gb-hero-grid" aria-hidden="true"></div>`);
  }

  // First tagline row (brutalist enhancement)
  if (spec.taglines?.[0]) {
    parts.push(renderTaglineRow(spec.taglines[0]));
  }

  // Title — brutalist rendering (wireframe stroke + fill-on-hover)
  // No letter animation for brutalist style
  parts.push(renderBrutalistTitle(spec.title));

  // Second tagline row (brutalist enhancement)
  if (spec.taglines?.[1]) {
    parts.push(renderTaglineRow(spec.taglines[1]));
  }

  // Descriptors grid (brutalist enhancement)
  if (spec.descriptors?.length) {
    parts.push(renderDescriptors(spec.descriptors, ctx));
  }

  // Body text (fallback when no descriptors)
  if (spec.body && !spec.descriptors?.length) {
    parts.push(`  <div class="gb-hero-body">${renderMarkdown(spec.body)}</div>`);
  }

  // Enhanced scroll CTA (brutalist enhancement)
  const cta = spec.scroll_cta ?? { label: "Explore", style: "ring" };
  parts.push(renderScrollCta(cta));

  // Accent bar
  parts.push(`  <div class="gb-hero-accent" style="--gb-hero-accent-bg: ${accent}"></div>`);

  // Effect attribute for CSS targeting — suppressed in brutalist mode
  const effects: string[] = [];
  if (showcase.heroMesh && !isBrutalist) effects.push("mesh");
  const effectAttr = effects.length ? ` data-effect="${effects.join(" ")}"` : "";

  // Title-length tier: drives font-size scaling in CSS.
  // Short titles (≤6 chars) get the full dramatic treatment;
  // longer titles step down so they don't overflow the viewport.
  const len = spec.title.length;
  const titleLen = len <= 6 ? "short" : len <= 12 ? "medium" : "long";

  return `<section class="gb-hero" role="banner" data-align="center"${effectAttr} data-size="full" data-title-len="${titleLen}">
${parts.join("\n")}
</section>`;
}

/** Render a tagline row with flanking lines. */
function renderTaglineRow(text: string): string {
  return `  <div class="gb-hero-tagline-row">
    <span class="gb-hero-tagline-line"></span>
    <span class="gb-hero-tagline-text">${esc(text)}</span>
    <span class="gb-hero-tagline-line"></span>
  </div>`;
}

/** Render brutalist title with wireframe stroke and fill-on-hover effect. */
function renderBrutalistTitle(title: string): string {
  return `  <div class="gb-hero-title-container">
    <h1 class="gb-hero-title">${esc(title)}</h1>
    <div class="gb-hero-title-fill" aria-hidden="true">${esc(title)}</div>
  </div>`;
}

/** Render descriptor grid (3-column feature boxes). */
function renderDescriptors(descriptors: DescriptorSpec[], ctx: RenderContext): string {
  const items = descriptors
    .map(
      (d) => `    <div class="gb-hero-descriptor">
      <div class="gb-hero-descriptor-title">${esc(d.title)}</div>
      <div class="gb-hero-descriptor-body">${renderMarkdown(d.body)}</div>
    </div>`,
    )
    .join("\n");
  return `  <div class="gb-hero-descriptors">
${items}
  </div>`;
}

/** Render enhanced scroll CTA with ring or simple style. */
function renderScrollCta(cta: ScrollCtaSpec): string {
  const label = cta.label ?? "Explore";
  const style = cta.style ?? "ring";
  const target = cta.target ?? "#content";

  if (style === "simple") {
    return `  <a href="${target}" class="gb-hero-scroll" aria-label="Scroll to content">
    <span class="gb-hero-scroll-label">${esc(label)}</span>
    <svg class="gb-hero-scroll-arrow" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2"/>
    </svg>
  </a>`;
  }

  // Ring style (default)
  return `  <a href="${target}" class="gb-hero-scroll" aria-label="Scroll to content">
    <span class="gb-hero-scroll-label">${esc(label)}</span>
    <div class="gb-hero-scroll-ring">
      <svg class="gb-hero-scroll-arrow" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>
  </a>`;
}
