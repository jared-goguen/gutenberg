/**
 * ENRICH Stage — RenderNode[] → AnnotatedNode[]
 *
 * Walks RenderNode trees and resolves class names from:
 * - Semantic roles (hero-heading, btn-primary)
 * - Layout hints (grid-3, width-narrow)
 * - Semantic axes (vibe-vibrant, intent-engage)
 */
import type { RenderNode, AnnotatedNode } from "../scaffold/node.js";
/**
 * Enrich render nodes by resolving all class names
 */
export declare function enrich(nodes: RenderNode[]): AnnotatedNode[];
/**
 * Enrich a single render node
 */
export declare function enrichNode(node: RenderNode): AnnotatedNode;
//# sourceMappingURL=enrich.d.ts.map