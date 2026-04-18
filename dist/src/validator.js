const VALID_COMPONENT_TYPES = [
    "hero",
    "features",
    "content",
    "cta",
    "navigation",
    "footer",
    "table",
];
// Semantic axes validation
const VALID_VIBES = ["serene", "gentle", "steady", "vibrant", "intense", "urgent"];
const VALID_INTENTS = ["engage", "inform", "persuade", "direct"];
const VALID_NARRATIVES = ["exposition", "inciting", "rising", "climax", "falling", "resolution"];
const VALID_COHESIONS = ["opens", "continues", "amplifies", "supports", "contrasts", "pivots", "echoes", "resolves", "closes"];
/**
 * Validate a PageSchema and return detailed validation results
 */
export function validateSchema(schema) {
    const errors = [];
    const warnings = [];
    // Validate meta
    if (schema.page.meta) {
        if (!schema.page.meta.title) {
            errors.push({
                path: "page.meta.title",
                message: "Page title is required",
            });
        }
        if (schema.page.meta.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(schema.page.meta.language)) {
            warnings.push("Language should be a valid ISO 639-1 code (e.g., 'en', 'en-US')");
        }
    }
    else {
        warnings.push("Consider adding page metadata for better SEO");
    }
    // Validate sections
    if (!schema.page.sections || schema.page.sections.length === 0) {
        errors.push({
            path: "page.sections",
            message: "Page must have at least one section",
        });
    }
    else {
        schema.page.sections.forEach((section, index) => {
            const sectionErrors = validateSection(section, index);
            errors.push(...sectionErrors);
        });
    }
    // Check for multiple navigation sections
    const navSections = schema.page.sections.filter(s => s.type === "navigation");
    if (navSections.length > 1) {
        warnings.push("Multiple navigation sections detected. Consider using only one.");
    }
    // Check for multiple footer sections
    const footerSections = schema.page.sections.filter(s => s.type === "footer");
    if (footerSections.length > 1) {
        warnings.push("Multiple footer sections detected. Consider using only one.");
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Validate an individual section
 */
export function validateSection(section, index) {
    const errors = [];
    const path = `page.sections[${index}]`;
    // Check if type exists
    if (!section.type) {
        errors.push({
            path: `${path}.type`,
            message: "Section type is required",
        });
        return errors;
    }
    // Check if type is valid
    if (!VALID_COMPONENT_TYPES.includes(section.type)) {
        errors.push({
            path: `${path}.type`,
            message: `Invalid section type '${section.type}'. Valid types: ${VALID_COMPONENT_TYPES.join(", ")}`,
        });
        return errors;
    }
    // Type-specific validation
    switch (section.type) {
        case "hero":
            if (!section.content) {
                errors.push({
                    path: `${path}.content`,
                    message: "Hero section requires 'content' property",
                });
            }
            else {
                if (!section.content.heading) {
                    errors.push({
                        path: `${path}.content.heading`,
                        message: "Hero section requires a heading",
                    });
                }
            }
            break;
        case "features":
            if (!section.items || !Array.isArray(section.items)) {
                errors.push({
                    path: `${path}.items`,
                    message: "Features section requires 'items' array",
                });
            }
            else if (section.items.length === 0) {
                errors.push({
                    path: `${path}.items`,
                    message: "Features section must have at least one item",
                });
            }
            else {
                section.items.forEach((item, i) => {
                    if (!item.title) {
                        errors.push({
                            path: `${path}.items[${i}].title`,
                            message: "Feature item requires a title",
                        });
                    }
                    if (!item.description) {
                        errors.push({
                            path: `${path}.items[${i}].description`,
                            message: "Feature item requires a description",
                        });
                    }
                });
            }
            break;
        case "content":
            if (!section.markdown && !section.html) {
                errors.push({
                    path: `${path}`,
                    message: "Content section requires either 'markdown' or 'html' property",
                });
            }
            break;
        case "cta":
            if (!section.heading) {
                errors.push({
                    path: `${path}.heading`,
                    message: "CTA section requires a heading",
                });
            }
            if (!section.cta) {
                errors.push({
                    path: `${path}.cta`,
                    message: "CTA section requires 'cta' property",
                });
            }
            break;
        case "navigation":
            if (!section.links || !Array.isArray(section.links)) {
                errors.push({
                    path: `${path}.links`,
                    message: "Navigation section requires 'links' array",
                });
            }
            break;
        case "table":
            if (!section.label) {
                errors.push({
                    path: `${path}.label`,
                    message: "Table section requires 'label' property (e.g., BOOKKEEPING)",
                });
            }
            if (!section.cells || !Array.isArray(section.cells)) {
                errors.push({
                    path: `${path}.cells`,
                    message: "Table section requires 'cells' array",
                });
            }
            else if (section.cells.length !== 6) {
                errors.push({
                    path: `${path}.cells`,
                    message: "Table section must have exactly 6 cells",
                });
            }
            else {
                section.cells.forEach((cell, i) => {
                    if (!cell.label) {
                        errors.push({
                            path: `${path}.cells[${i}].label`,
                            message: "Cell requires a label",
                        });
                    }
                    if (cell.value === undefined || cell.value === null) {
                        errors.push({
                            path: `${path}.cells[${i}].value`,
                            message: "Cell requires a value",
                        });
                    }
                    if (!["text", "numeric", "bool"].includes(cell.type)) {
                        errors.push({
                            path: `${path}.cells[${i}].type`,
                            message: `Invalid cell type '${cell.type}'. Valid types: text, numeric, bool`,
                        });
                    }
                    if (cell.type === "numeric" && !cell["color-scale"]) {
                        errors.push({
                            path: `${path}.cells[${i}]["color-scale"]`,
                            message: "Numeric cell type requires color-scale [min, max]",
                        });
                    }
                });
            }
            break;
        case "footer":
            // Footer is flexible, no strict requirements
            break;
    }
    // Validate semantic axes (all optional, but if present must be valid)
    if (section.vibe && !VALID_VIBES.includes(section.vibe)) {
        errors.push({
            path: `${path}.vibe`,
            message: `Invalid vibe '${section.vibe}'. Valid values: ${VALID_VIBES.join(", ")}`,
        });
    }
    if (section.intent && !VALID_INTENTS.includes(section.intent)) {
        errors.push({
            path: `${path}.intent`,
            message: `Invalid intent '${section.intent}'. Valid values: ${VALID_INTENTS.join(", ")}`,
        });
    }
    if (section.narrative && !VALID_NARRATIVES.includes(section.narrative)) {
        errors.push({
            path: `${path}.narrative`,
            message: `Invalid narrative '${section.narrative}'. Valid values: ${VALID_NARRATIVES.join(", ")}`,
        });
    }
    if (section.cohesion && !VALID_COHESIONS.includes(section.cohesion)) {
        errors.push({
            path: `${path}.cohesion`,
            message: `Invalid cohesion '${section.cohesion}'. Valid values: ${VALID_COHESIONS.join(", ")}`,
        });
    }
    return errors;
}
/**
 * Validate a TemplateSchema
 */
export function validateTemplate(schema) {
    const errors = [];
    const warnings = [];
    // Validate template config
    if (!schema.template) {
        errors.push({
            path: "template",
            message: "Template configuration is required",
        });
        return { valid: false, errors, warnings };
    }
    if (!schema.template.name) {
        errors.push({
            path: "template.name",
            message: "Template name is required (e.g., 'diary', 'blog-post')",
        });
    }
    if (!schema.template.route) {
        errors.push({
            path: "template.route",
            message: "Template route is required (e.g., '/diary/[date]')",
        });
    }
    else {
        // Validate route format: /path/[param]
        const routePattern = /^\/[a-z0-9-/]*\[[a-z0-9-]+\]$/i;
        if (!routePattern.test(schema.template.route)) {
            errors.push({
                path: "template.route",
                message: "Route must match format '/path/[param]' (e.g., '/diary/[date]')",
            });
        }
    }
    if (!schema.template.routeParam) {
        errors.push({
            path: "template.routeParam",
            message: "Route parameter name is required (e.g., 'date')",
        });
    }
    else if (!/^[a-z0-9-]+$/i.test(schema.template.routeParam)) {
        errors.push({
            path: "template.routeParam",
            message: "Route parameter must be alphanumeric (e.g., 'date', 'slug')",
        });
    }
    if (!schema.template.storage || !["local", "r2"].includes(schema.template.storage)) {
        errors.push({
            path: "template.storage",
            message: "Storage must be 'local' or 'r2'",
        });
    }
    // Validate page structure (reuse page validation)
    const pageSchema = { page: schema.page };
    const pageValidation = validateSchema(pageSchema);
    if (!pageValidation.valid) {
        // Prefix page errors with "page." path
        errors.push(...pageValidation.errors.map(err => ({
            ...err,
            path: `page.${err.path}`,
        })));
    }
    warnings.push(...pageValidation.warnings);
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
//# sourceMappingURL=validator.js.map