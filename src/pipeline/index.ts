/**
 * Gutenberg Pipeline — individual stage exports
 *
 * Each stage is a pure function: lint → scaffold → enrich → style
 * Use them individually or chain them in any order.
 */

export { lint } from "./lint.js";
export { scaffold } from "./scaffold.js";
export { editify } from "./editify.js";
export { enrich } from "./enrich.js";
export { style } from "./style.js";
export type { LintOutput } from "./lint.js";
