import type { ThemeTokens } from "../chromata/themes.js";
import type { Separation, Emphasis, Shadow } from "../specs/page/semantics.js";



/**
 * Link resolver callback. Given a link reference from a card spec,
 * returns a URL path (e.g. "/billing/dunning/") or undefined if unresolvable.
 *
 * The `fromKey` is the spec key of the page containing the link.
 * The `ref` is the link value — either a string or { title, text?, spaceKey? }.
 */
export type LinkResolver = (
  ref: string,
) => string | undefined;

export interface RenderContext {
  themeName: string;
  density: "compact" | "standard" | "spacious";
  separation: Separation;
  emphasis: Emphasis;
  shadow: Shadow;
  align: "left" | "center";
  blockIndex: number;
  totalBlocks: number;
  themeTokens: ThemeTokens;
  /** @deprecated Use themeName instead. */
  scheme: string;
  /** @deprecated Use themeTokens instead. */
  theme: ThemeTokens;
  /** Resolve a link reference to a URL path. Absent = no link resolution. */
  resolveLink?: LinkResolver;
  /** Resolve recent pages in a subtree. Populated during project builds. */
  resolveRecent?: RecentResolver;
  /** Root directory for resolving relative bundle paths (sandbox/app_shell src).
   *  Falls back to process.cwd() when absent (standalone compilation). */
  resolveRoot?: string;
}

/** Entry returned by RecentResolver — a page in the project with metadata. */
export interface ResolvedRecentEntry {
  title: string;
  link: string;
  modified: string;
  section?: string;
}

/** Resolve the N most recently modified specs under a subtree path. */
export type RecentResolver = (path?: string, count?: number) => ResolvedRecentEntry[];

/** Derive a URL-safe anchor slug from label text. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Escape text for safe HTML insertion (covers both single- and double-quoted attributes). */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Render categories eyebrow: accent-colored tags separated by a muted delimiter. */
export function renderEyebrow(categories: string[]): string {
  if (categories.length === 0) return "";
  const inner = categories
    .map(c => `<span class="gb-eyebrow-tag">${esc(c)}</span>`)
    .join('<span class="gb-eyebrow-sep"> ✦ </span>');
  return `  <p class="gb-hero-eyebrow">${inner}</p>`;
}
