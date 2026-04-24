/**
 * Semantic color roles — role-based color references.
 *
 * Maps abstract roles (primary, success, danger, etc.) to palette hues.
 * Schemes can override these mappings so the same semantic intent
 * (e.g. "danger") resolves to different hues in different contexts.
 */

import { scales, formatRgb } from "./palette.js";
import type { ColorDef } from "./palette.js";
import { getShade } from "./oklch.js";
import { getShadeMappings, schemes } from "./themes.js";
import type { ShadeMappings } from "./themes.js";

// ── Role definitions ─────────────────────────────────────────

export type SemanticRole =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

/** Default role → palette hue mapping */
const defaultRoleMap: Record<SemanticRole, string> = {
  primary: "blue",
  accent:  "violet",
  success: "emerald",
  warning: "amber",
  danger:  "vermillion",
  info:    "sky",
};

/** Scheme-specific role overrides */
const schemeRoleOverrides: Record<string, Partial<Record<SemanticRole, string>>> = {
  cloudflare: { primary: "orange", accent: "vermillion", info: "teal" },
};

// ── Resolution ───────────────────────────────────────────────

const ALL_ROLES = Object.keys(defaultRoleMap) as SemanticRole[];

/**
 * Check if a string is a valid semantic role.
 */
export function isSemanticRole(s: string): s is SemanticRole {
  return ALL_ROLES.includes(s as SemanticRole);
}

/**
 * Get the palette hue name for a role, optionally scoped to a scheme.
 */
export function roleToHue(role: SemanticRole, schemeName?: string): string {
  if (schemeName && schemeRoleOverrides[schemeName]) {
    const override = schemeRoleOverrides[schemeName][role];
    if (override) return override;
  }
  return defaultRoleMap[role];
}

/**
 * Resolve a semantic role to a ColorDef.
 */
export function resolveRole(
  role: SemanticRole,
  schemeName?: string,
  shades?: ShadeMappings,
): ColorDef {
  const hue = roleToHue(role, schemeName);
  const effectiveShades = shades ?? getShadeMappings(schemeName);
  const scale = scales[hue];

  if (!scale) {
    return { bg: "rgb(128,128,128)", text: "rgb(255,255,255)", border: "rgb(128,128,128)" };
  }

  return {
    bg: formatRgb(getShade(scale, effectiveShades.bg).rgb),
    text: formatRgb(getShade(scale, effectiveShades.text).rgb),
    border: formatRgb(getShade(scale, effectiveShades.border).rgb),
  };
}

/**
 * List all available semantic roles.
 */
export function listRoles(): SemanticRole[] {
  return [...ALL_ROLES];
}
