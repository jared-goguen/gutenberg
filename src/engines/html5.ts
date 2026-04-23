/**
 * HTML5 render engine.
 *
 * Consumes a CompilePlan, produces a complete HTML5 document with
 * CSS custom properties, progressive enhancement, and inline SVG support.
 */

import type { SpecBlock } from "../specs/page/index.js";
import { blockType, blockValue } from "../specs/page/index.js";
import type { Separation } from "../specs/page/semantics.js";

import { getThemeStylesheet } from "../stylesheets/index.js";
import { wrapDocument } from "../document.js";
import { renderBlock } from "../blocks/dispatch.js";
import type { RenderContext, LinkResolver, RecentResolver } from "../blocks/types.js";
import { esc } from "../blocks/types.js";
import type { SiteNav } from "../site-nav.js";
import type { NavPageRef, BreadcrumbEntry } from "../site-nav.js";
import type { CompilePlan, RenderResult, RenderEngine } from "../backend.js";

// ── Public types ──────────────────────────────────────────────

export interface CompileResult extends RenderResult {}

export interface CompileOptions {
  /** Resolve link references to URL paths. Used during project builds. */
  resolveLink?: LinkResolver;
  /** Resolve recent pages in a subtree. Used during project builds. */
  resolveRecent?: RecentResolver;
  /** Site navigation tree — enables sidebar rendering on every page. */
  siteNav?: SiteNav;
  /** URL path of the current page (e.g. "/servers/scout/"). Drives active state. */
  currentPath?: string;
  /** Previous page in site navigation order. */
  prevPage?: NavPageRef;
  /** Next page in site navigation order. */
  nextPage?: NavPageRef;
  /** Breadcrumb trail from root to current page. */
  breadcrumbs?: BreadcrumbEntry[];
  /** Custom theme CSS appended after the generated stylesheet.
   *  Loaded from <project>-theme.css by the build pipeline. */
  themeCSS?: string;
  /** Root directory for resolving relative bundle paths.
   *  Derived from projectDir by the build pipeline. Falls back to CWD. */
  resolveRoot?: string;
}

// ── Render ────────────────────────────────────────────────────

/** Gap between frame (hero/closing) and content in rem. */
const FRAME_GAP: Record<Separation, number> = {
  tight: 1.25,
  standard: 2,
  spacious: 3,
};

/** Render a CompilePlan to a complete HTML5 document. */
export function renderHtml5(p: CompilePlan, options?: CompileOptions): CompileResult {
  const {
    density,
    separation,
    emphasis,
    shadow,
    align,
    theme: t,
    showcase,
    enrichments,
    contentBlocks,
  } = p;

  // ── Build render context ──────────────────────────────────
  const themeName = p.spec.theme ?? "cloudflare";
  const ctx: RenderContext = {
    themeName,
    density,
    separation,
    emphasis,
    shadow,
    align,
    blockIndex: 0,
    totalBlocks: contentBlocks.length,
    themeTokens: t,
    // Backward compat for block renderers (Phase 2 will remove)
    scheme: themeName,
    theme: t,
    resolveLink: options?.resolveLink,
    resolveRecent: options?.resolveRecent,
    resolveRoot: options?.resolveRoot,
  };

  // ── Render content blocks ─────────────────────────────────
  const fragments = contentBlocks.map((block, i) => {
    try {
      return renderBlock(
        block,
        { ...ctx, blockIndex: i },
        contentBlocks,
        showcase,
        enrichments.get(i),
      );
    } catch (err) {
      const type = blockType(block);
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Block ${i} (${type}): ${msg}`);
    }
  });

  // ── Assemble with pre-computed gaps ───────────────────────
  const contentHtml = assembleGaps(fragments, p);

  // ── Frame: hero/superhero → content → closing ─────────────
  const frameParts: string[] = [];
  let heroHtml: string | undefined;

  if (p.superhero) {
    heroHtml = renderBlock(p.superhero, ctx);
  }

  if (p.superhero) {
    // Transitional gradient zone between superhero viewport and content
    frameParts.push(`<div class="gb-hero-transition" aria-hidden="true"></div>`);
  }

  if (p.hero) {
    frameParts.push(renderBlock(p.hero, ctx));
    frameParts.push(`<div style="margin-bottom: ${FRAME_GAP[separation]}rem"></div>`);
  }

  frameParts.push(contentHtml);

  if (p.closing) {
    frameParts.push(`<div style="margin-bottom: ${FRAME_GAP[separation]}rem"></div>`);
    frameParts.push(renderBlock(p.closing, ctx));
  }

  // ── Prev/Next page footer ─────────────────────────────────
  let pageFooterHtml: string | undefined;
  if (options?.prevPage || options?.nextPage) {
    const parts: string[] = [];
    if (options.prevPage) {
      parts.push(`<a class="gb-page-footer-link gb-page-footer-prev" href="${esc(options.prevPage.urlPath)}">`
        + `<span class="gb-page-footer-label">Previous</span>`
        + `<span class="gb-page-footer-title">${esc(options.prevPage.title)}</span></a>`);
    } else {
      parts.push(`<div></div>`);
    }
    if (options.nextPage) {
      parts.push(`<a class="gb-page-footer-link gb-page-footer-next" href="${esc(options.nextPage.urlPath)}">`
        + `<span class="gb-page-footer-label">Next</span>`
        + `<span class="gb-page-footer-title">${esc(options.nextPage.title)}</span></a>`);
    } else {
      parts.push(`<div></div>`);
    }
    pageFooterHtml = `<nav class="gb-page-footer" aria-label="Page navigation">${parts.join("")}</nav>`;
  }

  // ── Breadcrumbs ───────────────────────────────────────────
  let breadcrumbsHtml: string | undefined;
  let breadcrumbsJsonLd: string | undefined;
  if (options?.breadcrumbs && options.breadcrumbs.length > 1) {
    const items = options.breadcrumbs.map((b, i) => {
      const isLast = i === options.breadcrumbs!.length - 1;
      if (isLast) {
        return `<li class="gb-crumb" aria-current="page">${esc(b.title)}</li>`;
      }
      return `<li class="gb-crumb"><a class="gb-crumb-link" href="${esc(b.url!)}">${esc(b.title)}</a></li>`;
    });
    breadcrumbsHtml = `<nav class="gb-breadcrumbs" aria-label="Breadcrumb"><ol>${items.join("")}</ol></nav>`;

    // JSON-LD structured data
    const ldItems = options.breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.title,
      ...(b.url ? { item: b.url } : {}),
    }));
    breadcrumbsJsonLd = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: ldItems,
    })}</script>`;
  }

  // ── Wrap in HTML5 document ────────────────────────────────
  const hasSidebar = !!(options?.siteNav && options?.currentPath);
  const stylesheet = getThemeStylesheet(t)
    + (options?.themeCSS ? `\n/* === Theme overrides === */\n${options.themeCSS}\n` : "");

  const html = wrapDocument({
    title: p.title,
    stylesheet,
    body: frameParts.join("\n"),
    density,
    separation,
    emphasis,
    shadow,
    description: p.description,
    url: p.spec.url,
    accentColor: t.accent,
    faviconStyle: t.stylesheet,
    texture: showcase.texture,
    heroParticles: showcase.heroParticles,
    heroHtml,
    siteNav: options?.siteNav,
    currentPath: options?.currentPath,
    pageFooterHtml,
    breadcrumbsHtml,
    breadcrumbsJsonLd,
    viewTransitions: hasSidebar,
    progressBar: true,
    hashSync: true,
    fontUrl: t.fontUrl,
  });

  return { html };
}

// ── Gap assembly ────────────────────────────────────────────

function assembleGaps(fragments: string[], p: CompilePlan): string {
  if (fragments.length === 0) return "";

  const parts: string[] = [];

  for (let i = 0; i < fragments.length; i++) {
    const isLast = i === fragments.length - 1;

    if (isLast) {
      parts.push(wrapBlock(fragments[i], 0));
      break;
    }

    const gap = p.gaps[i];
    if (!gap || gap.divider === "none") {
      parts.push(wrapBlock(fragments[i], gap?.size ?? 1.5));
    } else {
      const halfGap = gap.size / 2;
      parts.push(wrapBlock(fragments[i], halfGap));
      parts.push(cohesionDivider(gap.divider, halfGap));
    }
  }

  return parts.join("\n");
}

function wrapBlock(html: string, marginBottom: number): string {
  const style = marginBottom > 0
    ? ` style="margin-bottom: ${marginBottom}rem"`
    : "";
  return `<div class="gb-block"${style}>\n${html}\n</div>`;
}

function cohesionDivider(
  type: "subtle" | "bold",
  marginBottom: number,
): string {
  const weight = type === "bold" ? 2 : 1;
  return `<hr class="gb-cohesion-divider" style="border-top-width: ${weight}px; margin-bottom: ${marginBottom}rem">`;
}

// ── RenderEngine adapter ────────────────────────────────────

/** HTML5 render engine — implements the RenderEngine contract. */
export const html5Engine: RenderEngine<CompileOptions> = {
  render: renderHtml5,
};
