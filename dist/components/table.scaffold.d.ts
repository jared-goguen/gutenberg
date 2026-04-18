/**
 * TABLE SCAFFOLD — Build RenderNode tree for semantic table component
 *
 * Returns RenderNode (classless) with semantic roles.
 * Stores cell metadata in attrs for enricher to compute color classes.
 * Flattens HTML structure for grid layout while preserving semantic data.
 */
import type { RenderNode } from "../scaffold/node.js";
/**
 * Scaffold a table section into a RenderNode tree
 * Structure: all cells are direct children of table-container with roles
 * Cell metadata (value, type, colorScale) stored in attrs for enricher to process
 *
 * @param section Table section data
 * @param mode 'view' (default) or 'edit' - controls if cells are rendered as inputs
 */
export declare function scaffoldTable(section: any, mode?: 'view' | 'edit'): RenderNode;
//# sourceMappingURL=table.scaffold.d.ts.map