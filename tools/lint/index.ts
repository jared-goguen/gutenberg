/**
 * MCP tool: unified page spec linter.
 *
 * Runs structural validation (schema + sanitize) then visual rhythm checks (V1–V27)
 * on PageSpec YAML. Single file, inline YAML, or batch directory mode.
 *
 * Structural: parse errors, required fields, type issues
 * Rhythm: V1 prose density, V2 section variety, V3 block variety
 * Color:  V4 color intent
 * Content: V5 thin cards, V6 stubby flow chain, V26 card density, V27 card block density
 * Structure: V7 missing opening, V8 frame gaps, V9 anemic section, V10 section balance
 * Repetition: V11 layout monotony
 * Density: V15 caption stacking, V16 section density, V17 scheme fragmentation, V18 identical consecutive
 * Hygiene: V20 no title field in specs
 * Markup: V23 presentational markup
 * Escape: V24 escape artifacts
 */

import { readFileSync, statSync, readdirSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { parse as parseYaml } from "yaml";
import { fromYaml, validateSpec } from "../../src/specs/page/yaml.js";
import { lintSpec } from "../../src/specs/page/sanitize.js";
import { visualLint } from "../../src/specs/page/visual-lint.js";
import { validateConvention } from "../../src/specs/page/convention.js";
import type { PageSpec } from "../../src/specs/page/types.js";

interface LintIssue {
  severity: string;
  check: string;
  message: string;
  block?: number;
}

/** Run both structural and visual lint on a parsed spec. */
function lintAll(
  source: string,
  enabled?: Set<string>,
): { issues: LintIssue[]; blocks: number; scheme: string } {
  // Check for deprecated field names in raw YAML before parsing
  const deprecations: LintIssue[] = [];
  try {
    const raw = parseYaml(source) as Record<string, unknown>;
    if (raw && typeof raw === "object") {
      if (raw.scheme !== undefined) {
        deprecations.push({
          severity: "warning",
          check: "deprecated-field",
          message: `"scheme" is deprecated — use "theme" instead. Pages inherit the project theme from _project.yaml; per-page overrides are rarely needed.`,
        });
      }
      if (raw.style !== undefined) {
        deprecations.push({
          severity: "warning",
          check: "deprecated-field",
          message: `"style" is deprecated — use "theme" instead (in _project.yaml for project-level, or per-page for overrides).`,
        });
      }
      if (raw.theme !== undefined) {
        deprecations.push({
          severity: "warning",
          check: "per-page-theme",
          message: `Per-page "theme" overrides the project default from _site.yaml/_project.yaml. Remove it — pages should inherit the project theme. If you genuinely need a per-page override, suppress this warning.`,
        });
      }
    }
  } catch { /* fromYaml below will report parse errors */ }

  const spec = fromYaml(source);

  // Schema validation — field names, required fields, enum values
  const schema: LintIssue[] = validateSpec(spec).map((i) => ({
    severity: i.severity,
    check: `schema:${i.path}`,
    message: i.message,
  }));

  // Structural validation — encoding, entities
  const structural = lintSpec(spec).map((i) => ({
    severity: i.severity,
    check: "structural",
    message: i.message,
  }));

  // Visual rhythm checks
  const visual: LintIssue[] = visualLint(spec, enabled).map((i) => ({
    severity: i.severity,
    check: i.check,
    message: i.message,
    block: i.block,
  }));

  return {
    issues: [...deprecations, ...schema, ...structural, ...visual],
    blocks: spec.blocks.length,
    scheme: spec.theme ?? "cloudflare",
  };
}

function formatIssues(issues: LintIssue[]): string {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const infos = issues.filter((i) => i.severity === "info").length;

  const parts: string[] = [];
  if (errors) parts.push(`${errors} error${errors !== 1 ? "s" : ""}`);
  if (warnings) parts.push(`${warnings} warning${warnings !== 1 ? "s" : ""}`);
  if (infos) parts.push(`${infos} info`);

  const header = `${issues.length} issue${issues.length !== 1 ? "s" : ""}${parts.length ? `: ${parts.join(", ")}` : ""}`;

  const body = issues
    .map(
      (i) =>
        `[${i.severity.toUpperCase().padEnd(7)}] ${i.check}${i.block !== undefined ? ` (block ${i.block})` : ""}: ${i.message}`,
    )
    .join("\n");

  return body ? `${header}\n${body}` : header;
}

/** Walk up from dir looking for _site.yaml or _project.yaml to find the project root. */
function findProjectRoot(dir: string): string | undefined {
  let current = dir;
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(current, "_site.yaml")) || existsSync(join(current, "_project.yaml"))) return current;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
  return undefined;
}

/** Recursively find all .yaml files in a directory. */
function findYamlFiles(dir: string): string[] {
  const results: string[] = [];

  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".yaml")) {
        results.push(full);
      }
    }
  };

  walk(dir);
  return results.sort();
}

export async function handler(input: Record<string, unknown>) {
  const yaml = input.yaml as string | undefined;
  const filePath = input.filePath as string | undefined;
  const directory = input.directory as string | undefined;
  const checks = input.checks as string | undefined;

  const enabled = checks
    ? new Set(checks.split(",").map((c) => c.trim()))
    : undefined;

  // ── Batch mode: directory ──────────────────────────────
  if (directory) {
    try {
      const stat = statSync(directory);
      if (!stat.isDirectory()) {
        return {
          content: [
            { type: "text" as const, text: `Error: not a directory: ${directory}` },
          ],
          isError: true,
        };
      }
    } catch (e: unknown) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${e instanceof Error ? e.message : e}`,
          },
        ],
        isError: true,
      };
    }

    const files = findYamlFiles(directory);
    if (files.length === 0) {
      return {
        content: [
          { type: "text" as const, text: `No .yaml files found in ${directory}` },
        ],
      };
    }

    const results: { file: string; issues: LintIssue[]; error?: string }[] = [];
    const parsedSpecs: Array<{ key: string; spec: PageSpec }> = [];

    // Convention needs keys relative to project root so URL paths match links.
    const projectRoot = findProjectRoot(directory) ?? directory;

    for (const f of files) {
      const rel = relative(directory, f);
      const projectRel = relative(projectRoot, f);
      try {
        const source = readFileSync(f, "utf-8");
        const { issues } = lintAll(source, enabled);
        results.push({ file: rel, issues });

        // Collect parsed specs for convention checks
        try {
          const spec = fromYaml(source);
          parsedSpecs.push({ key: projectRel, spec });
        } catch {
          // Parse failed — skip convention for this file
        }
      } catch (e: unknown) {
        results.push({
          file: rel,
          issues: [],
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // ── Convention checks (cross-file) ─────────────────
    const conventionIssues = validateConvention(parsedSpecs);
    const conventionByFile = new Map<string, LintIssue[]>();

    // Map project-relative convention keys to directory-relative keys for output.
    const dirPrefix = relative(projectRoot, directory);

    for (const ci of conventionIssues) {
      const issue: LintIssue = {
        severity: ci.severity,
        check: ci.check,
        message: ci.message,
      };
      if (ci.file) {
        // Convert project-relative key to directory-relative
        const dirRel = dirPrefix && ci.file.startsWith(dirPrefix + "/")
          ? ci.file.substring(dirPrefix.length + 1)
          : ci.file.startsWith(dirPrefix) && ci.file.length === dirPrefix.length
            ? ci.file
            : ci.file;
        let arr = conventionByFile.get(dirRel);
        if (!arr) {
          arr = [];
          conventionByFile.set(dirRel, arr);
        }
        arr.push(issue);
      }
    }

    // Merge convention issues into per-file results
    for (const r of results) {
      const extra = conventionByFile.get(r.file);
      if (extra) r.issues.push(...extra);
    }

    // Sort: most issues first, then alphabetical
    results.sort((a, b) => {
      const diff = b.issues.length - a.issues.length;
      return diff !== 0 ? diff : a.file.localeCompare(b.file);
    });

    const totalConvention = conventionIssues.length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const totalWarnings = results.reduce(
      (sum, r) =>
        sum + r.issues.filter((i) => i.severity === "warning").length,
      0,
    );
    const cleanFiles = results.filter(
      (r) => r.issues.length === 0 && !r.error,
    ).length;
    const errorFiles = results.filter((r) => r.error).length;

    const conventionTag = totalConvention > 0
      ? ` · ${totalConvention} convention`
      : "";

    const lines: string[] = [
      `${files.length} specs · ${totalIssues} issues (${totalWarnings} warnings) · ${cleanFiles} clean${errorFiles ? ` · ${errorFiles} errors` : ""}${conventionTag}`,
      "",
    ];

    for (const r of results) {
      if (r.error) {
        lines.push(`── ${r.file} ── ERROR: ${r.error}`);
      } else if (r.issues.length === 0) {
        lines.push(`── ${r.file} ── clean`);
      } else {
        lines.push(`── ${r.file} ──`);
        lines.push(formatIssues(r.issues));
      }
      lines.push("");
    }

    return {
      content: [{ type: "text" as const, text: lines.join("\n").trim() }],
    };
  }

  // ── Single file mode ───────────────────────────────────
  let source: string;
  if (filePath) {
    try {
      const stat = statSync(filePath);
      if (!stat.isFile()) {
        return {
          content: [
            { type: "text" as const, text: `Error: not a file: ${filePath}` },
          ],
          isError: true,
        };
      }
      source = readFileSync(filePath, "utf-8");
    } catch (e: unknown) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error reading file: ${e instanceof Error ? e.message : e}`,
          },
        ],
        isError: true,
      };
    }
  } else if (yaml) {
    source = yaml;
  } else {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: provide yaml, filePath, or directory",
        },
      ],
      isError: true,
    };
  }

  try {
    const { issues, blocks, scheme } = lintAll(source, enabled);
    const errors = issues.filter((i) => i.severity === "error").length;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              valid: errors === 0,
              blocks,
              scheme,
              ...(issues.length > 0
                ? { issues: formatIssues(issues) }
                : {}),
            },
            null,
            2,
          ),
        },
      ],
    };
  } catch (e: unknown) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${e instanceof Error ? e.message : e}`,
        },
      ],
      isError: true,
    };
  }
}
