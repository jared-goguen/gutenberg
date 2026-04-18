import { PageSchema, TemplateSchema, Section, ValidationResult, ValidationError } from "./types.js";
/**
 * Validate a PageSchema and return detailed validation results
 */
export declare function validateSchema(schema: PageSchema): ValidationResult;
/**
 * Validate an individual section
 */
export declare function validateSection(section: Section, index: number): ValidationError[];
/**
 * Validate a TemplateSchema
 */
export declare function validateTemplate(schema: TemplateSchema): ValidationResult;
//# sourceMappingURL=validator.d.ts.map