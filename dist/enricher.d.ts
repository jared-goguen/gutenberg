/**
 * ENRICH stage — walks RenderNode tree, resolves class names
 *
 * Converts RenderNode (classless) to AnnotatedNode (with classes)
 *
 * Classes are resolved from three independent sources:
 * 1. role → semantic component class (hero-heading, btn-primary, feature-card)
 * 2. layout → structural classes (layout-3col, width-narrow, align-center)
 * 3. semantic axes → modifier classes (vibe-vibrant, intent-engage, etc.)
 */
import type { RenderNode, AnnotatedNode } from "./scaffold/node.js";
/**
 * Enrich an array of RenderNode trees to AnnotatedNode trees
 */
export declare function enrichRenderNodes(nodes: RenderNode[]): AnnotatedNode[];
/**
 * Enrich a single RenderNode
 */
export declare function enrichRenderNode(node: RenderNode): AnnotatedNode;
//# sourceMappingURL=enricher.d.ts.map