/**
 * Project build — walk a project directory, compile specs, write .site/.
 *
 * Pipeline: plan() → render() per target.
 *
 * plan() is target-agnostic: discovers specs, reads YAML, builds nav tree.
 * render() is target-specific: compiles specs to .site/<target>/, reconciles stale output.
 *
 * Incremental: content hashes are tracked in .site/<target>/_manifest.json.
 * Only specs whose YAML has changed since last build get recompiled.
 *
 * Output layout (directory-per-page, clean URLs):
 *   _index.yaml              → .site/<target>/index.html
 *   mcp-ecosystem.yaml       → .site/<target>/mcp-ecosystem/index.html
 *   billing/_index.yaml      → .site/<target>/billing/index.html
 *   billing/dunning.yaml     → .site/<target>/billing/dunning/index.html
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import {
  specKeyToUrlPath,
  contentHash,
  toSpecEntry,
  isIndex,
  resolveLink,
  slugOf,
  type SpecEntry,
} from "./specs/site/index.js";
import { compile, plan as planSpec } from "./compile.js";
import type { LinkResolver, RecentResolver, ResolvedRecentEntry } from "./blocks/types.js";
import type { TargetName, SiteSpec } from "./project-config.js";
import { readProjectConfig } from "./project-config.js";
import { resolveSiteNav, resolveGraph } from "./specs/site/index.js";
import type { ResolvedGraph } from "./specs/site/index.js";
import { blockType, blockValue } from "./specs/page/index.js";
import type { PageSpec, SpecBlock } from "./specs/page/index.js";
import { fromYaml, validateSpec } from "./specs/page/yaml.js";
import { parse as parseYaml } from "yaml";
import { sanitizeSpec } from "./specs/page/sanitize.js";
import {
  buildNavTree,
  humanize,
  flattenNav,
  resolveBreadcrumbs,
  type SiteNav,
  type NavOrder,
  type NavConfig,
} from "./site-nav.js";
import { enrichSite, type SiteChrome } from "./site-enrich.js";
import { unlinkSync } from "node:fs";

// ── Types ────────────────────────────────────────────────────

export interface BuildResult {
  total: number;
  compiled: number;
  skipped: number;
  reconciled: number;
  errors: { key: string; error: string }[];
  siteDir: string;
}

interface BuildManifest {
  [key: string]: { hash: string; builtAt: string };
}

// ── Build plan (target-agnostic) ─────────────────────────────

export interface BuildPlan {
  projectDir: string;
  specs: SpecEntry[];
  yamlCache: Map<string, string>;
  titleMap: Map<string, string>;
  navTree: SiteNav;
  navOrders: Map<string, NavOrder>;
  navConfig: NavConfig | undefined;
  navHash: string;
  allKeys: Set<string>;
  siteSpec: SiteSpec | null;
  /** Resolved semantic graph — bidirectional relationship indexes. */
  graph: ResolvedGraph;
  /** Custom theme CSS loaded from <project>-theme.css or theme_css field. */
  themeCSS?: string;
}

// ── Render options (target-specific) ─────────────────────────

export interface RenderOptions {
  /** Output directory. Defaults to plan.projectDir/.site/<target>/ */
  siteDir?: string;
  /** Deploy target — selects render engine. */
  target?: TargetName;
  /** Force rebuild regardless of hash. */
  force?: boolean;
  /** Only render specs in this section. */
  section?: string;
  /** Render a single spec by key. */
  specKey?: string;
}

// ── Spec discovery ───────────────────────────────────────────

/** Walk a project directory and discover all YAML specs. */
export function discoverSpecs(projectDir: string): SpecEntry[] {
  const specs: SpecEntry[] = [];
  walkDir(projectDir, projectDir, specs);
  specs.sort((a, b) => a.key.localeCompare(b.key));
  return specs;
}

function walkDir(root: string, dir: string, results: SpecEntry[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // Skip dotfiles, node_modules, and site config files
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules") continue;
    if (entry.name === "_project.yaml" || entry.name === "_site.yaml") continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(root, fullPath, results);
    } else if (entry.name.endsWith(".yaml")) {
      const key = relative(root, fullPath);
      const se = toSpecEntry(key, fullPath);
      se.mtime = statSync(fullPath).mtime;
      results.push(se);
    }
  }
}

// ── Output path mapping ──────────────────────────────────────

/**
 * Map a spec key to its output path within .site/.
 *
 *   _index.yaml           → index.html
 *   mcp-ecosystem.yaml    → mcp-ecosystem/index.html
 *   billing/_index.yaml   → billing/index.html
 *   billing/dunning.yaml  → billing/dunning/index.html
 */
export function specKeyToOutputPath(key: string): string {
  if (key === "_index.yaml") return "index.html";

  const stem = key.replace(/\.yaml$/, "");

  if (isIndex(key)) {
    // billing/_index.yaml → billing/index.html
    const dir = stem.slice(0, -"/_index".length);
    return `${dir}/index.html`;
  }

  // billing/dunning.yaml → billing/dunning/index.html
  return `${stem}/index.html`;
}

// ── Manifest ─────────────────────────────────────────────────

const MANIFEST_FILE = "_manifest.json";

async function readManifest(siteDir: string): Promise<BuildManifest> {
  const path = join(siteDir, MANIFEST_FILE);
  try {
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as BuildManifest;
  } catch {
    return {};
  }
}

async function writeManifest(siteDir: string, manifest: BuildManifest): Promise<void> {
  const path = join(siteDir, MANIFEST_FILE);
  await writeFile(path, JSON.stringify(manifest, null, 2), "utf-8");
}

// ── Reconciliation ───────────────────────────────────────────

/**
 * Walk a directory and find all .html files, returning paths relative to root.
 */
function walkHtmlFiles(root: string, dir: string, results: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(root, fullPath, results);
    } else if (entry.name.endsWith(".html")) {
      results.push(relative(root, fullPath));
    }
  }
}

/**
 * Delete HTML files in siteDir that are not in the manifest.
 * Returns the number of files deleted.
 */
function reconcile(siteDir: string, manifest: BuildManifest): number {
  const expectedOutputs = new Set(
    Object.keys(manifest)
      .filter((k) => !k.startsWith("__")) // skip __nav and other meta entries
      .map((k) => specKeyToOutputPath(k)),
  );

  const htmlFiles: string[] = [];
  try {
    walkHtmlFiles(siteDir, siteDir, htmlFiles);
  } catch {
    // siteDir may not exist yet on first build
    return 0;
  }

  let deleted = 0;
  for (const relPath of htmlFiles) {
    if (!expectedOutputs.has(relPath)) {
      try {
        unlinkSync(join(siteDir, relPath));
        deleted++;
      } catch {
        // File may have been removed concurrently — ignore
      }
    }
  }
  return deleted;
}

// ── Plan (target-agnostic) ───────────────────────────────────

/**
 * Plan a build: discover specs, read YAML, build nav tree, resolve links.
 * Target-agnostic — run once, then render() per target.
 */
export async function plan(projectDir: string): Promise<BuildPlan> {
  // 1. Discover all specs
  const allSpecs = discoverSpecs(projectDir);

  // 1b. Synthesize _index.yaml for sections that don't have one.
  const sectionsWithIndex = new Set<string>();
  const sectionsWithPages = new Set<string>();
  for (const spec of allSpecs) {
    if (!spec.section) continue;
    const topSection = spec.section;
    if (spec.isIndex && spec.key === `${topSection}/_index.yaml`) {
      sectionsWithIndex.add(topSection);
    } else {
      sectionsWithPages.add(topSection);
    }
  }
  for (const section of sectionsWithPages) {
    if (sectionsWithIndex.has(section)) continue;
    // Synthesize a minimal _index.yaml for this section
    const key = `${section}/_index.yaml`;
    const title = humanize(section);
    const virtualYaml = `theme: cloudflare\n\nhero:\n  title: ${title}\n`;
    const se = toSpecEntry(key, join(projectDir, key));
    se.mtime = new Date();
    allSpecs.push(se);
    (se as any).__virtual = virtualYaml;
  }

  // 2. Pre-pass: read YAML + extract titles + section labels for nav tree
  const yamlCache = new Map<string, string>();
  const titleMap = new Map<string, string>();
  const navOrderMap = new Map<string, NavOrder>();
  for (const spec of allSpecs) {
    try {
      const yaml = (spec as any).__virtual ?? readFileSync(spec.path, "utf-8");
      yamlCache.set(spec.key, yaml);
      const parsed = fromYaml(yaml);
      titleMap.set(
        spec.key,
        parsed.title ?? parsed.hero?.title ?? parsed.superhero?.title ?? humanize(slugOf(spec.key)),
      );
      // Extract nav ordering from _index.yaml card link fields + explicit nav: arrays
      if (spec.isIndex && spec.section) {
        const allSlugs: string[] = [];
        const categories: { label: string; slugs: string[] }[] = [];
        let currentCategory: string | null = null;
        let categorySlugs: string[] = [];

        for (const block of parsed.blocks) {
          const type = blockType(block);
          const val = blockValue(block) as Record<string, unknown>;

          if (type === "section_label") {
            if (currentCategory && categorySlugs.length > 0) {
              categories.push({ label: currentCategory, slugs: [...categorySlugs] });
            }
            const text = typeof val === "string" ? val : (val as { text: string }).text;
            currentCategory = text;
            categorySlugs = [];
          } else if (type === "cards" && val?.items) {
            for (const item of val.items as { link?: string }[]) {
              if (item.link) {
                const slug = item.link.replace(/^\/+|\/+$/g, "").split("/").pop() ?? "";
                if (slug) {
                  allSlugs.push(slug);
                  if (currentCategory) categorySlugs.push(slug);
                }
              }
            }
          }
        }

        // Close final category
        if (currentCategory && categorySlugs.length > 0) {
          categories.push({ label: currentCategory, slugs: [...categorySlugs] });
        }

        // Check for explicit nav: array — overrides block-derived ordering
        const rawParsed = parseYaml(yaml) as Record<string, unknown>;
        const rawNav = rawParsed?.nav;
        if (Array.isArray(rawNav) && rawNav.length > 0) {
          const navSlugs: string[] = [];
          const navCategories: { label: string; slugs: string[] }[] = [];
          let navGroup: string | null = null;
          let navGroupSlugs: string[] = [];

          for (const item of rawNav) {
            if (typeof item === "string") {
              navSlugs.push(item);
              if (navGroup) navGroupSlugs.push(item);
            } else if (
              typeof item === "object" &&
              item !== null &&
              "group" in item &&
              typeof (item as { group: unknown }).group === "string"
            ) {
              if (navGroup && navGroupSlugs.length > 0) {
                navCategories.push({ label: navGroup, slugs: [...navGroupSlugs] });
              }
              navGroup = (item as { group: string }).group;
              navGroupSlugs = [];
            }
          }
          if (navGroup && navGroupSlugs.length > 0) {
            navCategories.push({ label: navGroup, slugs: [...navGroupSlugs] });
          }

          if (navSlugs.length > 0) {
            const order: NavOrder = { slugs: navSlugs };
            if (navCategories.length > 1) {
              order.categories = navCategories;
            }
            const navKey = spec.key.replace(/\/_index\.yaml$/, "");
            navOrderMap.set(navKey, order);
          }
        } else if (allSlugs.length > 0) {
          const order: NavOrder = { slugs: allSlugs };
          if (categories.length > 1) {
            order.categories = categories;
          }
          const navKey = spec.key.replace(/\/_index\.yaml$/, "");
          navOrderMap.set(navKey, order);
        }
      }
    } catch {
      titleMap.set(spec.key, humanize(slugOf(spec.key)));
    }
  }

  // 2b. Warn about sections with child pages but no nav ordering
  {
    const sectionChildren = new Map<string, number>();
    for (const spec of allSpecs) {
      if (!spec.section || spec.isIndex) continue;
      sectionChildren.set(spec.section, (sectionChildren.get(spec.section) || 0) + 1);
    }
    for (const [section, childCount] of sectionChildren) {
      if (!navOrderMap.has(section)) {
        console.warn(
          `[build] ${section}/_index.yaml: section has ${childCount} child page(s) but no nav ordering — add a nav: field or card links to control sidebar order`,
        );
      }
    }
  }

  // 2c. Extract site-level nav config
  let navConfig: NavConfig | undefined;
  const siteSpec = await readProjectConfig(projectDir);

  if (siteSpec?.nav) {
    const resolved = resolveSiteNav(siteSpec);
    navConfig = {
      order: resolved.order,
      separators: resolved.separators,
      labels: resolved.labels,
      expanded: resolved.expanded,
      categories: resolved.categories.length > 0 ? resolved.categories : undefined,
      links: resolved.links.size > 0 ? resolved.links : undefined,
    };

    for (const [section, childSlugs] of resolved.sections) {
      if (!navOrderMap.has(section)) {
        navOrderMap.set(section, { slugs: childSlugs });
      }
    }
  } else {
    // Legacy fallback: parse nav from root _index.yaml
    const rootYaml = yamlCache.get("_index.yaml");
    if (rootYaml) {
      const rootRaw = parseYaml(rootYaml) as Record<string, unknown>;
      if (rootRaw?.nav && Array.isArray(rootRaw.nav)) {
        const order: string[] = [];
        const separators = new Set<string>();
        const labels = new Map<string, string>();
        const expanded = new Set<string>();
        let nextGetsSeparator = false;
        for (const item of rootRaw.nav as unknown[]) {
          if (item === "---") {
            nextGetsSeparator = true;
          } else if (typeof item === "string") {
            const isExpanded = item.startsWith("+");
            const slug = isExpanded ? item.slice(1) : item;
            order.push(slug);
            if (isExpanded) expanded.add(slug);
            if (nextGetsSeparator) {
              separators.add(slug);
              nextGetsSeparator = false;
            }
          } else if (typeof item === "object" && item !== null) {
            const entries = Object.entries(item as Record<string, unknown>);
            if (entries.length === 1 && typeof entries[0][1] === "string") {
              const [slug, label] = entries[0] as [string, string];
              order.push(slug);
              labels.set(slug, label);
              if (nextGetsSeparator) {
                separators.add(slug);
                nextGetsSeparator = false;
              }
            }
          }
        }
        navConfig = { order, separators, labels, expanded };
      }
    }
  }

  // 3. Build site navigation tree
  const navTree: SiteNav = buildNavTree(allSpecs, (key) => titleMap.get(key) ?? key, navOrderMap, navConfig);

  // 4. Compute nav hash for incremental build invalidation
  const navHash = contentHash(JSON.stringify(navTree));

  // 5. Build link resolver index
  const allKeys = new Set(allSpecs.map((s) => s.key));

  // 6. Resolve semantic graph
  const graph = siteSpec ? resolveGraph(siteSpec) : resolveGraph({ project: "" });

  // 7. Load theme CSS override (<project>-theme.css or explicit theme_css in _site.yaml)
  let themeCSS: string | undefined;
  const projectName = siteSpec?.project ?? "";
  const themeFileName = siteSpec?.theme_css ?? (projectName ? `${projectName}-theme.css` : "");
  if (themeFileName) {
    const themePath = join(projectDir, themeFileName);
    try {
      themeCSS = readFileSync(themePath, "utf-8");
    } catch {
      // No theme file — that's fine
    }
  }

  return {
    projectDir,
    specs: allSpecs,
    yamlCache,
    titleMap,
    navTree,
    navOrders: navOrderMap,
    navConfig,
    navHash,
    allKeys,
    siteSpec,
    graph,
    themeCSS,
  };
}

// ── Render (target-specific) ─────────────────────────────────

/**
 * Render a build plan to a target-scoped output directory.
 * Compiles specs, reconciles stale output.
 */
export async function render(buildPlan: BuildPlan, options: RenderOptions = {}): Promise<BuildResult> {
  const { projectDir, specs: allSpecs, yamlCache, titleMap, navTree, navHash, allKeys, siteSpec } = buildPlan;
  const { force, section, specKey, target } = options;

  // Target-scoped output directory
  const targetName = target ?? "cloudflare-pages";
  const siteDir = options.siteDir ?? join(projectDir, ".site", targetName);

  await mkdir(siteDir, { recursive: true });

  // Filter to what we're actually compiling
  let specs = allSpecs;
  if (specKey) {
    specs = specs.filter((s) => s.key === specKey);
  } else if (section) {
    specs = specs.filter((s) => s.section === section);
  }

  // Load manifest for incremental build
  const manifest = force ? {} : await readManifest(siteDir);

  // Detect nav changes — sidebar is baked into every page at build time.
  const navChanged = !force && manifest["__nav"]?.hash !== navHash;

  const newManifest: BuildManifest = { ...manifest };
  newManifest["__nav"] = { hash: navHash, builtAt: new Date().toISOString() };

  const result: BuildResult = {
    total: specs.length,
    compiled: 0,
    skipped: 0,
    reconciled: 0,
    errors: [],
    siteDir,
  };

  // Build link resolvers
  function makeResolver(fromKey: string): LinkResolver {
    return (ref: string) => {
      const resolved = resolveLink(fromKey, ref, allKeys);
      if (!resolved) return undefined;
      return specKeyToUrlPath(resolved);
    };
  }

  // Build recent-pages resolver (uses mtimes + titles from all specs)
  function makeRecentResolver(fromKey: string): RecentResolver {
    return (subtree?: string, count = 5): ResolvedRecentEntry[] => {
      const prefix = subtree ?? (fromKey.includes("/") ? fromKey.split("/")[0] + "/" : "");

      const candidates = allSpecs
        .filter((s) => s.key !== fromKey && (prefix === "" || s.key.startsWith(prefix)) && s.mtime != null)
        .sort((a, b) => b.mtime!.getTime() - a.mtime!.getTime())
        .slice(0, count);

      return candidates.map((s) => ({
        title: titleMap.get(s.key) ?? humanize(slugOf(s.key)),
        link: s.key.replace(/\.yaml$/, "").replace(/\/_index$/, ""),
        modified: s.mtime!.toISOString(),
        section: s.section,
      }));
    };
  }

  // Enrich site: resolve navigation chrome flags once per build
  const chrome = enrichSite(siteSpec, allSpecs.length, navTree, targetName);

  // Build flat page sequence for prev/next navigation
  const flatPages = chrome.pageFooter ? flattenNav(navTree) : [];
  const pageIndex = new Map(flatPages.map((p, i) => [p.urlPath, i]));

  // Compile each spec
  for (const spec of specs) {
    try {
      const yaml = yamlCache.get(spec.key) ?? readFileSync(spec.path, "utf-8");
      const hash = contentHash(yaml);

      // Skip if unchanged (nav change invalidates all pages — sidebar is baked in)
      if (!force && !navChanged && manifest[spec.key]?.hash === hash) {
        result.skipped++;
        newManifest[spec.key] = manifest[spec.key];
        continue;
      }

      // Parse, sanitize, validate, apply site defaults, compile
      const pageSpec = fromYaml(yaml);
      sanitizeSpec(pageSpec);

      // Pre-render validation
      const validationIssues = validateSpec(pageSpec);
      const validationErrors = validationIssues.filter((i) => i.severity === "error");
      if (validationErrors.length > 0) {
        const report = validationErrors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
        throw new Error(`${validationErrors.length} validation error(s):\n${report}`);
      }

      // Cascade presentation defaults from SiteSpec → PageSpec
      if (siteSpec) {
        if (pageSpec.theme && siteSpec.theme && pageSpec.theme === siteSpec.theme) {
          console.warn(
            `[build] ${spec.key}: page theme "${pageSpec.theme}" matches project default — remove the per-page override`,
          );
        }
        pageSpec.theme ??= siteSpec.theme ?? "cloudflare";
        if (!pageSpec.pace && siteSpec.pace) pageSpec.pace = siteSpec.pace;
        if (!pageSpec.weight && siteSpec.weight) pageSpec.weight = siteSpec.weight;
      }

      // Resolve prev/next pages from flat navigation sequence
      const currentIdx = pageIndex.get(spec.urlPath);
      const prevPage = currentIdx !== undefined && currentIdx > 0 ? flatPages[currentIdx - 1] : undefined;
      const nextPage =
        currentIdx !== undefined && currentIdx < flatPages.length - 1 ? flatPages[currentIdx + 1] : undefined;

      // Resolve breadcrumbs from site navigation tree (gated by chrome)
      const breadcrumbs = chrome.breadcrumbs ? resolveBreadcrumbs(navTree, spec.urlPath) : undefined;

      const compiled = compile(pageSpec, {
        resolveLink: makeResolver(spec.key),
        resolveRecent: makeRecentResolver(spec.key),
        siteNav: navTree,
        currentPath: spec.urlPath,
        prevPage,
        nextPage,
        breadcrumbs,
        chrome,
        themeCSS: buildPlan.themeCSS,
        resolveRoot: dirname(projectDir),
      });
      const { html } = compiled;

      // Write to output path
      const outputPath = join(siteDir, specKeyToOutputPath(spec.key));
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, html, "utf-8");

      // Update manifest
      newManifest[spec.key] = { hash, builtAt: new Date().toISOString() };
      result.compiled++;
    } catch (err) {
      result.errors.push({
        key: spec.key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Write updated manifest
  await writeManifest(siteDir, newManifest);

  // Reconcile: delete stale HTML files not in the manifest
  result.reconciled = reconcile(siteDir, newManifest);

  return result;
}

// ── Build (convenience wrapper) ──────────────────────────────

export interface BuildOptions {
  /** Project directory containing YAML specs. */
  projectDir: string;
  /** Output directory. Defaults to projectDir/.site/<target>/ */
  siteDir?: string;
  /** Force rebuild all specs regardless of hash. */
  force?: boolean;
  /** Only build specs in this section (e.g. "billing"). */
  section?: string;
  /** Only build a single spec by key (e.g. "billing/dunning.yaml"). */
  specKey?: string;
  /** Deploy target — selects render engine. Defaults to cloudflare-pages (HTML5). */
  target?: TargetName;
}

/**
 * Convenience wrapper: plan() + render() in one call.
 * Use plan() + render() directly when building for multiple targets.
 */
export async function build(options: BuildOptions): Promise<BuildResult> {
  const buildPlan = await plan(options.projectDir);
  return render(buildPlan, {
    siteDir: options.siteDir,
    target: options.target,
    force: options.force,
    section: options.section,
    specKey: options.specKey,
  });
}
