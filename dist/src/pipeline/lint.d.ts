/**
 * LINT Stage — Validate YAML spec
 *
 * Takes raw YAML string → validates structure + semantics
 * Returns { schema, result } where result contains any errors/warnings
 */
import type { PageSchema, ValidationResult } from "../types.js";
export interface LintOutput {
    schema: PageSchema;
    result: ValidationResult;
}
/**
 * Parse and validate a YAML spec string
 * Always returns both the schema and validation result
 * Validation is advisory mode — errors don't block rendering
 */
export declare function lint(yamlContent: string): LintOutput;
//# sourceMappingURL=lint.d.ts.map