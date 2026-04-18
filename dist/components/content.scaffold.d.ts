/**
 * Content scaffolding (prose, narrow, wide variants)
 *
 * Converts ContentData to RenderNode tree
 */
import type { RenderNode } from "../scaffold/node.js";
import type { ContentData } from "./content.data.js";
/**
 * Scaffold content section into RenderNode tree
 *
 * Structure:
 * - Section root with variant layout
 * - Width-constrained container (prose/narrow/standard/wide)
 * - Content div with prose role containing markdown or html
 *
 * @param data Content data
 * @param mode 'view' (default) or 'edit' - controls if markdown is editable
 * @param section Original section object (contains _editable flag)
 */
export declare function scaffoldContent(data: ContentData, mode?: 'view' | 'edit', section?: any): RenderNode;
//# sourceMappingURL=content.scaffold.d.ts.map