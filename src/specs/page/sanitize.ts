/**
 * Spec-level encoding sanitizer.
 *
 * Scans text fields in a PageSpec for content that will double-encode
 * when passed through the XHTML escaping pipeline, and either reports
 * warnings or auto-fixes them.
 */

import type { PageSpec, SpecBlock, CardItemSpec } from "./types.js";
import { blockType, blockValue } from "./types.js";

// ── Entity vocabulary (single source of truth) ──────────────

/** Named HTML entities → Unicode. */
export const ENTITY_TO_UNICODE: Record<string, string> = {
  "&nbsp;": "\u00A0",
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&hellip;": "\u2026",
  "&bull;": "\u2022",
  "&rarr;": "\u2192",
  "&larr;": "\u2190",
  "&trade;": "\u2122",
  "&copy;": "\u00A9",
  "&reg;": "\u00AE",
  "&deg;": "\u00B0",
  "&times;": "\u00D7",
  "&divide;": "\u00F7",
  "&middot;": "\u00B7",
  "&laquo;": "\u00AB",
  "&raquo;": "\u00BB",
};

/** Bare entity names without & and ; */
export const ENTITY_NAMES = Object.keys(ENTITY_TO_UNICODE).map(
  (e) => e.slice(1, -1),
);

const NAMES_ALT = ENTITY_NAMES.join("|");

const ENTITY_RE = new RegExp(`&(${NAMES_ALT});`, "gi");

const DOUBLE_ENCODED_RE = new RegExp(
  `&amp;(${NAMES_ALT}|#\\\\d+|#x[0-9a-fA-F]+);`,
  "gi",
);

const REPLACEMENT_CHAR_RE = /\uFFFD+/g;

// ── Text-level operations ────────────────────────────────────

/**
 * Replace named HTML entities with Unicode equivalents.
 * Also un-double-encodes &amp;entity; → Unicode.
 * Idempotent once entities are resolved.
 */
export function sanitizeText(text: string): string {
  let result = text.replace(DOUBLE_ENCODED_RE, (_, name) => {
    const entity = `&${name.toLowerCase()};`;
    return ENTITY_TO_UNICODE[entity] ?? `&${name};`;
  });
  result = result.replace(ENTITY_RE, (match) => {
    return ENTITY_TO_UNICODE[match.toLowerCase()] ?? match;
  });
  result = result.replace(REPLACEMENT_CHAR_RE, "\u2014");
  return result;
}

// ── Spec lint issue type ─────────────────────────────────────

export interface SpecLintIssue {
  check: string;
  severity: "error" | "warning";
  message: string;
  blockIndex?: number;
  field?: string;
}

/**
 * Scan a text string for encoding issues.
 */
export function lintText(
  text: string,
  context: { blockIndex?: number; field?: string },
): SpecLintIssue[] {
  const issues: SpecLintIssue[] = [];

  for (const m of text.matchAll(DOUBLE_ENCODED_RE)) {
    issues.push({
      check: "S11",
      severity: "error",
      message: `Double-encoded entity "${m[0]}" — will render as literal text`,
      ...context,
    });
  }
  for (const m of text.matchAll(ENTITY_RE)) {
    issues.push({
      check: "S11",
      severity: "warning",
      message: `Named entity "${m[0]}" will double-encode — use Unicode equivalent`,
      ...context,
    });
  }
  for (const m of text.matchAll(REPLACEMENT_CHAR_RE)) {
    issues.push({
      check: "S12",
      severity: "error",
      message: `U+FFFD replacement character at offset ${m.index} — encoding corruption (auto-fixed to em-dash)`,
      ...context,
    });
  }
  return issues;
}

// ── Spec-level text field traversal ──────────────────────────

const SCALAR_TYPES = new Set(["section_label", "heading", "prose", "closing"]);

interface TextField {
  path: string;
  get(): string;
  set(v: string): void;
}

function forEachTextField(
  spec: PageSpec,
  fn: (field: TextField, blockIndex?: number) => void,
): void {
  if (spec.title) {
    fn({
      path: "title",
      get: () => spec.title!,
      set: (v) => { spec.title = v; },
    });
  }

  for (let i = 0; i < spec.blocks.length; i++) {
    const block = spec.blocks[i];
    const type = blockType(block);
    const val = blockValue(block);

    if (SCALAR_TYPES.has(type) && typeof val === "string") {
      const blk = block as Record<string, unknown>;
      fn({
        path: "text",
        get: () => blk[type] as string,
        set: (v) => { blk[type] = v; },
      }, i);
      continue;
    }

    for (const tf of textFieldsOf(block)) {
      fn(tf, i);
    }
  }
}

function textFieldsOf(block: SpecBlock): TextField[] {
  const type = blockType(block);
  const val = blockValue(block) as Record<string, unknown>;
  const out: TextField[] = [];

  const add = (path: string, obj: Record<string, unknown>, key: string) => {
    if (typeof obj[key] === "string") {
      out.push({
        path,
        get: () => obj[key] as string,
        set: (v) => { obj[key] = v; },
      });
    }
  };

  switch (type) {
    case "hero":
      add("title", val, "title");
      add("category", val, "category");
      add("body", val, "body");
      break;

    case "section_label":
    case "prose":
    case "closing":
      add("text", val, "text");
      break;

    case "heading":
      if (typeof val !== "string") add("text", val, "text");
      break;

    case "info_box":
      add("content", val, "content");
      break;

    case "cards":
      for (const [i, item] of ((val.items ?? []) as CardItemSpec[]).entries()) {
        const r = item as unknown as Record<string, unknown>;
        add(`items[${i}].title`, r, "title");
        add(`items[${i}].subtitle`, r, "subtitle");
        add(`items[${i}].body`, r, "body");
        add(`items[${i}].footer`, r, "footer");
      }
      break;

    case "flow_chain":
      for (const [i, step] of ((val.steps ?? []) as { label: string }[]).entries()) {
        add(`steps[${i}].label`, step as unknown as Record<string, unknown>, "label");
      }
      break;

    case "table": {
      for (const [i, hdr] of ((val.headers ?? []) as { label: string }[]).entries()) {
        add(`headers[${i}].label`, hdr as unknown as Record<string, unknown>, "label");
      }
      const rows = val.rows as string[][] | undefined;
      if (rows) {
        for (let r = 0; r < rows.length; r++) {
          for (let c = 0; c < rows[r].length; c++) {
            const rowRef = rows[r];
            const ci = c;
            if (typeof rowRef[ci] === "string") {
              out.push({
                path: `rows[${r}][${c}]`,
                get: () => rowRef[ci],
                set: (v) => { rowRef[ci] = v; },
              });
            }
          }
        }
      }
      break;
    }

    case "badge":
      for (const [i, item] of ((val.items ?? []) as { label: string }[]).entries()) {
        add(`items[${i}].label`, item as unknown as Record<string, unknown>, "label");
      }
      break;
  }

  return out;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Lint a PageSpec for encoding issues.
 */
export function lintSpec(spec: PageSpec): SpecLintIssue[] {
  const issues: SpecLintIssue[] = [];
  forEachTextField(spec, (field, blockIndex) => {
    issues.push(...lintText(field.get(), { blockIndex, field: field.path }));
  });
  return issues;
}

/**
 * Sanitize a PageSpec in-place: replace named HTML entities with Unicode.
 * Returns the number of fields modified.
 */
export function sanitizeSpec(spec: PageSpec): number {
  let fixCount = 0;
  forEachTextField(spec, (field) => {
    const original = field.get();
    const sanitized = sanitizeText(original);
    if (sanitized !== original) {
      field.set(sanitized);
      fixCount++;
    }
  });
  return fixCount;
}
