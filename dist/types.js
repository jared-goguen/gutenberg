// Core type definitions for Gutenberg
// Type guard functions
export function isPageSchema(spec) {
    return "page" in spec && !("template" in spec);
}
export function isTemplateSchema(spec) {
    return "template" in spec && "page" in spec;
}
//# sourceMappingURL=types.js.map