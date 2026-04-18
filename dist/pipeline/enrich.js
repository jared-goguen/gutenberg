/**
 * ENRICH Stage — RenderNode[] → AnnotatedNode[]
 *
 * Walks RenderNode trees and resolves class names from:
 * - Semantic roles (hero-heading, btn-primary)
 * - Layout hints (grid-3, width-narrow)
 * - Semantic axes (vibe-vibrant, intent-engage)
 */
import { enrichRenderNodes } from "../enricher.js";
/**
 * Enrich render nodes by resolving all class names
 */
export function enrich(nodes) {
    return enrichRenderNodes(nodes);
}
/**
 * Enrich a single render node
 */
export function enrichNode(node) {
    return enrichRenderNodes([node])[0];
}
//# sourceMappingURL=enrich.js.map