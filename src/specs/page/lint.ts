/**
 * Unified page-spec linter — combines visual lint, convention checks,
 * and sanitize lint into a single entry point.
 *
 * Visual checks (V1–V27): rhythm, color, content, structure, repetition, density
 * Convention checks (C2–C5): cross-file conventions
 * Sanitize checks (S11–S12): encoding hygiene
 * Schema checks (B*): block/frame field validation
 */

import type { PageSpec } from "./types.js";
import { visualLint } from "./visual-lint.js";
import type { VisualLintIssue } from "./visual-lint.js";
import { lintSpec as lintSanitize } from "./sanitize.js";
import { validateSpec } from "./yaml.js";
import { validateConvention } from "./convention.js";
import type { ConventionOverrides } from "./convention.js";

// ── Lint types ───────────────────────────────────────────────

export interface LintIssue {
  check: string;
  severity: "error" | "warning" | "info";
  message: string;
  path?: string;
}

export interface LintOptions {
  /** Limit to specific check IDs (e.g. ["V1", "V5", "S11"]). */
  checks?: Set<string>;
  /** Skip visual lint. */
  skipVisual?: boolean;
  /** Skip sanitize lint. */
  skipSanitize?: boolean;
  /** Skip schema validation. */
  skipSchema?: boolean;
}

export interface ProjectLintOptions extends LintOptions {
  /** Convention severity overrides from SiteSpec. */
  conventions?: ConventionOverrides;
}

// ── Single-page linter ───────────────────────────────────────

export function lint(spec: PageSpec, options?: LintOptions): LintIssue[] {
  const issues: LintIssue[] = [];

  // Schema validation
  if (!options?.skipSchema) {
    for (const si of validateSpec(spec)) {
      issues.push({
        check: `B-${si.path}`,
        severity: si.severity,
        message: si.message,
        path: si.path,
      });
    }
  }

  // Visual lint (V1–V27)
  if (!options?.skipVisual) {
    for (const vi of visualLint(spec, options?.checks)) {
      issues.push({
        check: vi.check,
        severity: vi.severity,
        message: vi.message,
        path: vi.block !== undefined ? `blocks[${vi.block}]` : undefined,
      });
    }
  }

  // Sanitize lint (S11–S12)
  if (!options?.skipSanitize) {
    for (const si of lintSanitize(spec)) {
      issues.push({
        check: si.check,
        severity: si.severity,
        message: si.message,
        path: si.blockIndex !== undefined
          ? `blocks[${si.blockIndex}].${si.field ?? ""}`
          : si.field,
      });
    }
  }

  return issues;
}

// ── Cross-file linter ────────────────────────────────────────

export function lintProject(
  entries: ReadonlyArray<{ key: string; spec: PageSpec }>,
  options?: ProjectLintOptions,
): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const entry of entries) {
    for (const issue of lint(entry.spec, options)) {
      issues.push({ ...issue, path: `${entry.key}:${issue.path ?? ""}` });
    }
  }

  for (const ci of validateConvention(entries, options?.conventions)) {
    issues.push({
      check: ci.check,
      severity: ci.severity,
      message: ci.message,
      path: ci.file,
    });
  }

  return issues;
}
