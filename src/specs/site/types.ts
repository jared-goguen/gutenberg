/**
 * Site spec types — declarative identity and governance of a page collection.
 *
 * A site spec (_site.yaml) declares what a collection of pages is,
 * where it deploys, how it's organized, and what rules apply.
 *
 * Separate from page-spec: a site governs pages but doesn't define blocks.
 */

// ── Deploy targets ───────────────────────────────────────────

export type TargetName = "cloudflare-pages" | "wrangler";

// ── Convention checks ────────────────────────────────────────

/** Convention check identifiers. */
export type ConventionCheck =
  | "C2-orphaned-reference"
  | "C3-reference-backlink"
  | "C4-hubless-section"
  | "C5-nav-ordering";

/** Severity level for convention checks. */
export type ConventionSeverity = "error" | "warning" | "info";

// ── Presentation axes ────────────────────────────────────────

/** Pace — how quickly the reader moves through. */
export type Pace = "open" | "balanced" | "dense";

/** Weight — how much each element asserts itself. */
export type Weight = "light" | "regular" | "heavy";

// ── Navigation ───────────────────────────────────────────────

/**
 * Navigation item in SiteSpec.nav.
 *
 * Discrimination:
 *   string                 → slug ("history") or separator ("---")
 *   { group: "LABEL" }     → visual group header (no page behind it)
 *   { url, title }         → external link
 *   { slug: NavItem[] }    → section with ordered children (recursive)
 */
export type NavItem = string | NavGroup | NavLink | NavBranch;

/** Visual group header in navigation. */
export interface NavGroup {
  group: string;
}

/** External link — rendered in the sidebar but not backed by a spec. */
export interface NavLink {
  url: string;
  title: string;
}

/**
 * Section with explicitly ordered children.
 * Single-key object: the key is the slug, the value is the child items.
 */
export type NavBranch = { [slug: string]: NavItem[] };

// ── Graph ────────────────────────────────────────────────────

/**
 * Node in the semantic graph. Every page with declared relationships
 * or metadata becomes a node. The `type` field groups nodes into
 * cohorts (e.g. "workstream", "domain", "evidence").
 */
export interface GraphNode {
  /** Node type — groups nodes into cohorts. */
  type: string;
  /** Arbitrary metadata. */
  [key: string]: unknown;
}

/**
 * Edge map for a single relationship type.
 * Keys are source node slugs, values are target node slug(s).
 */
export type GraphEdgeMap = Record<string, string | string[]>;

/**
 * GraphSpec — the semantic relationship layer.
 *
 * Declares typed nodes and named edges. Lives in _site.yaml
 * alongside nav — nav controls ordering, graph controls meaning.
 */
export interface GraphSpec {
  nodes?: Record<string, GraphNode>;
  edges?: Record<string, GraphEdgeMap>;
}

/**
 * Resolved graph — bidirectional indexes built from GraphSpec.
 * Produced by resolveGraph(), consumed by the build pipeline.
 */
export interface ResolvedGraph {
  nodes: Map<string, GraphNode>;
  forward: Map<string, Map<string, string[]>>;
  reverse: Map<string, Map<string, string[]>>;
  types: Map<string, string[]>;
}

// ── Access control ───────────────────────────────────────────

export interface AccessSpec {
  /** Email domain(s) allowed to access the published site. */
  email_domain: string | string[];
  /** Session duration (e.g., "24h", "12h"). Default: "24h". */
  session_duration?: string;
}

/** Resolved access config — always concrete, never undefined. */
export type ResolvedAccess = AccessSpec | "public";

// ── Chrome overrides ─────────────────────────────────────────

/**
 * Chrome overrides — author escape hatch for navigation feature inference.
 * Set `true` to force on, `false` to force off. Omit to accept default.
 */
export interface ChromeOverrides {
  right_rail?: boolean;
  page_footer?: boolean;
  breadcrumbs?: boolean;
  view_transitions?: boolean;
  progress_bar?: boolean;
  hash_sync?: boolean;
  search?: boolean;
}

// ── The SiteSpec ─────────────────────────────────────────────

/**
 * SiteSpec — declarative identity and governance of a page collection.
 *
 * File: _site.yaml at project root.
 */
export interface SiteSpec {
  kind?: "site";
  /** Project name (lowercase-hyphenated). REQUIRED. */
  project: string;

  /** Environment variable holding the API token for deploys. */
  env_token?: string;

  // Deploy
  targets?: TargetName[];
  build_command?: string;

  // Access control (cloudflare-pages only)
  access?: AccessSpec | "public";

  // Presentation defaults
  theme?: string;
  pace?: Pace;
  weight?: Weight;

  /** Custom CSS file path (relative to project root). */
  theme_css?: string;

  // Navigation
  nav?: NavItem[];
  expanded?: string[];
  labels?: Record<string, string>;

  // Semantic graph
  graph?: GraphSpec;

  // Chrome overrides
  chrome?: ChromeOverrides;

  // Convention overrides
  conventions?: Partial<Record<ConventionCheck, ConventionSeverity | "off">>;
}

// ── Spec entry ───────────────────────────────────────────────

/** Metadata for a discovered spec file. Produced by tree walkers. */
export interface SpecEntry {
  /** Relative path from project root (e.g. "billing/dunning.yaml") */
  key: string;
  /** Absolute filesystem path */
  path: string;
  /** Whether this is an _index.yaml file */
  isIndex: boolean;
  /** Section slug (first directory segment), or undefined for root-level */
  section: string | undefined;
  /** URL path derived from key */
  urlPath: string;
  /** File modification time. */
  mtime?: Date;
}

// ── Resolved navigation ──────────────────────────────────────

export interface SiteNavResolved {
  order: string[];
  separators: Set<string>;
  labels: Map<string, string>;
  expanded: Set<string>;
  categories: { label: string; slugs: string[] }[];
  sections: Map<string, string[]>;
  links: Map<string, { url: string; title: string }>;
}
