/**
 * Tonal enrichment — resolve semantic tone/progression to concrete item colors.
 *
 * Runs before cross-block sequence coordination in the enrichment pipeline.
 * Walks content blocks in order, tracking the tonal context set by section_labels:
 *
 *   section_label "ARCHITECTURE" tone=warm    ← sets context to warm
 *     cards (4 items, no tone/progression)    ← gets 4 warm hues injected
 *     flow_chain (3 steps, no tone/progression)← gets 3 warm hues injected
 *   section_label "INTEGRATIONS" tone=cool     ← switches context to cool
 *     cards (3 items, no tone/progression)    ← gets 3 cool hues injected
 *
 * Resolution priority (highest wins):
 *   1. scheme: — explicit, never touched
 *   2. progression: — resolved to item colors via resolveProgression()
 *   3. tone: (on block) — resolved via resolveTone()
 *   4. tone: (from section_label context) — inherited, resolved via resolveTone()
 *   5. (none) — no tonal enrichment, falls through to sequence coordination
 *
 * Colors are injected directly onto items (same mechanism as injectSequenceColors).
 * The existing renderers see item-level `color` fields and work unchanged.
 */

import type {
  SpecBlock,
  Tone,
  SectionLabelSpec,
  CardsSpec,
  StatSpec,
  FlowChainSpec,
  BadgeSpec,
  TransformSpec,
  TransformStepSpec,
} from "./specs/page/index.js";
import { blockType, blockValue } from "./specs/page/index.js";
import { resolveTone, resolveProgression } from "./chromata/tonal.js";
import type { Tone as ChromaTone } from "./chromata/tonal.js";

// ── Types ────────────────────────────────────────────────────

/** Blocks that have items/steps with color fields and support tone/progression. */
interface ColorableBlock {
  palette?: string;
  tone?: Tone;
  progression?: string;
}

/** Generic item with an optional color field. */
interface ColorableItem {
  color?: string;
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Get the colorable items array from a block, if it has one.
 * Returns the items and the key name ("items" or "steps").
 */
function getColorableItems(
  type: string,
  val: unknown,
): { items: ColorableItem[]; key: string } | null {
  if (!val || typeof val !== "object") return null;
  const v = val as Record<string, unknown>;

  switch (type) {
    case "cards":
    case "stat":
    case "badge":
      return v.items ? { items: v.items as ColorableItem[], key: "items" } : null;
    case "flow_chain":
    case "transform":
      return v.steps ? { items: v.steps as ColorableItem[], key: "steps" } : null;
    default:
      return null;
  }
}

/**
 * Check if a block has tonal fields (tone or progression).
 */
function hasTonalFields(val: unknown): val is ColorableBlock {
  if (!val || typeof val !== "object") return false;
  const v = val as Record<string, unknown>;
  return !!v.tone || !!v.progression;
}

/**
 * Parse a progression string into from/to endpoints.
 * Syntax: "warm..cool", "cool..drama", "orange..violet"
 */
function parseProgression(prog: string): { from: string; to: string } | null {
  // "contrast" is syntactic sugar for "warm..cool" — maximum warm-cool contrast
  if (prog === "contrast") return { from: "warm", to: "cool" };
  if (!prog.includes("..")) return null;
  const [from, to] = prog.split("..", 2).map((s) => s.trim());
  if (!from || !to) return null;
  return { from, to };
}

// ── Main enrichment function ─────────────────────────────────

/**
 * Apply tonal enrichment to content blocks.
 *
 * Mutates blocks in place — injects hue names onto items that lack
 * explicit color fields. Blocks with `scheme:` are untouched.
 *
 * @param blocks - Content blocks (already normalized by enrich step 4)
 * @param scheme - Page-level scheme name
 */
export function tonalEnrich(blocks: SpecBlock[], scheme: string): void {
  let currentTone: Tone | null = null;

  for (const block of blocks) {
    const type = blockType(block);
    const val = blockValue(block);

    // ── Section labels set tonal context ───────────────────
    if (type === "section_label") {
      const slVal = val as SectionLabelSpec;
      if (slVal.tone) {
        currentTone = slVal.tone;
      }
      continue;
    }

    // ── Only process colorable blocks ──────────────────────
    const itemInfo = getColorableItems(type, val);
    if (!itemInfo) continue;

    const blockVal = val as ColorableBlock;

    // Skip blocks with explicit palette override (handled by renderer)
    if (blockVal.palette) continue;

    // Count items that need colors (those without explicit color)
    const needsColor = itemInfo.items.filter((item) => !item.color);
    if (needsColor.length === 0) continue;

    // Determine the tonal directive
    let hues: string[] | null = null;

    if (blockVal.progression) {
      // Priority 2: block-level progression
      const endpoints = parseProgression(blockVal.progression);
      if (endpoints) {
        const result = resolveProgression(
          endpoints.from,
          endpoints.to,
          needsColor.length,
          scheme,
        );
        hues = result.hues;
      }
    } else if (blockVal.tone) {
      // Priority 3: block-level tone
      const result = resolveTone(
        blockVal.tone as ChromaTone,
        needsColor.length,
        scheme,
      );
      hues = result.hues;
    } else if (currentTone) {
      // Priority 4: inherited section tone
      const result = resolveTone(
        currentTone as ChromaTone,
        needsColor.length,
        scheme,
      );
      hues = result.hues;
    }

    // Inject resolved hues onto items
    if (hues && hues.length > 0) {
      let hueIdx = 0;
      for (const item of itemInfo.items) {
        if (!item.color && hueIdx < hues.length) {
          item.color = hues[hueIdx];
          hueIdx++;
        }
      }
    }
  }
}
