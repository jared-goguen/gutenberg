/**
 * LINT Stage — Validate YAML spec
 *
 * Takes raw YAML string → validates structure + semantics
 * Returns { schema, result } where result contains any errors/warnings
 */
import { parseSchema } from "../parser.js";
import { validateSchema } from "../validator.js";
/**
 * Parse and validate a YAML spec string
 * Always returns both the schema and validation result
 * Validation is advisory mode — errors don't block rendering
 */
export function lint(yamlContent) {
    const schema = parseSchema(yamlContent);
    const result = validateSchema(schema);
    return {
        schema,
        result,
    };
}
//# sourceMappingURL=lint.js.map