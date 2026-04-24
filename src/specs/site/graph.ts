/**
 * Graph resolution — build bidirectional indexes from GraphSpec.
 */

import type { SiteSpec, GraphNode, ResolvedGraph } from "./types.js";

/**
 * Resolve a GraphSpec into bidirectional indexes.
 *
 * Builds:
 *   - forward index: edge type → source → targets
 *   - reverse index: edge type → target → sources
 *   - type cohorts:  type name → node slugs
 *
 * Returns an empty graph if spec has no graph field.
 */
export function resolveGraph(spec: SiteSpec): ResolvedGraph {
  const nodes = new Map<string, GraphNode>();
  const forward = new Map<string, Map<string, string[]>>();
  const reverse = new Map<string, Map<string, string[]>>();
  const types = new Map<string, string[]>();

  if (!spec.graph) return { nodes, forward, reverse, types };

  if (spec.graph.nodes) {
    for (const [slug, node] of Object.entries(spec.graph.nodes)) {
      nodes.set(slug, node);
      const cohort = types.get(node.type) ?? [];
      cohort.push(slug);
      types.set(node.type, cohort);
    }
  }

  if (spec.graph.edges) {
    for (const [relName, edgeMap] of Object.entries(spec.graph.edges)) {
      const fwd = new Map<string, string[]>();
      const rev = new Map<string, string[]>();

      for (const [src, tgt] of Object.entries(edgeMap)) {
        const targets = Array.isArray(tgt) ? tgt : [tgt];
        fwd.set(src, targets);

        for (const target of targets) {
          const sources = rev.get(target) ?? [];
          sources.push(src);
          rev.set(target, sources);
        }
      }

      forward.set(relName, fwd);
      reverse.set(relName, rev);
    }
  }

  return { nodes, forward, reverse, types };
}
