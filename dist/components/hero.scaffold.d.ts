/**
 * Hero scaffolding
 *
 * Converts HeroData to RenderNode tree (classless HTML structure)
 */
import type { RenderNode } from "../scaffold/node.js";
import type { HeroData } from "./hero.data.js";
/**
 * Scaffold hero section into RenderNode tree
 *
 * Structure varies by variant:
 * - centered: vertical stack, content centered, image below
 * - split: two-column grid, text left, image right (reverses on mobile)
 * - full-bleed: full-width background with centered overlay
 *
 * @param data Hero data
 * @param mode 'view' (default) or 'edit' - controls if heading is editable
 * @param section Original section object (contains _editable flag)
 */
export declare function scaffoldHero(data: HeroData, mode?: 'view' | 'edit', section?: any): RenderNode;
//# sourceMappingURL=hero.scaffold.d.ts.map