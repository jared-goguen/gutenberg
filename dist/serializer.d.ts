/**
 * Serializer — converts AnnotatedNode tree to HTML string
 *
 * Walks the tree and produces indented, self-contained HTML with
 * no external dependencies
 */
import type { AnnotatedNode } from "./scaffold/node.js";
interface SerializeOptions {
    minify?: boolean;
    indentSize?: number;
    includeComments?: boolean;
}
/**
 * Serialize an AnnotatedNode tree to HTML string
 */
export declare function serializeHTML(node: AnnotatedNode | string, options?: SerializeOptions): string;
/**
 * Serialize multiple root nodes
 */
export declare function serializeHTMLNodes(nodes: (AnnotatedNode | string)[], options?: SerializeOptions): string;
export {};
//# sourceMappingURL=serializer.d.ts.map