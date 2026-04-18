/**
 * Scaffold intermediate types
 *
 * SCAFFOLD stage produces RenderNode trees (classless HTML structure)
 * ENRICH stage consumes RenderNode, produces AnnotatedNode (with classes)
 * STYLE stage consumes AnnotatedNode, produces HTML string with CSS
 */
import type { Vibe, Intent, Narrative, Cohesion } from "../types.js";
/**
 * Semantic axes for a section
 */
export interface SemanticAxes {
    vibe: Vibe;
    intent: Intent;
    narrative: Narrative;
    cohesion: Cohesion;
}
/**
 * RenderNode — output of SCAFFOLD stage
 * Pure HTML structure with no class attributes.
 *
 * Carries:
 * - HTML structure (tag, attrs, children)
 * - Semantic roles (role: 'hero-heading', 'btn-primary')
 * - Layout hints (variant, width, columns)
 * - Semantic axes (on section roots only)
 *
 * Does NOT carry: class names, inline styles, or CSS decisions
 */
export interface RenderNode {
    tag: string;
    role?: string;
    attrs: Record<string, string>;
    layout?: Record<string, string>;
    semantic?: SemanticAxes;
    rawHtml?: string;
    children: (RenderNode | string)[];
}
/**
 * AnnotatedNode — output of ENRICH stage
 * RenderNode with classes resolved and added.
 *
 * Same structure, but now includes classes: string[] resolved from:
 * - role → semantic component class ('hero-heading')
 * - layout → structural classes ('layout-3col', 'width-narrow')
 * - semantic axes → modifier classes ('vibe-vibrant', 'intent-engage')
 */
export interface AnnotatedNode extends RenderNode {
    classes: string[];
    children: (AnnotatedNode | string)[];
}
/**
 * Helper to create a RenderNode
 */
export declare function createNode(tag: string, options?: {
    role?: string;
    attrs?: Record<string, string>;
    layout?: Record<string, string>;
    semantic?: SemanticAxes;
    rawHtml?: string;
    children?: (RenderNode | string)[];
}): RenderNode;
/**
 * Type guard: is this an AnnotatedNode?
 */
export declare function isAnnotatedNode(node: RenderNode | AnnotatedNode): node is AnnotatedNode;
//# sourceMappingURL=node.d.ts.map