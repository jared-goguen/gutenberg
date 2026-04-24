/**
 * Navigation resolution — flatten SiteSpec.nav into operational structures.
 */

import type { SiteSpec, NavItem, NavLink, SiteNavResolved } from "./types.js";

/**
 * Resolve a SiteSpec into operational navigation structures.
 *
 * Flattens the nav tree into ordered lists, separator sets,
 * and per-section orderings that the build pipeline consumes.
 */
export function resolveSiteNav(spec: SiteSpec): SiteNavResolved {
  const order: string[] = [];
  const separators = new Set<string>();
  const labels = new Map<string, string>();
  const expanded = new Set<string>();
  const categories: { label: string; slugs: string[] }[] = [];
  const sections = new Map<string, string[]>();
  const links = new Map<string, { url: string; title: string }>();

  if (spec.expanded) {
    for (const slug of spec.expanded) expanded.add(slug);
  }
  if (spec.labels) {
    for (const [slug, label] of Object.entries(spec.labels)) {
      labels.set(slug, label);
    }
  }

  if (!spec.nav) {
    return { order, separators, labels, expanded, categories, sections, links };
  }

  let nextGetsSeparator = false;
  let currentCategory: { label: string; slugs: string[] } | null = null;

  for (const item of spec.nav) {
    if (typeof item === "string") {
      if (item === "---") {
        nextGetsSeparator = true;
        continue;
      }

      order.push(item);
      if (nextGetsSeparator) {
        separators.add(item);
        nextGetsSeparator = false;
      }
      if (currentCategory) {
        currentCategory.slugs.push(item);
      }
      continue;
    }

    // Group header
    if ("group" in item) {
      currentCategory = { label: (item as { group: string }).group, slugs: [] };
      categories.push(currentCategory);
      continue;
    }

    // External link
    if ("url" in item) {
      const link = item as NavLink;
      const key = link.url;
      links.set(key, { url: link.url, title: link.title });
      order.push(key);
      if (nextGetsSeparator) {
        separators.add(key);
        nextGetsSeparator = false;
      }
      if (currentCategory) {
        currentCategory.slugs.push(key);
      }
      continue;
    }

    // Branch: { slug: [children] }
    const entries = Object.entries(item);
    if (entries.length === 1) {
      const [slug, children] = entries[0] as [string, NavItem[]];
      order.push(slug);
      if (nextGetsSeparator) {
        separators.add(slug);
        nextGetsSeparator = false;
      }
      if (currentCategory) {
        currentCategory.slugs.push(slug);
      }

      resolveBranch(slug, children, sections);
    }
  }

  return { order, separators, labels, expanded, categories, sections, links };
}

/**
 * Recursively resolve a branch's children into section orderings.
 */
function resolveBranch(
  prefix: string,
  items: NavItem[],
  sections: Map<string, string[]>,
): void {
  const slugs: string[] = [];

  for (const item of items) {
    if (typeof item === "string" && item !== "---") {
      slugs.push(item);
    } else if (typeof item === "object" && !("group" in item)) {
      const entries = Object.entries(item);
      if (entries.length === 1) {
        const [childSlug, grandchildren] = entries[0] as [string, NavItem[]];
        slugs.push(childSlug);
        resolveBranch(`${prefix}/${childSlug}`, grandchildren, sections);
      }
    }
  }

  if (slugs.length > 0) {
    sections.set(prefix, slugs);
  }
}
