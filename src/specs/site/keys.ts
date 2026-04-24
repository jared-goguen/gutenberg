/**
 * Spec key utilities — classification, URL derivation, link resolution.
 *
 * Pure functions operating on spec keys (paths relative to project root).
 * No filesystem access.
 */

import { createHash } from "node:crypto";
import type { SpecEntry } from "./types.js";

// ── Spec key classification ──────────────────────────────────

/** Is this spec key an index page? */
export function isIndex(key: string): boolean {
  return key === "_index.yaml" || key.endsWith("/_index.yaml");
}

/**
 * Extract the section from a spec key.
 * Returns undefined for root-level specs.
 */
export function sectionOf(key: string): string | undefined {
  const slash = key.indexOf("/");
  if (slash === -1) return undefined;
  return key.substring(0, slash);
}

/**
 * Extract the slug (basename without extension) from a spec key.
 * For index pages, returns the parent directory name (or empty string for root index).
 */
export function slugOf(key: string): string {
  const basename = key.split("/").pop() ?? key;
  const name = basename.replace(/\.yaml$/, "");
  if (name === "_index") {
    const section = sectionOf(key);
    return section ?? "";
  }
  return name;
}

// ── URL derivation ───────────────────────────────────────────

/**
 * Derive the URL path from a spec key.
 * Always returns a path starting and ending with /.
 */
export function specKeyToUrlPath(key: string): string {
  if (key === "_index.yaml") return "/";

  const stem = key.replace(/\.yaml$/, "");
  if (stem.endsWith("/_index")) {
    const dir = stem.slice(0, -"/_index".length);
    return `/${dir}/`;
  }

  return `/${stem}/`;
}

// ── Link resolution ──────────────────────────────────────────

/**
 * Resolve a link reference to a spec key.
 *
 * Resolution rules:
 *   1. Bare name ("dunning")     → sibling in same directory
 *   2. Path ("billing/dunning")  → absolute from project root
 *   3. URL (starts with http//)  → passthrough (returns undefined)
 */
export function resolveLink(
  fromKey: string,
  ref: string,
  allKeys: ReadonlySet<string>,
): string | undefined {
  if (ref.startsWith("http://") || ref.startsWith("https://") || ref.startsWith("//")) {
    return undefined;
  }

  // Path reference — absolute from project root
  if (ref.includes("/")) {
    const normalized = ref.replace(/^\/+/, "").replace(/\/+$/, "");
    const candidate = normalized.endsWith(".yaml") ? normalized : `${normalized}.yaml`;
    if (allKeys.has(candidate)) return candidate;
    const indexCandidate = `${normalized}/_index.yaml`;
    if (allKeys.has(indexCandidate)) return indexCandidate;
    return undefined;
  }

  // Bare name — look for sibling in same directory
  const dir = sectionOf(fromKey);
  const prefix = dir ? `${dir}/` : "";

  const siblingKey = `${prefix}${ref}.yaml`;
  if (allKeys.has(siblingKey)) return siblingKey;

  const subdirKey = `${prefix}${ref}/_index.yaml`;
  if (allKeys.has(subdirKey)) return subdirKey;

  if (dir) {
    const rootSibling = `${ref}.yaml`;
    if (allKeys.has(rootSibling)) return rootSibling;
    const rootSubdir = `${ref}/_index.yaml`;
    if (allKeys.has(rootSubdir)) return rootSubdir;
  }

  return undefined;
}

// ── Content hashing ──────────────────────────────────────────

/** Stable content hash for incremental builds. */
export function contentHash(yaml: string): string {
  return createHash("sha256").update(yaml).digest("hex");
}

// ── Spec entry builder ───────────────────────────────────────

/** Build a SpecEntry from a key and absolute path. */
export function toSpecEntry(key: string, path: string): SpecEntry {
  return {
    key,
    path,
    isIndex: isIndex(key),
    section: sectionOf(key),
    urlPath: specKeyToUrlPath(key),
  };
}
