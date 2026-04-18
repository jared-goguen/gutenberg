import { PageSchema } from "./types.js";
/**
 * Parse YAML string or object into PageSchema
 */
export declare function parseSchema(input: string | Record<string, any>): PageSchema;
/**
 * Normalize section data and set defaults
 */
export declare function normalizeSection(section: any): any;
//# sourceMappingURL=parser.d.ts.map