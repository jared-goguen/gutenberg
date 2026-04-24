/**
 * Convention validation — cross-file checks for [_index, …, reference/].
 *
 * Roles inferred from filesystem position:
 *   _index.yaml                → hub
 *   reference/*.yaml           → reference
 *   everything else            → main
 *
 * Convention checks:
 *   C2  orphaned-reference   Reference page not linked from any non-reference page
 *   C3  reference-backlink   Reference page links back to a main page
 *   C4  hubless-section      Directory with 2+ pages but no _index.yaml
 *   C5  nav-ordering         Hub with 3+ children but no nav field
 *
 * Pure functions — no filesystem access. Consumers pass parsed specs.
 */

import type { PageSpec } from "./types.js";

// ── Convention types ─────────────────────────────────────────

export type ConventionCheck =
  | "C2-orphaned-reference"
  | "C3-reference-backlink"
  | "C4-hubless-section"
  | "C5-nav-ordering";

export type ConventionSeverity = "error" | "warning" | "info";

// ── Spec key helpers ─────────────────────────────────────────

function isIndex(key: string): boolean {
  return key === "_index.yaml" || key.endsWith("/_index.yaml");
}

function specKeyToUrlPath(key: string): string {
  if (key === "_index.yaml") return "/";
  const stem = key.replace(/\.yaml$/, "");
  if (stem.endsWith("/_index")) {
    const dir = stem.slice(0, -"/_index".length);
    return `/${dir}/`;
  }
  return `/${stem}/`;
}

// ── Role inference ───────────────────────────────────────────

export type PageRole = "hub" | "main" | "reference";

export function inferRole(key: string): PageRole {
  if (isIndex(key)) return "hub";
  const dir = key.substring(0, key.lastIndexOf("/") + 1);
  if (/(?:^|\/)reference\//.test(dir)) return "reference";
  return "main";
}

// ── Link extraction ──────────────────────────────────────────

const MD_LINK = /\[(?:[^\]])*\]\(([^)]+)\)/g;

function markdownLinks(text: string | undefined | null): string[] {
  if (!text || typeof text !== "string") return [];
  const out: string[] = [];
  for (const m of text.matchAll(MD_LINK)) {
    const href = m[1];
    if (href.startsWith("/")) out.push(href);
  }
  return out;
}

export function extractLinks(spec: PageSpec): string[] {
  const links = new Set<string>();

  const add = (href: string) => {
    if (href.startsWith("/")) links.add(norm(href));
  };
  const addMd = (text: string | undefined | null) => {
    for (const href of markdownLinks(text)) add(href);
  };

  // Frame
  addMd(spec.hero?.body);
  addMd(spec.superhero?.body);
  addMd(spec.closing?.text);

  // Blocks
  for (const block of spec.blocks ?? []) {
    const entries = Object.entries(block);
    if (entries.length === 0) continue;
    const [type, val] = entries[0];
    if (!val || typeof val !== "object") continue;

    switch (type) {
      case "cards": {
        const items = (val as { items?: unknown[] }).items;
        if (!Array.isArray(items)) break;
        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const i = item as Record<string, unknown>;
          if (typeof i.link === "string") add(i.link);
          if (typeof i.body === "string") addMd(i.body);
        }
        break;
      }
      case "prose": {
        addMd((val as { text?: string }).text);
        break;
      }
      case "table": {
        const rows = (val as { rows?: unknown[][] }).rows;
        if (!Array.isArray(rows)) break;
        for (const row of rows) {
          if (!Array.isArray(row)) continue;
          for (const cell of row) {
            if (typeof cell === "string") addMd(cell);
          }
        }
        break;
      }
      case "info_box": {
        addMd((val as { content?: string }).content);
        break;
      }
      case "callout": {
        addMd((val as { body?: string }).body);
        break;
      }
      case "page_nav": {
        const items = (val as { items?: unknown[] }).items;
        if (!Array.isArray(items)) break;
        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const i = item as Record<string, unknown>;
          if (typeof i.link === "string") add(i.link);
        }
        break;
      }
    }
  }

  return [...links];
}

// ── Page tree ────────────────────────────────────────────────

export interface PageNode {
  hubKey?: string;
  hubSpec?: PageSpec;
  main: Array<{ key: string; spec: PageSpec }>;
  children: Map<string, PageNode>;
  reference?: PageNode;
}

export function buildPageTree(
  entries: ReadonlyArray<{ key: string; spec: PageSpec }>,
): PageNode {
  const pages = entries.filter((e) => !META_FILES.has(e.key));

  const byDir = new Map<string, Array<{ key: string; spec: PageSpec }>>();
  for (const e of pages) {
    const dir = parentDir(e.key);
    let group = byDir.get(dir);
    if (!group) {
      group = [];
      byDir.set(dir, group);
    }
    group.push(e);
  }

  const nodes = new Map<string, PageNode>();

  const dirs = [...byDir.keys()].sort(
    (a, b) => b.split("/").length - a.split("/").length,
  );

  for (const dir of dirs) {
    const group = byDir.get(dir)!;
    const hub = group.find((e) => isIndex(e.key));
    const main = group.filter(
      (e) => !isIndex(e.key) && inferRole(e.key) === "main",
    );

    const node: PageNode = {
      hubKey: hub?.key,
      hubSpec: hub?.spec,
      main,
      children: new Map(),
    };

    const prefix = dir ? `${dir}/` : "";
    for (const [childDir, childNode] of nodes) {
      if (!childDir.startsWith(prefix)) continue;
      const rest = childDir.substring(prefix.length);
      if (!rest.includes("/")) {
        if (rest === "reference") {
          node.reference = childNode;
        } else {
          node.children.set(rest, childNode);
        }
      }
    }

    nodes.set(dir, node);
  }

  return nodes.get("") ?? { main: [], children: new Map() };
}

// ── Derived navigation ───────────────────────────────────────

export interface DerivedCard {
  title: string;
  subtitle: string;
  body: string;
  link: string;
  targetKey: string;
}

function truncate(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  const cut = words.slice(0, maxWords).join(" ");
  const sentenceEnd = cut.lastIndexOf(".");
  if (sentenceEnd > cut.length * 0.5) return cut.substring(0, sentenceEnd + 1);
  return cut + "…";
}

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function cardForPage(
  targetKey: string,
  targetSpec: PageSpec,
  role: PageRole,
): DerivedCard {
  const hero = targetSpec.hero ?? targetSpec.superhero;
  const slug = targetKey.split("/").pop()?.replace(/\.yaml$/, "") ?? targetKey;

  const name = isIndex(targetKey)
    ? targetKey.split("/").slice(-2, -1)[0] ?? slug
    : slug;

  const title = hero?.title ?? titleCase(name);
  const body = hero?.body
    ? truncate(hero.body, 25)
    : `${titleCase(name)}.`;
  const subtitle =
    role === "reference"
      ? "Technical reference"
      : role === "hub"
        ? "Section overview"
        : "";

  return {
    title,
    subtitle,
    body,
    link: norm(specKeyToUrlPath(targetKey)),
    targetKey,
  };
}

export function deriveNavCards(
  hubKey: string,
  hubSpec: PageSpec,
  entries: ReadonlyArray<{ key: string; spec: PageSpec }>,
): DerivedCard[] {
  const pages = entries.filter((e) => !META_FILES.has(e.key));
  const allKeys = new Set(pages.map((e) => e.key));
  const specByKey = new Map(pages.map((e) => [e.key, e.spec]));

  const dir = parentDir(hubKey);
  const prefix = dir ? `${dir}/` : "";

  const siblings = pages
    .filter((e) => parentDir(e.key) === dir && !isIndex(e.key))
    .map((e) => e.key);

  const childHubs: string[] = [];
  for (const key of allKeys) {
    if (!isIndex(key) || key === hubKey) continue;
    if (!key.startsWith(prefix)) continue;
    const rest = key.substring(prefix.length);
    const segs = rest.split("/");
    if (segs.length === 2 && segs[1] === "_index.yaml") {
      childHubs.push(key);
    }
  }

  let ordered: string[];
  if (Array.isArray(hubSpec.nav) && hubSpec.nav.length > 0) {
    ordered = [];
    for (const name of hubSpec.nav) {
      if (typeof name !== "string") continue;
      const siblingKey = `${prefix}${name}.yaml`;
      if (allKeys.has(siblingKey)) {
        ordered.push(siblingKey);
        continue;
      }
      const childKey = `${prefix}${name}/_index.yaml`;
      if (allKeys.has(childKey)) {
        ordered.push(childKey);
      }
    }
    const navSet = new Set(ordered);
    for (const key of [...siblings, ...childHubs]) {
      if (!navSet.has(key)) ordered.push(key);
    }
  } else {
    ordered = [...siblings.sort(), ...childHubs.sort()];
  }

  return ordered
    .filter((key) => specByKey.has(key))
    .map((key) => cardForPage(key, specByKey.get(key)!, inferRole(key)));
}

export interface NavNode {
  title: string;
  link: string;
  key: string;
  children: NavNode[];
}

export function deriveSidebarNav(
  entries: ReadonlyArray<{ key: string; spec: PageSpec }>,
): NavNode[] {
  const tree = buildPageTree(entries);

  function walk(node: PageNode, pathPrefix: string): NavNode[] {
    const cards = node.hubKey && node.hubSpec
      ? deriveNavCards(node.hubKey, node.hubSpec, entries)
      : [];

    return cards.map((card) => {
      const targetKey = card.targetKey;
      const childName = targetKey.split("/").slice(-2, -1)[0];
      const childNode = childName
        ? node.children.get(childName) ?? (childName === "reference" ? node.reference : undefined)
        : undefined;

      return {
        title: card.title,
        link: card.link,
        key: targetKey,
        children: childNode ? walk(childNode, card.link) : [],
      };
    });
  }

  return walk(tree, "/");
}

// ── Convention validation ────────────────────────────────────

export interface ConventionIssue {
  severity: ConventionSeverity;
  check: ConventionCheck;
  message: string;
  file?: string;
}

export type ConventionOverrides = Partial<Record<ConventionCheck, ConventionSeverity | "off">>;

const META_FILES = new Set(["_project.yaml", "_site.yaml"]);

function parentDir(key: string): string {
  const i = key.lastIndexOf("/");
  return i === -1 ? "" : key.substring(0, i);
}

function norm(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export function validateConvention(
  entries: ReadonlyArray<{ key: string; spec: PageSpec }>,
  overrides?: ConventionOverrides,
): ConventionIssue[] {
  const issues: ConventionIssue[] = [];

  function emit(
    check: ConventionCheck,
    defaultSeverity: ConventionSeverity,
    message: string,
    file?: string,
  ): void {
    const override = overrides?.[check];
    if (override === "off") return;
    const severity = override ?? defaultSeverity;
    issues.push({ severity, check, message, file });
  }

  const pages = entries.filter((e) => !META_FILES.has(e.key));

  const urlToKey = new Map<string, string>();
  for (const e of pages) {
    urlToKey.set(norm(specKeyToUrlPath(e.key)), e.key);
  }

  // ── C2: Orphaned reference pages ──────────────────────
  const nonRefLinks = new Set<string>();
  for (const e of pages) {
    if (inferRole(e.key) === "reference") continue;
    for (const link of extractLinks(e.spec)) {
      nonRefLinks.add(link);
    }
  }

  for (const e of entries) {
    if (inferRole(e.key) !== "reference") continue;
    if (isIndex(e.key)) continue;
    const url = norm(specKeyToUrlPath(e.key));
    if (!nonRefLinks.has(url)) {
      emit("C2-orphaned-reference", "warning", `not linked from any non-reference page`, e.key);
    }
  }

  // ── C3: Reference backlinks ───────────────────────────
  for (const e of pages) {
    if (inferRole(e.key) !== "reference") continue;
    if (isIndex(e.key)) continue;

    for (const link of extractLinks(e.spec)) {
      const targetKey = urlToKey.get(link);
      if (targetKey && inferRole(targetKey) === "main") {
        emit("C3-reference-backlink", "info", `links to main page ${targetKey}`, e.key);
      }
    }
  }

  // ── C4: Hubless section ───────────────────────────────
  {
    const byDir = new Map<string, Array<{ key: string; spec: PageSpec }>>();
    for (const e of pages) {
      const dir = parentDir(e.key);
      let group = byDir.get(dir);
      if (!group) {
        group = [];
        byDir.set(dir, group);
      }
      group.push(e);
    }

    for (const [dir, group] of byDir) {
      if (dir === "") continue;
      if (group.every((e) => /(?:^|\/)reference(?:\/|$)/.test(e.key))) continue;

      const hasHub = group.some((e) => isIndex(e.key));
      if (!hasHub && group.length >= 2) {
        emit(
          "C4-hubless-section",
          "warning",
          `${dir}/ has ${group.length} pages but no _index.yaml — invisible to navigation`,
          group[0].key,
        );
      }
    }
  }

  // ── C5: Nav ordering ──────────────────────────────────
  {
    const allKeys = new Set(pages.map((e) => e.key));

    for (const e of pages) {
      if (!isIndex(e.key)) continue;

      const dir = parentDir(e.key);
      const prefix = dir ? `${dir}/` : "";

      const siblings = pages.filter(
        (p) => parentDir(p.key) === dir && !isIndex(p.key),
      );

      const childHubs: string[] = [];
      for (const key of allKeys) {
        if (!isIndex(key) || key === e.key) continue;
        if (!key.startsWith(prefix)) continue;
        const rest = key.substring(prefix.length);
        const segs = rest.split("/");
        if (segs.length === 2 && segs[1] === "_index.yaml") {
          childHubs.push(key);
        }
      }

      const childCount = siblings.length + childHubs.length;
      const hasNav = Array.isArray(e.spec.nav) && e.spec.nav.length > 0;

      if (childCount >= 3 && !hasNav) {
        emit(
          "C5-nav-ordering",
          "info",
          `hub has ${childCount} children but no nav field — ordering falls back to filesystem sort`,
          e.key,
        );
      }
    }
  }

  return issues;
}
