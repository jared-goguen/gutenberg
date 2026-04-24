/**
 * YAML serialization for PageSpec.
 *
 * Produces human-readable YAML with:
 *   - Block-style for complex objects
 *   - Flow style for small inline objects (card items, table headers)
 *   - Folded strings (>) for multi-line body text
 *   - Shorthand scalars where applicable
 */

import { Document, stringify, parse, YAMLMap, Pair, Scalar, YAMLSeq } from "yaml";
import type { PageSpec, Pace, Weight, SpecBlock, HeroFrame, ClosingFrame, Cohesion } from "./types.js";
import { blockType, blockValue } from "./types.js";
import type { SpecKind } from "../meta/index.js";
import { SPEC_KINDS } from "../meta/index.js";
import { validateBlockFields, validateFrameFields } from "./schema.js";
import type { SchemaIssue } from "./schema.js";

// ── Kind discriminator ───────────────────────────────────────

/**
 * Read the spec kind from raw YAML without full parsing.
 * Returns "page" when kind is omitted (backward compat).
 * Throws on unknown kind values.
 */
export function readKind(yaml: string): SpecKind {
  const raw = parse(yaml) as Record<string, unknown>;
  if (!raw || typeof raw !== "object") return "page";

  const kind = raw.kind;
  if (kind === undefined || kind === null) return "page";

  const k = String(kind);
  if (!SPEC_KINDS.has(k as SpecKind)) {
    throw new Error(`Unknown spec kind "${k}". Known kinds: ${[...SPEC_KINDS].join(", ")}`);
  }
  return k as SpecKind;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Serialize a PageSpec to YAML string.
 */
export function toYaml(spec: PageSpec): string {
  const doc: Record<string, unknown> = {};
  if (spec.title) doc.title = spec.title;
  if (spec.theme) doc.theme = spec.theme;

  // Frame
  if (spec.section) doc.section = spec.section;
  if (spec.hero) doc.hero = spec.hero;
  if (spec.closing) doc.closing = spec.closing;

  doc.blocks = spec.blocks.map(formatBlock);

  return stringify(doc, {
    lineWidth: 100,
    defaultStringType: Scalar.PLAIN,
    defaultKeyType: Scalar.PLAIN,
    blockQuote: "literal",
    collectionStyle: "block",
  });
}

/**
 * Parse a YAML string into a PageSpec.
 */
export function fromYaml(yaml: string): PageSpec {
  const raw = parse(yaml) as Record<string, unknown>;

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid page spec: expected a YAML object");
  }

  const spec: PageSpec = {
    blocks: [],
    ...(raw.title ? { title: String(raw.title) } : {}),
  };

  const VALID_PAGE_THEMES = new Set(["cloudflare", "reactor", "ink", "wire", "mono"]);
  if (raw.theme) {
    const t = String(raw.theme);
    if (!VALID_PAGE_THEMES.has(t)) {
      console.warn(`[page] Invalid theme "${t}" — expected: ${[...VALID_PAGE_THEMES].join(", ")}. Ignoring.`);
    } else {
      spec.theme = t;
    }
  }
  // Legacy: accept scheme as alias for theme
  if (raw.scheme && !raw.theme) spec.theme = String(raw.scheme);
  if (raw.url) spec.url = String(raw.url);
  if (raw.pace) spec.pace = raw.pace as Pace;
  if (raw.weight) spec.weight = raw.weight as Weight;
  if (raw.emphasis) spec.emphasis = raw.emphasis as PageSpec["emphasis"];
  if (raw.align) spec.align = raw.align as PageSpec["align"];

  // Frame fields
  if (raw.section) spec.section = String(raw.section);
  if (raw.hero) {
    if (typeof raw.hero === "string") {
      spec.hero = { body: raw.hero };
    } else {
      const heroRaw = { ...(raw.hero as Record<string, unknown>) };
      delete heroRaw.align;
      delete heroRaw.effect;
      delete heroRaw.size;
      // Migrate category → categories
      if (typeof heroRaw.category === "string" && !heroRaw.categories) {
        heroRaw.categories = [heroRaw.category as string];
      }
      delete heroRaw.category;
      spec.hero = heroRaw as unknown as HeroFrame;
    }
  }
  if (raw.superhero) {
    if (typeof raw.superhero === "string") {
      spec.superhero = { body: raw.superhero };
    } else {
      const shRaw = { ...(raw.superhero as Record<string, unknown>) };
      delete shRaw.align;
      // Migrate category → categories
      if (typeof shRaw.category === "string" && !shRaw.categories) {
        shRaw.categories = [shRaw.category as string];
      }
      delete shRaw.category;
      spec.superhero = shRaw as unknown as HeroFrame;
    }
  }
  if (raw.closing && typeof raw.closing === "object" && !Array.isArray(raw.closing)) {
    const closingRaw = { ...(raw.closing as Record<string, unknown>) };
    delete closingRaw.align;
    spec.closing = closingRaw as unknown as ClosingFrame;
  } else if (typeof raw.closing === "string") {
    spec.closing = { text: raw.closing };
  }

  // Navigation siblings
  if (Array.isArray(raw.nav)) {
    spec.nav = raw.nav.filter((n: unknown) => typeof n === "string") as string[];
  }

  if (Array.isArray(raw.blocks)) {
    spec.blocks = migrateLegacyBlocks(validateBlocks(raw.blocks));
  }

  return spec;
}

/**
 * Validate a parsed PageSpec against the block and frame schemas.
 * Returns all issues (errors + warnings).
 */
export function validateSpec(spec: PageSpec): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  // Validate frame fields
  if (spec.hero) issues.push(...validateFrameFields("hero", spec.hero));
  if (spec.superhero) issues.push(...validateFrameFields("superhero", spec.superhero));
  if (spec.closing) issues.push(...validateFrameFields("closing", spec.closing));

  // Validate block fields
  for (let i = 0; i < spec.blocks.length; i++) {
    const block = spec.blocks[i];
    const type = blockType(block);
    const val = blockValue(block);
    issues.push(...validateBlockFields(type, val, i));
  }

  return issues;
}

// ── Block validation ─────────────────────────────────────────

type SpecBlockType = keyof SpecBlock extends never
  ? string
  : SpecBlock extends infer B
    ? B extends Record<string, unknown>
      ? keyof B
      : never
    : never;

const KNOWN_BLOCK_TYPES = new Set<string>([
  "hero", "superhero", "section_label", "cards", "nav_cards", "stat", "page_nav", "prose",
  "flow_chain", "transform", "table", "heading", "info_box",
  "badge", "callout", "install",
  "timeline", "tracker", "calendar", "closing", "recent", "todo", "raw", "pullquote",
  // Internal types not in SpecBlock union
  "macro", "swatch_strip",
  // Legacy types — accepted by parser, migrated by migrateLegacyBlocks()
  "divider", "spacer", "toc",
] satisfies (SpecBlockType | "divider" | "spacer" | "toc")[]);

function validateBlocks(blocks: unknown[]): SpecBlock[] {
  return blocks.map((block, i) => {
    if (block === null || typeof block !== "object") {
      throw new Error(
        `Invalid block at index ${i}: expected an object, got ${typeof block}`,
      );
    }

    const keys = Object.keys(block as Record<string, unknown>);
    if (keys.length !== 1) {
      throw new Error(
        `Invalid block at index ${i}: expected exactly one key, got [${keys.join(", ")}]`,
      );
    }

    const type = keys[0];
    if (!KNOWN_BLOCK_TYPES.has(type)) {
      throw new Error(
        `Unknown block type "${type}" at index ${i}. Known types: ${[...KNOWN_BLOCK_TYPES].join(", ")}`,
      );
    }

    return block as SpecBlock;
  });
}

// ── Formatting helpers ───────────────────────────────────────

function formatBlock(block: SpecBlock): unknown {
  const type = blockType(block);
  const val = blockValue(block);

  // Scalar shorthands: already in compact form
  if (type === "section_label" && typeof val === "string") return block;
  if (type === "heading" && typeof val === "string") return block;
  if (type === "prose" && typeof val === "string") return block;
  if (type === "closing" && typeof val === "string") return block;

  return block;
}

// ── Legacy block migration ───────────────────────────────────

function migrateLegacyBlocks(blocks: SpecBlock[]): SpecBlock[] {
  const result: SpecBlock[] = [];
  let pendingCohesion: Cohesion | null = null;

  for (const block of blocks) {
    const type = blockType(block);

    if (type === "spacer") {
      const px = blockValue(block) as number;
      pendingCohesion = px >= 16 ? "pivots" : "contrasts";
      continue;
    }

    if (type === "divider") {
      pendingCohesion = "contrasts";
      continue;
    }

    if (type === "toc") {
      continue;
    }

    // Strip legacy/showcase fields from hero blocks
    if (type === "hero" || type === "superhero") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.padding;
      delete val.bg;
      delete val.accentColor;
      delete val.align;
      delete val.effect;
      delete val.size;
      if (typeof val.category === "string" && !val.categories) {
        val.categories = [val.category as string];
      }
      delete val.category;
    }

    // Strip legacy fields from flow_chain blocks
    if (type === "flow_chain") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.arrowColor;
    }

    // Strip legacy fields from table blocks
    if (type === "table") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.striped;
      delete val.compact;
      if (Array.isArray(val.headers)) {
        for (const h of val.headers as Record<string, unknown>[]) {
          if (typeof h.width === "number" && !h.size) {
            h.size = widthToSize(h.width);
            delete h.width;
          }
          if (typeof h.size === "number") {
            h.size = widthToSize(h.size);
          }
        }
      }
    }

    // Strip legacy layout from cards
    if (type === "cards") {
      const val = blockValue(block) as Record<string, unknown>;
      if (typeof val.layout === "string" && !val.cols) {
        val.cols = layoutToCols(val.layout);
      }
      delete val.layout;
      delete val.align;
      delete val.surface;
      delete val.border;
      if (Array.isArray(val.items)) {
        for (const item of val.items as Record<string, unknown>[]) {
          if (item.featured && !item.size) {
            item.size = "wide";
          }
          delete item.featured;
          if (item.link && typeof item.link === "object" && !Array.isArray(item.link)) {
            const linkObj = item.link as Record<string, unknown>;
            if (typeof linkObj.title === "string") {
              item.link = linkObj.title;
            }
          }
        }
      }
    }

    // Strip showcase fields from stat blocks
    if (type === "stat") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.animate;
    }

    // Strip legacy prose fields
    if (type === "prose" && typeof blockValue(block) === "object") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.align;
      delete val.reveal;
      delete val.highlight;
    }

    // Strip badge size (inferred from context)
    if (type === "badge") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.size;
    }

    // Strip section_label spacingAfter
    if (type === "section_label" && typeof blockValue(block) === "object") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.spacingAfter;
    }

    // Strip closing align
    if (type === "closing" && typeof blockValue(block) === "object") {
      const val = blockValue(block) as Record<string, unknown>;
      delete val.align;
    }

    // Apply pending cohesion from a dropped spacer/divider
    if (pendingCohesion) {
      const val = blockValue(block);
      if (val && typeof val === "object" && !("cohesion" in (val as Record<string, unknown>))) {
        (val as Record<string, unknown>).cohesion = pendingCohesion;
      }
      pendingCohesion = null;
    }

    result.push(block);
  }

  return result;
}

/** Map legacy percentage width to column size token. */
function widthToSize(width: number): string {
  if (width <= 15) return "narrow";
  if (width <= 28) return "medium";
  if (width <= 45) return "wide";
  return "fill";
}

/** Map legacy layout ratio string to cols count. */
function layoutToCols(layout: string): number | undefined {
  const parts = layout.split(":").map(Number).filter(n => n > 0);
  if (parts.length === 0) return undefined;
  if (parts.every(p => p === parts[0])) return parts.length;
  return parts.length;
}
