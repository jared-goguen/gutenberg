/**
 * Scaffold intermediate types
 *
 * SCAFFOLD stage produces RenderNode trees (classless HTML structure)
 * ENRICH stage consumes RenderNode, produces AnnotatedNode (with classes)
 * STYLE stage consumes AnnotatedNode, produces HTML string with CSS
 */
/**
 * Helper to create a RenderNode
 */
export function createNode(tag, options = {}) {
    return {
        tag,
        role: options.role,
        attrs: options.attrs || {},
        layout: options.layout,
        semantic: options.semantic,
        rawHtml: options.rawHtml,
        children: options.children || [],
    };
}
/**
 * Type guard: is this an AnnotatedNode?
 */
export function isAnnotatedNode(node) {
    return 'classes' in node && Array.isArray(node.classes);
}
//# sourceMappingURL=node.js.map