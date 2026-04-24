/**
 * Site navigation — tree builder and sidebar renderer.
 *
 * The build pipeline discovers specs, extracts titles, and builds a NavTree.
 * The sidebar is rendered into every page alongside the content column.
 * Pure HTML <details> for collapsibility — no JS required. JS only
 * auto-collapses non-current sections on load.
 */

import { esc } from "./blocks/types.js";
import type { SpecEntry } from "./specs/site/index.js";

// ── Types ────────────────────────────────────────────────────

export interface NavNode {
  title: string;
  urlPath: string;
}

/** A section anchor within a page (from section_label blocks). */
export interface PageSection {
  label: string;
  id: string;
}

export interface NavSection {
  /** Original directory slug (e.g. "workstreams") */
  slug: string;
  /** Humanized section slug (e.g. "Servers") — used as the <summary> toggle */
  label: string;
  /** Section index page (the _index.yaml) */
  index?: NavNode;
  /** Non-index child pages */
  children: NavNode[];
  /** Nested subsections (directories with their own _index.yaml) */
  subsections?: NavSection[];
  /** Optional category groupings for visual sub-headers (e.g. servers: PLATFORM, PUBLISHING...) */
  categories?: { label: string; slugs: string[] }[];
  /** Render a visual separator before this section in the sidebar */
  separator?: boolean;
  /** Always expand this section's children, even when not the current section */
  expanded?: boolean;
}

export interface RootPage {
  node: NavNode;
  separator?: boolean;
  /** Visual group header rendered before this page (from { group: "LABEL" } items). */
  category?: string;
}

export interface SiteNav {
  home: NavNode;
  /** Root-level pages (no section directory). Ordered by nav config. */
  rootPages: RootPage[];
  sections: NavSection[];
}

// ── Tree building ────────────────────────────────────────────

/** Convert a slug to a readable label: "case-study" → "Case Study" */
export function humanize(slug: string): string {
  return slug
    .replace(/^\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Nav ordering extracted from a section's _index.yaml.
 * Slugs come from card `link:` fields in declared order.
 * Category labels (from section_labels preceding cards blocks)
 * produce visual group headers in the sidebar.
 */
export interface NavOrder {
  /** Page slugs in declared order (e.g. ["page-principles", "the-spec", ...]) */
  slugs: string[];
  /** Optional category groupings: label → slug[] in order */
  categories?: { label: string; slugs: string[] }[];
}

/**
 * Site-level nav config from root _index.yaml `nav:` field.
 * Controls section ordering and separator placement in the sidebar.
 * Items are section slugs; `---` inserts a visual separator.
 */
export interface NavConfig {
  order: string[];
  separators: Set<string>;
  /** Custom sidebar labels: slug → short title. */
  labels: Map<string, string>;
  /** Sections that should always show their children (+ prefix in nav config). */
  expanded: Set<string>;
  /** Category groupings for root-level pages (from { group: "LABEL" } items). */
  categories?: { label: string; slugs: string[] }[];
  /** External links keyed by URL path. Keys appear in order/categories for positioning. */
  links?: Map<string, { url: string; title: string }>;
}

/** Sort NavNodes by declared order from navOrders, falling back to alphabetical. */
function sortNavNodes(nodes: NavNode[], order?: NavOrder): void {
  if (order) {
    const slugIndex = new Map(order.slugs.map((s, i) => [s, i]));
    nodes.sort((a, b) => {
      const aSlug = a.urlPath.split("/").filter(Boolean).pop() ?? "";
      const bSlug = b.urlPath.split("/").filter(Boolean).pop() ?? "";
      const aIdx = slugIndex.get(aSlug) ?? Infinity;
      const bIdx = slugIndex.get(bSlug) ?? Infinity;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.title.localeCompare(b.title);
    });
  } else {
    nodes.sort((a, b) => a.title.localeCompare(b.title));
  }
}

/** Sort NavSections by declared order from navOrders, falling back to alphabetical. */
function sortSubsections(subs: NavSection[], order?: NavOrder): void {
  if (order) {
    const slugIndex = new Map(order.slugs.map((s, i) => [s, i]));
    subs.sort((a, b) => {
      const aIdx = slugIndex.get(a.slug) ?? Infinity;
      const bIdx = slugIndex.get(b.slug) ?? Infinity;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.label.localeCompare(b.label);
    });
  } else {
    subs.sort((a, b) => a.label.localeCompare(b.label));
  }
}

/**
 * Recursively split a flat list of pages into direct children and nested subsections.
 */
function buildSubtree(
  pages: SpecEntry[],
  basePath: string,
  getTitle: (key: string) => string,
  navOrders?: Map<string, NavOrder>,
): { children: NavNode[]; subsections: NavSection[] } {
  const directPages: SpecEntry[] = [];
  const nestedMap = new Map<string, { index?: SpecEntry; pages: SpecEntry[] }>();

  for (const page of pages) {
    const relKey = page.key.substring(basePath.length + 1);
    const segments = relKey.split("/");

    if (segments.length >= 2) {
      const subSlug = segments[0];
      if (!nestedMap.has(subSlug)) {
        nestedMap.set(subSlug, { pages: [] });
      }
      const sub = nestedMap.get(subSlug)!;

      if (page.isIndex && segments.length === 2 && segments[1] === "_index.yaml") {
        sub.index = page;
      } else {
        sub.pages.push(page);
      }
    } else {
      directPages.push(page);
    }
  }

  const order = navOrders?.get(basePath);

  const children: NavNode[] = directPages.map((p) => {
    const slug = p.urlPath.split("/").filter(Boolean).pop() ?? "";
    return {
      title: order ? humanize(slug) : getTitle(p.key),
      urlPath: p.urlPath,
    };
  });
  sortNavNodes(children, order);

  const subsections: NavSection[] = [];
  for (const [subSlug, subGroup] of nestedMap) {
    const subBasePath = `${basePath}/${subSlug}`;
    const subIndex = subGroup.index
      ? { title: getTitle(subGroup.index.key), urlPath: subGroup.index.urlPath }
      : undefined;

    const { children: subChildren, subsections: subSubsections } = buildSubtree(
      subGroup.pages,
      subBasePath,
      getTitle,
      navOrders,
    );

    const sub: NavSection = {
      slug: subSlug,
      label: subIndex?.title ?? humanize(subSlug),
      index: subIndex,
      children: subChildren,
    };
    if (subSubsections.length > 0) {
      sub.subsections = subSubsections;
    }
    subsections.push(sub);
  }

  sortSubsections(subsections, order);

  return { children, subsections };
}

/**
 * Build a site navigation tree from discovered specs.
 */
export function buildNavTree(
  entries: SpecEntry[],
  getTitle: (key: string) => string,
  navOrders?: Map<string, NavOrder>,
  navConfig?: NavConfig,
): SiteNav {
  const rootEntry = entries.find((e) => e.key === "_index.yaml");
  const home: NavNode = {
    title: rootEntry ? getTitle(rootEntry.key) : "Home",
    urlPath: "/",
  };

  const sectionMap = new Map<string, { index?: SpecEntry; pages: SpecEntry[] }>();
  const rootPageEntries: SpecEntry[] = [];

  for (const entry of entries) {
    if (entry.key === "_index.yaml") continue;
    if (!entry.section) {
      rootPageEntries.push(entry);
      continue;
    }

    if (!sectionMap.has(entry.section)) {
      sectionMap.set(entry.section, { pages: [] });
    }
    const group = sectionMap.get(entry.section)!;

    const isSectionIndex = entry.isIndex && entry.key === `${entry.section}/_index.yaml`;
    if (isSectionIndex) {
      group.index = entry;
    } else {
      group.pages.push(entry);
    }
  }

  const sections: NavSection[] = [];
  for (const [section, group] of sectionMap) {
    const label = navConfig?.labels.get(section) ?? humanize(section);
    const index = group.index
      ? { title: getTitle(group.index.key), urlPath: group.index.urlPath }
      : undefined;

    const { children, subsections } = buildSubtree(
      group.pages,
      section,
      getTitle,
      navOrders,
    );

    const navSection: NavSection = { slug: section, label, index, children };
    if (subsections.length > 0) {
      navSection.subsections = subsections;
    }

    const order = navOrders?.get(section);
    if (order?.categories) {
      navSection.categories = order.categories;
    }

    sections.push(navSection);
  }

  if (navConfig) {
    const orderIndex = new Map(navConfig.order.map((s, i) => [s, i]));
    sections.sort((a, b) => {
      const aIdx = orderIndex.get(a.slug) ?? Infinity;
      const bIdx = orderIndex.get(b.slug) ?? Infinity;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.label.localeCompare(b.label);
    });
    for (const section of sections) {
      if (navConfig.separators.has(section.slug)) {
        section.separator = true;
      }
      if (navConfig.expanded.has(section.slug)) {
        section.expanded = true;
      }
    }
  } else {
    sections.sort((a, b) => a.label.localeCompare(b.label));
  }

  const slugOfPath = (p: string) => p.split("/").filter(Boolean).pop() ?? "";
  const rootPageNodes: NavNode[] = rootPageEntries.map((e) => {
    const slug = slugOfPath(e.urlPath);
    const customLabel = navConfig?.labels.get(slug);
    return {
      title: customLabel ?? getTitle(e.key),
      urlPath: e.urlPath,
    };
  });

  if (navConfig?.links) {
    for (const [, link] of navConfig.links) {
      rootPageNodes.push({ title: link.title, urlPath: link.url });
    }
  }

  if (navConfig) {
    const orderIndex = new Map(navConfig.order.map((s, i) => [s, i]));
    const getIdx = (urlPath: string) =>
      orderIndex.get(slugOfPath(urlPath)) ?? orderIndex.get(urlPath) ?? Infinity;
    rootPageNodes.sort((a, b) => {
      const aIdx = getIdx(a.urlPath);
      const bIdx = getIdx(b.urlPath);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.title.localeCompare(b.title);
    });
  } else {
    rootPageNodes.sort((a, b) => a.title.localeCompare(b.title));
  }

  const categoryFirstSlug = new Map<string, string>();
  if (navConfig?.categories) {
    for (const cat of navConfig.categories) {
      if (cat.slugs.length > 0) {
        categoryFirstSlug.set(cat.slugs[0], cat.label);
      }
    }
  }

  const rootPages: RootPage[] = rootPageNodes.map((node) => {
    const slug = slugOfPath(node.urlPath);
    const key = node.urlPath;
    const page: RootPage = { node };
    if (navConfig?.separators.has(slug) || navConfig?.separators.has(key)) page.separator = true;
    const catLabel = categoryFirstSlug.get(slug) ?? categoryFirstSlug.get(key);
    if (catLabel) page.category = catLabel;
    return page;
  });

  return { home, rootPages, sections };
}

// ── HTML rendering ───────────────────────────────────────────

/**
 * Render the sidebar HTML from a nav tree and the current page path.
 */
export function renderSidebar(nav: SiteNav, currentPath: string): string {
  const active = (urlPath: string) =>
    urlPath === currentPath ? " gb-sidebar-active" : "";
  const inSection = (section: NavSection): boolean =>
    currentPath === section.index?.urlPath ||
    section.children.some((c) => c.urlPath === currentPath) ||
    (section.subsections ?? []).some((sub) => inSection(sub));

  function renderGroup(section: NavSection, depth: number): string {
    const isCurrent = inSection(section);
    const lines: string[] = [];

    const href = section.index
      ? esc(section.index.urlPath)
      : section.children.length > 0
        ? esc(section.children[0].urlPath)
        : "#";
    const activeClass = active(section.index?.urlPath ?? "");

    if (depth === 0) {
      if (section.separator) lines.push(`    <div class="gb-sidebar-sep"></div>`);
      lines.push(
        `    <a class="gb-sidebar-section${activeClass}" href="${href}">${esc(section.label)}</a>`,
      );
    } else if (depth === 1) {
      lines.push(
        `      <a class="gb-sidebar-subsection${activeClass}" href="${href}">${esc(section.label)}</a>`,
      );
    } else {
      lines.push(
        `      <a class="gb-sidebar-subgroup${activeClass}" href="${href}" data-depth="${depth}">${esc(section.label)}</a>`,
      );
    }

    const hasContent = section.children.length > 0 || (section.subsections?.length ?? 0) > 0;
    if ((!isCurrent && !section.expanded) || !hasContent) return lines.join("\n");

    const childLines: string[] = [];

    if (depth === 0 && section.categories?.length) {
      const childBySlug = new Map(
        section.children.map((c) => [c.urlPath.split("/").filter(Boolean).pop() ?? "", c]),
      );
      const rendered = new Set<string>();
      for (const cat of section.categories) {
        childLines.push(`      <span class="gb-sidebar-category">${esc(cat.label)}</span>`);
        for (const slug of cat.slugs) {
          const child = childBySlug.get(slug);
          if (child) {
            childLines.push(renderLeaf(child, depth));
            rendered.add(slug);
          }
        }
      }
      for (const child of section.children) {
        const slug = child.urlPath.split("/").filter(Boolean).pop() ?? "";
        if (!rendered.has(slug)) childLines.push(renderLeaf(child, depth));
      }
    } else {
      for (const child of section.children) {
        childLines.push(renderLeaf(child, depth));
      }
    }

    for (const sub of section.subsections ?? []) {
      childLines.push(renderGroup(sub, depth + 1));
    }

    lines.push(`    <div class="gb-sidebar-pages" data-depth="${depth}">`);
    lines.push(...childLines);
    lines.push(`    </div>`);

    return lines.join("\n");
  }

  function renderLeaf(node: NavNode, parentDepth: number): string {
    const cls = parentDepth === 0 ? "gb-sidebar-link" : "gb-sidebar-sublink";
    return `      <a class="${cls}${active(node.urlPath)}" href="${esc(node.urlPath)}">${esc(node.title)}</a>`;
  }

  const rootLinks: string[] = [];
  for (const { node, separator, category } of nav.rootPages) {
    if (separator) rootLinks.push(`    <div class="gb-sidebar-sep"></div>`);
    if (category) rootLinks.push(`    <span class="gb-sidebar-category">${esc(category)}</span>`);
    rootLinks.push(
      `    <a class="gb-sidebar-link${active(node.urlPath)}" href="${esc(node.urlPath)}">${esc(node.title)}</a>`,
    );
  }
  const rootBlock = rootLinks.length > 0 ? rootLinks.join("\n") : "";

  const groups = nav.sections.map((s) => renderGroup(s, 0)).join("\n");

  const body = [rootBlock, groups].filter(Boolean).join("\n");

  return `<aside class="gb-sidebar">
  <nav class="gb-sidebar-nav" aria-label="Site navigation">
    <a class="gb-sidebar-home${active("/")}" href="/#content">${esc(nav.home.title)}</a>
${body}
  </nav>
</aside>`;
}

// ── Navigation utilities ─────────────────────────────────────

/** Page reference in the flat navigation sequence. */
export interface NavPageRef {
  title: string;
  urlPath: string;
}

/**
 * Flatten the SiteNav tree into a linear page sequence matching sidebar order.
 * Used for prev/next page navigation.
 */
export function flattenNav(nav: SiteNav): NavPageRef[] {
  const pages: NavPageRef[] = [];

  pages.push({ title: nav.home.title, urlPath: nav.home.urlPath });

  for (const { node } of nav.rootPages) {
    pages.push({ title: node.title, urlPath: node.urlPath });
  }

  function flattenSection(section: NavSection): void {
    if (section.index) {
      pages.push({ title: section.index.title, urlPath: section.index.urlPath });
    }
    for (const child of section.children) {
      pages.push({ title: child.title, urlPath: child.urlPath });
    }
    for (const sub of section.subsections ?? []) {
      flattenSection(sub);
    }
  }

  for (const section of nav.sections) {
    flattenSection(section);
  }

  return pages;
}

/** Breadcrumb entry: title + URL (last entry has no URL — it's the current page). */
export interface BreadcrumbEntry {
  title: string;
  url?: string;
}

/**
 * Resolve breadcrumbs for a given page path from the SiteNav tree.
 */
export function resolveBreadcrumbs(nav: SiteNav, currentPath: string): BreadcrumbEntry[] {
  if (currentPath === "/") return [{ title: nav.home.title }];

  const crumbs: BreadcrumbEntry[] = [{ title: nav.home.title, url: "/" }];

  const segments = currentPath.split("/").filter(Boolean);

  let currentSection: NavSection | undefined;

  for (let i = 0; i < segments.length; i++) {
    const slug = segments[i];
    const partialPath = "/" + segments.slice(0, i + 1).join("/") + "/";
    const isLast = i === segments.length - 1;

    if (i === 0) {
      currentSection = nav.sections.find((s) => s.index?.urlPath === partialPath || s.slug === slug);

      const rootPage = nav.rootPages.find((p) => p.node.urlPath === partialPath);
      if (rootPage) {
        crumbs.push({ title: rootPage.node.title, url: isLast ? undefined : partialPath });
        continue;
      }

      if (currentSection) {
        const title = currentSection.index?.title ?? currentSection.label;
        crumbs.push({
          title,
          url: isLast ? undefined : (currentSection.index?.urlPath ?? partialPath),
        });
      } else {
        crumbs.push({ title: humanize(slug), url: isLast ? undefined : partialPath });
      }
    } else {
      if (currentSection) {
        const child = currentSection.children.find((c) => c.urlPath === partialPath);
        if (child) {
          crumbs.push({ title: child.title, url: isLast ? undefined : partialPath });
          continue;
        }

        const sub = (currentSection.subsections ?? []).find(
          (s) => s.index?.urlPath === partialPath || s.slug === slug,
        );
        if (sub) {
          const title = sub.index?.title ?? sub.label;
          crumbs.push({ title, url: isLast ? undefined : (sub.index?.urlPath ?? partialPath) });
          currentSection = sub;
          continue;
        }

        for (const sub2 of currentSection.subsections ?? []) {
          const subChild = sub2.children.find((c) => c.urlPath === partialPath);
          if (subChild) {
            crumbs.push({ title: subChild.title, url: isLast ? undefined : partialPath });
            break;
          }
        }
      } else {
        crumbs.push({ title: humanize(slug), url: isLast ? undefined : partialPath });
      }
    }
  }

  return crumbs;
}
