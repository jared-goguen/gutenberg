/**
 * Runtime schema for page spec blocks.
 *
 * TypeScript interfaces define the spec at compile time but are erased at
 * runtime. This module provides the same information as data — field names,
 * required/optional, type constraints — so the YAML parser can validate
 * specs before they reach the renderer.
 */

// ── Field descriptors ────────────────────────────────────────

export type FieldType = "string" | "number" | "boolean" | "array" | "object";

export interface FieldDef {
  required: boolean;
  type: FieldType;
  /** Allowed values for string fields. */
  enum?: string[];
  /** Schema for array items (when type is "array" and items are objects). */
  itemFields?: Record<string, FieldDef>;
}

export interface BlockSchema {
  /** Whether this block type accepts a string shorthand. */
  scalar?: boolean;
  fields: Record<string, FieldDef>;
}

// ── Field helpers ────────────────────────────────────────────

const req = (type: FieldType, opts?: Partial<FieldDef>): FieldDef =>
  ({ required: true, type, ...opts });

const opt = (type: FieldType, opts?: Partial<FieldDef>): FieldDef =>
  ({ required: false, type, ...opts });

// ── Shared field patterns ────────────────────────────────────

const cohesion = opt("string", { enum: ["continues", "supports", "contrasts", "pivots", "resolves"] });
const scheme = opt("string");
const tone = opt("string", { enum: ["warm", "cool", "accent", "neutral", "drama"] });
const progression = opt("string");
const color = opt("string");

// ── Block schemas ────────────────────────────────────────────

export const BLOCK_SCHEMAS: Record<string, BlockSchema> = {
  hero: {
    fields: {
      title: req("string"),
      categories: opt("array"),
      subtitle: opt("string"),
      body: opt("string"),
    },
  },

  superhero: {
    fields: {
      title: req("string"),
      categories: opt("array"),
      body: opt("string"),
      glyphs: opt("string"),
      taglines: opt("array"),
      descriptors: opt("array", {
        itemFields: {
          title: req("string"),
          body: req("string"),
        },
      }),
      scroll_cta: opt("object"),
      grid: opt("boolean"),
    },
  },

  section_label: {
    scalar: true,
    fields: {
      text: req("string"),
      anchor: opt("string"),
      tone,
    },
  },

  cards: {
    fields: {
      cohesion,
      items: req("array", {
        itemFields: {
          title: req("string"),
          subtitle: opt("string"),
          body: opt("string"),
          footer: opt("string"),
          link: opt("string"),
          color,
          badge: opt("string"),
          size: opt("string", { enum: ["normal", "wide", "tall", "large"] }),
        },
      }),
      cols: opt("number"),
      emphasis: opt("string", { enum: ["subtle", "standard", "bold"] }),
      scheme,
      tone,
      progression,
    },
  },

  nav_cards: {
    fields: {
      cohesion,
      items: opt("array", {
        itemFields: {
          page: opt("string"),
          title: opt("string"),
          description: opt("string"),
          link: opt("string"),
        },
      }),
      cols: opt("number"),
    },
  },

  stat: {
    fields: {
      cohesion,
      items: req("array", {
        itemFields: {
          value: req("string"),
          label: req("string"),
          detail: opt("string"),
          unit: opt("string"),
          trend: opt("string"),
          color,
        },
      }),
      scheme,
      tone,
      progression,
    },
  },

  page_nav: {
    fields: {
      cohesion,
      entries: opt("array", {
        itemFields: {
          text: req("string"),
          anchor: req("string"),
        },
      }),
    },
  },

  prose: {
    scalar: true,
    fields: {
      cohesion,
      text: req("string"),
      role: opt("string", { enum: ["intro", "body", "caption"] }),
    },
  },

  closing: {
    scalar: true,
    fields: {
      text: req("string"),
    },
  },

  flow_chain: {
    fields: {
      cohesion,
      steps: req("array", {
        itemFields: {
          label: req("string"),
          color,
        },
      }),
      scheme,
      tone,
      progression,
    },
  },

  table: {
    fields: {
      cohesion,
      headers: req("array", {
        itemFields: {
          label: req("string"),
          size: opt("string", { enum: ["narrow", "medium", "wide", "fill"] }),
          align: opt("string", { enum: ["left", "center", "right"] }),
        },
      }),
      rows: req("array"),
      scheme,
      caption: opt("string"),
      headerColumn: opt("boolean"),
    },
  },

  heading: {
    scalar: true,
    fields: {
      cohesion,
      text: req("string"),
      level: opt("number"),
      anchor: opt("string"),
    },
  },

  callout: {
    fields: {
      title: req("string"),
      body: opt("string"),
      link: opt("string"),
      label: opt("string"),
      color,
    },
  },

  pullquote: {
    fields: {
      text: req("string"),
      attribution: opt("string"),
      color,
    },
  },

  install: {
    fields: {
      title: req("string"),
      body: opt("string"),
      link: opt("string"),
      action: opt("string"),
      color,
    },
  },

  info_box: {
    fields: {
      cohesion,
      boxType: req("string", { enum: ["note", "info", "warning", "tip"] }),
      content: req("string"),
      title: opt("string"),
    },
  },

  macro: {
    fields: {
      cohesion,
      name: req("string"),
      params: opt("object"),
      body: opt("string"),
    },
  },

  swatch_strip: {
    fields: {
      cohesion,
      hue: req("string"),
      shades: opt("array"),
      title: opt("string"),
    },
  },

  badge: {
    fields: {
      cohesion,
      items: req("array", {
        itemFields: {
          label: req("string"),
          color,
        },
      }),
      scheme,
      tone,
      progression,
      size: opt("string", { enum: ["sm", "md"] }),
    },
  },

  transform: {
    fields: {
      cohesion,
      steps: req("array", {
        itemFields: {
          input: opt("string"),
          tool: req("string"),
          output: req("string"),
          link: opt("string"),
          outputLink: opt("string"),
          color,
          featured: opt("boolean"),
        },
      }),
      scheme,
      tone,
      progression,
    },
  },

  timeline: {
    fields: {
      cohesion,
      caption: opt("string"),
      scheme,
      tone,
      progression,
      terminus: opt("string"),
      items: opt("array", {
        itemFields: {
          label: req("string"),
          date: req("string"),
          status: req("string", { enum: ["shipped", "active", "planned"] }),
          sublabel: opt("string"),
          color,
          link: opt("string"),
        },
      }),
      tracks: opt("array", {
        itemFields: {
          label: req("string"),
          sublabel: opt("string"),
          color,
          items: req("array"),
        },
      }),
    },
  },

  recent: {
    scalar: true,
    fields: {
      path: opt("string"),
      count: opt("number"),
    },
  },

  raw: {
    scalar: true,
    fields: {},
  },
};

// ── Frame schemas ────────────────────────────────────────────

export const FRAME_SCHEMAS: Record<string, BlockSchema> = {
  hero: {
    fields: {
      title: opt("string"),
      categories: opt("array"),
      body: opt("string"),
    },
  },
  superhero: {
    fields: {
      title: opt("string"),
      categories: opt("array"),
      body: opt("string"),
      glyphs: opt("string"),
    },
  },
  closing: {
    fields: {
      text: req("string"),
    },
  },
};

// ── Validation ───────────────────────────────────────────────

export interface SchemaIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

export function validateBlockFields(
  type: string,
  value: unknown,
  blockIndex: number,
): SchemaIssue[] {
  const schema = BLOCK_SCHEMAS[type];
  if (!schema) return [];

  if (schema.scalar && typeof value === "string") return [];

  if (typeof value !== "object" || value === null) {
    return [{
      severity: "error",
      path: `blocks[${blockIndex}].${type}`,
      message: `expected an object${schema.scalar ? " or string" : ""}, got ${typeof value}`,
    }];
  }

  const obj = value as Record<string, unknown>;
  const prefix = `blocks[${blockIndex}].${type}`;
  return validateFields(obj, schema.fields, prefix);
}

export function validateFrameFields(
  frame: string,
  value: unknown,
): SchemaIssue[] {
  const schema = FRAME_SCHEMAS[frame];
  if (!schema) return [];

  if (typeof value === "string") return [];

  if (typeof value !== "object" || value === null) {
    return [{
      severity: "error",
      path: frame,
      message: `expected an object, got ${typeof value}`,
    }];
  }

  return validateFields(value as Record<string, unknown>, schema.fields, frame);
}

function validateFields(
  obj: Record<string, unknown>,
  fields: Record<string, FieldDef>,
  prefix: string,
): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const [name, def] of Object.entries(fields)) {
    if (def.required && !(name in obj)) {
      issues.push({
        severity: "error",
        path: `${prefix}.${name}`,
        message: `required field "${name}" is missing`,
      });
    }
  }

  for (const [name, value] of Object.entries(obj)) {
    const def = fields[name];

    if (!def) {
      const suggestion = closestMatch(name, Object.keys(fields));
      const hint = suggestion ? ` (did you mean "${suggestion}"?)` : "";
      issues.push({
        severity: "warning",
        path: `${prefix}.${name}`,
        message: `unknown field "${name}"${hint}`,
      });
      continue;
    }

    if (value !== undefined && value !== null) {
      const actual = Array.isArray(value) ? "array" : typeof value;
      if (actual !== def.type) {
        if (def.type === "string" && actual === "number") continue;
        if (def.type === "string" && actual === "array") continue;

        issues.push({
          severity: "error",
          path: `${prefix}.${name}`,
          message: `expected ${def.type}, got ${actual}`,
        });
        continue;
      }
    }

    if (def.enum && typeof value === "string" && !def.enum.includes(value)) {
      issues.push({
        severity: "error",
        path: `${prefix}.${name}`,
        message: `invalid value "${value}". Expected: ${def.enum.join(", ")}`,
      });
    }

    if (def.type === "array" && def.itemFields && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item === "object" && item !== null) {
          const itemIssues = validateFields(
            item as Record<string, unknown>,
            def.itemFields,
            `${prefix}.${name}[${i}]`,
          );
          issues.push(...itemIssues);
        }
      }
    }
  }

  return issues;
}

function closestMatch(input: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;

  let best: string | null = null;
  let bestDist = Infinity;

  for (const c of candidates) {
    const d = levenshtein(input.toLowerCase(), c.toLowerCase());
    if (d < bestDist && d <= Math.max(2, Math.floor(input.length / 2))) {
      bestDist = d;
      best = c;
    }
  }

  return best;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
