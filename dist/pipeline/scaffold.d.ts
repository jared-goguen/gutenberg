/**
 * SCAFFOLD Stage — PageSchema → RenderNode[]
 *
 * Converts a page schema into a tree of RenderNode structures (classless HTML)
 * Each section is scaffolded according to its type
 */
import type { PageSchema } from "../types.js";
import type { RenderNode } from "../scaffold/node.js";
/**
 * Scaffold a page schema into RenderNode tree
 *
 * Returns an array of section RenderNodes, one per page section.
 * Each RenderNode has semantic axes attached (for ENRICH stage to read).
 *
 * For docs layout: nav → left sidebar, content → main, auto-TOC → right sidebar.
 * Three-column shell: docs-sidebar | docs-main | docs-sidebar-right
 *
 * @param schema The page schema to scaffold
 * @param mode 'view' (default) or 'edit' - determines if components scaffold as inputs or display elements
 */
export declare function scaffold(schema: PageSchema, mode?: 'view' | 'edit'): RenderNode[];
//# sourceMappingURL=scaffold.d.ts.map