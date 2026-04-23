/**
 * Resolved types — the compiler's working representation.
 *
 * Spec types (types.ts) are the YAML author's contract.
 * Resolved types carry pipeline-computed values that compilers need at render time.
 * The boundary is the color resolution pipeline: spec items go in, resolved items come out.
 */

import type { CardItemSpec } from "./types.js";

// ── Resolved color ───────────────────────────────────────────

/** Fully resolved RGB color — bg, text, and border surfaces. */
export interface ResolvedColor {
  bg: string;
  text: string;
  border: string;
}

/**
 * A color value in the rendering pipeline.
 * String: unresolved hue name, semantic role, or shade ref.
 * Object: fully resolved RGB surfaces from the color pipeline.
 */
export type ColorValue = string | ResolvedColor;

// ── Resolved item types ──────────────────────────────────────

/** A card item with its color potentially resolved by the pipeline. */
export interface ResolvedCardItem extends Omit<CardItemSpec, "color"> {
  color?: ColorValue;
}

/** A flow chain step with its color potentially resolved. */
export interface ResolvedFlowStep {
  label: string;
  color?: ColorValue;
}

/** A badge item with its color potentially resolved. */
export interface ResolvedBadgeItem {
  label: string;
  color?: ColorValue;
}
