/**
 * Spec core — the shared vocabulary foundation.
 *
 * Every spec package depends on meta-spec for the kind discriminator
 * and the MetaSpec type. This is the type registry: it defines what
 * spec kinds exist and provides the self-describing MetaSpec type.
 */

// ── Spec kind ─────────────────────────────────────────────────

/**
 * Spec kind — the type discriminator for all YAML specs.
 *
 * Every spec file declares what it is via `kind:` at the top level.
 * PageSpec defaults to "page" when kind is omitted (backward compat).
 * All other spec types require an explicit kind.
 */
export type SpecKind = "page" | "meta" | "site" | "pattern";

/** The known spec kinds. Runtime complement of the SpecKind type. */
export const SPEC_KINDS = new Set<SpecKind>(["page", "meta", "site", "pattern"]);

// ── MetaSpec ──────────────────────────────────────────────────

/**
 * MetaSpec — the spec that describes specs.
 *
 * A MetaSpec is a YAML file with `kind: meta` that defines the vocabulary:
 * what spec types exist, what fields they carry, and what each one means.
 * The type registry expressed as MSF.
 */
export interface MetaSpec {
  kind: "meta";
  /** Human-readable title for this vocabulary definition. */
  title?: string;
  /** Vocabulary version. */
  version?: string;
  /** Spec type definitions — keyed by kind name. */
  specs: Record<string, SpecTypeDef>;
}

/** Definition of a spec type within a MetaSpec. */
export interface SpecTypeDef {
  /** What this spec type represents. */
  description: string;
  /** Package that owns the canonical type definition. */
  package?: string;
  /** Abstraction level: system, collection, or instance. */
  level?: "system" | "collection" | "instance";
  /** Required top-level fields. */
  required?: string[];
  /** Field definitions. */
  fields?: Record<string, MetaFieldDef>;
}

/** Field definition within a SpecTypeDef. */
export interface MetaFieldDef {
  /** Field type name. */
  type: string;
  /** What this field means. */
  description?: string;
  /** Whether this field is required. */
  required?: boolean;
  /** Default value when omitted. */
  default?: unknown;
  /** Allowed values (for string enums). */
  enum?: string[];
}
