/**
 * Site-spec linter — validates SiteSpec for quality beyond parsing.
 *
 * Checks:
 *   S1   missing-project       project field missing or empty
 *   S2   unknown-target         target not in closed set
 *   S5   nav-unknown-slug      nav references slug not found in allKeys
 *   S6   nav-duplicate         same slug appears twice in nav
 *   S7   graph-orphan-node     graph node not referenced by any edge
 *   S8   graph-broken-edge     edge references nonexistent node
 *   S9   empty-nav             nav declared but empty
 *   S10  convention-unknown    conventions references unknown check ID
 */

import type { SiteSpec, NavItem } from "./types.js";

// ── Lint types ───────────────────────────────────────────────

export interface LintIssue {
  check: string;
  severity: "error" | "warning" | "info";
  message: string;
  path?: string;
}

const VALID_TARGETS = new Set(["cloudflare-pages", "wrangler"]);
const VALID_CHECKS = new Set([
  "C2-orphaned-reference", "C3-reference-backlink",
  "C4-hubless-section", "C5-nav-ordering",
]);

// ── Linter ───────────────────────────────────────────────────

/**
 * Lint a SiteSpec. Optionally pass allKeys (set of spec keys in the
 * project) to enable nav slug validation (S5).
 */
export function lint(spec: SiteSpec, allKeys?: ReadonlySet<string>): LintIssue[] {
  const issues: LintIssue[] = [];

  // S1: project required
  if (!spec.project || spec.project.trim().length === 0) {
    issues.push({
      check: "S1",
      severity: "error",
      message: "project field is missing or empty",
      path: "project",
    });
  }

  // S2: targets in closed set
  if (spec.targets) {
    for (const t of spec.targets) {
      if (!VALID_TARGETS.has(t)) {
        issues.push({
          check: "S2",
          severity: "error",
          message: `unknown target "${t}"`,
          path: "targets",
        });
      }
    }
  }

  // S9: empty nav
  if (spec.nav && spec.nav.length === 0) {
    issues.push({
      check: "S9",
      severity: "warning",
      message: "nav is declared but empty",
      path: "nav",
    });
  }

  // S5 + S6: nav slug validation
  if (spec.nav && spec.nav.length > 0) {
    const seen = new Set<string>();
    walkNav(spec.nav, (slug, navPath) => {
      // S6: duplicate slug
      if (seen.has(slug)) {
        issues.push({
          check: "S6",
          severity: "warning",
          message: `duplicate nav slug "${slug}"`,
          path: navPath,
        });
      }
      seen.add(slug);

      // S5: slug not in project keys
      if (allKeys && !allKeys.has(`${slug}.yaml`) && !allKeys.has(`${slug}/_index.yaml`)) {
        issues.push({
          check: "S5",
          severity: "warning",
          message: `nav slug "${slug}" not found in project spec keys`,
          path: navPath,
        });
      }
    });
  }

  // S10: convention check IDs valid
  if (spec.conventions) {
    for (const key of Object.keys(spec.conventions)) {
      if (!VALID_CHECKS.has(key)) {
        issues.push({
          check: "S10",
          severity: "error",
          message: `unknown convention check "${key}"`,
          path: `conventions.${key}`,
        });
      }
    }
  }

  // S7 + S8: graph validation
  if (spec.graph) {
    const nodeKeys = new Set(Object.keys(spec.graph.nodes ?? {}));
    const referencedNodes = new Set<string>();

    if (spec.graph.edges) {
      for (const [relName, edgeMap] of Object.entries(spec.graph.edges)) {
        for (const [src, tgt] of Object.entries(edgeMap)) {
          referencedNodes.add(src);
          const targets = Array.isArray(tgt) ? tgt : [tgt];
          for (const target of targets) {
            referencedNodes.add(target);

            if (nodeKeys.size > 0 && !nodeKeys.has(target)) {
              issues.push({
                check: "S8",
                severity: "error",
                message: `graph edge "${relName}" references unknown node "${target}"`,
                path: `graph.edges.${relName}.${src}`,
              });
            }
          }

          if (nodeKeys.size > 0 && !nodeKeys.has(src)) {
            issues.push({
              check: "S8",
              severity: "error",
              message: `graph edge "${relName}" references unknown source node "${src}"`,
              path: `graph.edges.${relName}.${src}`,
            });
          }
        }
      }
    }

    if (spec.graph.nodes) {
      for (const slug of nodeKeys) {
        if (!referencedNodes.has(slug)) {
          issues.push({
            check: "S7",
            severity: "info",
            message: `graph node "${slug}" is not referenced by any edge`,
            path: `graph.nodes.${slug}`,
          });
        }
      }
    }
  }

  return issues;
}

// ── Nav walker ───────────────────────────────────────────────

function walkNav(
  items: NavItem[],
  cb: (slug: string, path: string) => void,
  prefix = "nav",
): void {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const path = `${prefix}[${i}]`;

    if (typeof item === "string") {
      if (item !== "---") cb(item, path);
      continue;
    }

    if ("group" in item) continue;
    if ("url" in item) continue;

    // Branch
    const entries = Object.entries(item);
    if (entries.length === 1) {
      const [slug, children] = entries[0] as [string, NavItem[]];
      cb(slug, path);
      walkNav(children, cb, `${path}.${slug}`);
    }
  }
}
