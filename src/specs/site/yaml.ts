/**
 * SiteSpec YAML parser — reads _site.yaml into a validated SiteSpec.
 */

import { parse } from "yaml";
import type {
  SiteSpec,
  AccessSpec,
  NavItem,
  NavLink,
  TargetName,
  Pace,
  Weight,
  ConventionCheck,
  ConventionSeverity,
  GraphSpec,
  GraphNode,
  GraphEdgeMap,
  ChromeOverrides,
} from "./types.js";

// ── Validation sets ──────────────────────────────────────────

const VALID_TARGETS = new Set<string>(["cloudflare-pages", "wrangler"]);
const VALID_PACE = new Set<string>(["open", "balanced", "dense"]);
const VALID_WEIGHT = new Set<string>(["light", "regular", "heavy"]);
const VALID_THEMES = new Set<string>(["cloudflare", "reactor", "ink", "wire", "mono"]);
const VALID_CHECKS = new Set<string>([
  "C2-orphaned-reference",
  "C3-reference-backlink",
  "C4-hubless-section",
  "C5-nav-ordering",
]);
const VALID_SEVERITY = new Set<string>(["error", "warning", "info", "off"]);
const VALID_CHROME_KEYS = new Set<string>([
  "right_rail", "page_footer", "breadcrumbs",
  "view_transitions", "progress_bar", "hash_sync", "search",
]);

// ── Parser ───────────────────────────────────────────────────

/**
 * Parse a YAML string into a SiteSpec.
 * Throws on missing required fields or invalid values.
 */
export function fromSiteYaml(yaml: string): SiteSpec {
  const raw = parse(yaml) as Record<string, unknown>;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid site spec: expected a YAML object");
  }

  if (raw.kind !== undefined && raw.kind !== "site") {
    throw new Error(`Expected kind: site, got kind: ${raw.kind}`);
  }

  if (!raw.project || typeof raw.project !== "string") {
    throw new Error('Invalid site spec: required field "project" must be a string');
  }

  const spec: SiteSpec = { project: raw.project };
  if (raw.kind === "site") spec.kind = "site";

  // targets
  if (raw.targets !== undefined) {
    if (!Array.isArray(raw.targets)) {
      throw new Error('Invalid site spec: "targets" must be an array');
    }
    for (const t of raw.targets) {
      if (typeof t !== "string" || !VALID_TARGETS.has(t)) {
        throw new Error(`Invalid target: "${t}". Expected: ${[...VALID_TARGETS].join(", ")}`);
      }
    }
    spec.targets = raw.targets as TargetName[];
  }

  // build_command
  if (raw.build_command !== undefined) {
    if (typeof raw.build_command !== "string") {
      throw new Error('Invalid site spec: "build_command" must be a string');
    }
    spec.build_command = raw.build_command;
  }

  // env_token
  if (raw.env_token !== undefined) {
    if (typeof raw.env_token !== "string") {
      throw new Error('Invalid site spec: "env_token" must be a string');
    }
    spec.env_token = raw.env_token;
  }

  // access
  if (raw.access !== undefined) {
    if (raw.access === "public") {
      spec.access = "public";
    } else if (raw.access && typeof raw.access === "object" && !Array.isArray(raw.access)) {
      const acc = raw.access as Record<string, unknown>;
      if (acc.email_domain === undefined) {
        throw new Error('Invalid site spec: access.email_domain is required');
      }
      if (typeof acc.email_domain === "string") {
        // single domain — ok
      } else if (
        Array.isArray(acc.email_domain) &&
        acc.email_domain.length > 0 &&
        acc.email_domain.every((d: unknown) => typeof d === "string")
      ) {
        // array of domains — ok
      } else {
        throw new Error(
          'Invalid site spec: access.email_domain must be a non-empty string or string[]',
        );
      }
      const accessSpec: AccessSpec = {
        email_domain: acc.email_domain as string | string[],
      };
      if (acc.session_duration !== undefined) {
        if (typeof acc.session_duration !== "string") {
          throw new Error('Invalid site spec: access.session_duration must be a string (e.g., "24h")');
        }
        accessSpec.session_duration = acc.session_duration;
      }
      spec.access = accessSpec;
    } else {
      throw new Error(
        'Invalid site spec: "access" must be "public" or an object with email_domain',
      );
    }
  }

  // theme, pace, weight
  if (raw.theme !== undefined) {
    if (typeof raw.theme !== "string") throw new Error('"theme" must be a string');
    if (!VALID_THEMES.has(raw.theme)) {
      throw new Error(`Invalid theme: "${raw.theme}". Expected: ${[...VALID_THEMES].join(", ")}`);
    }
    spec.theme = raw.theme;
  }
  // Legacy: accept scheme as alias for theme
  if (raw.scheme !== undefined && raw.theme === undefined) {
    if (typeof raw.scheme !== "string") throw new Error('"scheme" must be a string');
    spec.theme = raw.scheme;
  }
  if (raw.pace !== undefined) {
    if (typeof raw.pace !== "string" || !VALID_PACE.has(raw.pace)) {
      throw new Error(`Invalid pace: "${raw.pace}". Expected: ${[...VALID_PACE].join(", ")}`);
    }
    spec.pace = raw.pace as Pace;
  }
  if (raw.weight !== undefined) {
    if (typeof raw.weight !== "string" || !VALID_WEIGHT.has(raw.weight)) {
      throw new Error(`Invalid weight: "${raw.weight}". Expected: ${[...VALID_WEIGHT].join(", ")}`);
    }
    spec.weight = raw.weight as Weight;
  }

  // nav
  if (raw.nav !== undefined) {
    if (!Array.isArray(raw.nav)) throw new Error('"nav" must be an array');
    spec.nav = raw.nav.map((item, i) => parseNavItem(item, `nav[${i}]`));
  }

  // expanded
  if (raw.expanded !== undefined) {
    if (!Array.isArray(raw.expanded)) throw new Error('"expanded" must be an array');
    for (const slug of raw.expanded) {
      if (typeof slug !== "string") throw new Error('"expanded" entries must be strings');
    }
    spec.expanded = raw.expanded as string[];
  }

  // labels
  if (raw.labels !== undefined) {
    if (!raw.labels || typeof raw.labels !== "object" || Array.isArray(raw.labels)) {
      throw new Error('"labels" must be a map');
    }
    const labels: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.labels as Record<string, unknown>)) {
      if (typeof v !== "string") throw new Error(`labels.${k} must be a string`);
      labels[k] = v;
    }
    spec.labels = labels;
  }

  // graph
  if (raw.graph !== undefined) {
    if (!raw.graph || typeof raw.graph !== "object" || Array.isArray(raw.graph)) {
      throw new Error('"graph" must be an object');
    }
    const g = raw.graph as Record<string, unknown>;
    const graph: GraphSpec = {};

    if (g.nodes !== undefined) {
      if (!g.nodes || typeof g.nodes !== "object" || Array.isArray(g.nodes)) {
        throw new Error("graph.nodes must be a map");
      }
      const nodes: Record<string, GraphNode> = {};
      for (const [slug, val] of Object.entries(g.nodes as Record<string, unknown>)) {
        if (!val || typeof val !== "object" || Array.isArray(val)) {
          throw new Error(`Invalid graph node "${slug}": expected an object with "type"`);
        }
        const obj = val as Record<string, unknown>;
        if (typeof obj.type !== "string") {
          throw new Error(`Invalid graph node "${slug}": "type" must be a string`);
        }
        nodes[slug] = obj as GraphNode;
      }
      graph.nodes = nodes;
    }

    if (g.edges !== undefined) {
      if (!g.edges || typeof g.edges !== "object" || Array.isArray(g.edges)) {
        throw new Error("graph.edges must be a map");
      }
      const edges: Record<string, GraphEdgeMap> = {};
      for (const [relName, relMap] of Object.entries(g.edges as Record<string, unknown>)) {
        if (!relMap || typeof relMap !== "object" || Array.isArray(relMap)) {
          throw new Error(`Invalid graph edge "${relName}": expected a map`);
        }
        const edgeMap: GraphEdgeMap = {};
        for (const [src, tgt] of Object.entries(relMap as Record<string, unknown>)) {
          if (typeof tgt === "string") {
            edgeMap[src] = tgt;
          } else if (Array.isArray(tgt) && tgt.every(t => typeof t === "string")) {
            edgeMap[src] = tgt as string[];
          } else {
            throw new Error(`Invalid graph edge "${relName}.${src}": target must be string or string[]`);
          }
        }
        edges[relName] = edgeMap;
      }
      graph.edges = edges;
    }

    spec.graph = graph;
  }

  // chrome
  if (raw.chrome !== undefined) {
    if (!raw.chrome || typeof raw.chrome !== "object" || Array.isArray(raw.chrome)) {
      throw new Error('"chrome" must be a map');
    }
    const chrome: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(raw.chrome as Record<string, unknown>)) {
      if (!VALID_CHROME_KEYS.has(k)) {
        throw new Error(`Unknown chrome key: "${k}". Expected: ${[...VALID_CHROME_KEYS].join(", ")}`);
      }
      if (typeof v !== "boolean") {
        throw new Error(`Invalid chrome value for ${k}: expected boolean`);
      }
      chrome[k] = v;
    }
    spec.chrome = chrome as ChromeOverrides;
  }

  // conventions
  if (raw.conventions !== undefined) {
    if (!raw.conventions || typeof raw.conventions !== "object" || Array.isArray(raw.conventions)) {
      throw new Error('"conventions" must be a map');
    }
    const conventions: Partial<Record<ConventionCheck, ConventionSeverity | "off">> = {};
    for (const [k, v] of Object.entries(raw.conventions as Record<string, unknown>)) {
      if (!VALID_CHECKS.has(k)) {
        throw new Error(`Unknown convention check: "${k}". Expected: ${[...VALID_CHECKS].join(", ")}`);
      }
      if (typeof v !== "string" || !VALID_SEVERITY.has(v)) {
        throw new Error(`Invalid severity for ${k}: "${v}". Expected: ${[...VALID_SEVERITY].join(", ")}`);
      }
      conventions[k as ConventionCheck] = v as ConventionSeverity | "off";
    }
    spec.conventions = conventions;
  }

  return spec;
}

/** Parse a single nav item from raw YAML output. */
function parseNavItem(raw: unknown, path: string): NavItem {
  if (typeof raw === "string") return raw;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;

    if ("group" in obj) {
      if (typeof obj.group !== "string") throw new Error(`${path}.group: expected string`);
      return { group: obj.group };
    }

    if ("url" in obj) {
      if (typeof obj.url !== "string") throw new Error(`${path}.url: expected string`);
      if (typeof obj.title !== "string") throw new Error(`${path}.title: required when url is present`);
      return { url: obj.url, title: obj.title } as NavLink;
    }

    const entries = Object.entries(obj);
    if (entries.length !== 1) {
      throw new Error(`${path}: nav item object must have exactly one key, got ${entries.length}`);
    }
    const [key, val] = entries[0];

    if (Array.isArray(val)) {
      return { [key]: val.map((item, i) => parseNavItem(item, `${path}.${key}[${i}]`)) };
    }

    throw new Error(`${path}.${key}: expected array of nav items`);
  }

  throw new Error(`${path}: expected string or object, got ${typeof raw}`);
}
