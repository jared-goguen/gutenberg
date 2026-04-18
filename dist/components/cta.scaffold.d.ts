/**
 * CTA (Call-to-Action) scaffolding
 *
 * Converts CtaData to RenderNode tree (classless HTML structure)
 */
import type { RenderNode } from "../scaffold/node.js";
import type { CtaData } from "./cta.data.js";
/**
 * Scaffold CTA section into RenderNode tree
 *
 * Structure varies by variant:
 * - centered: vertical stack, centered alignment, all buttons stacked vertically
 * - split: two-column layout, text left, buttons right
 * - banner: full-width dark section with white text, buttons inline
 */
export declare function scaffoldCta(data: CtaData): RenderNode;
//# sourceMappingURL=cta.scaffold.d.ts.map