import { PageSchema, Section, ValidationResult, ValidationError, ComponentType } from "./types.js";

const VALID_COMPONENT_TYPES: ComponentType[] = [
  "hero",
  "features",
  "content",
  "cta",
  "navigation",
  "footer",
  "testimonials",
  "pricing",
  "faq",
  "contact",
  "gallery",
];

/**
 * Validate a PageSchema and return detailed validation results
 */
export function validateSchema(schema: PageSchema): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

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
  } else {
    warnings.push("Consider adding page metadata for better SEO");
  }

  // Validate sections
  if (!schema.page.sections || schema.page.sections.length === 0) {
    errors.push({
      path: "page.sections",
      message: "Page must have at least one section",
    });
  } else {
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
export function validateSection(section: Section, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
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
      } else {
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
      } else if (section.items.length === 0) {
        errors.push({
          path: `${path}.items`,
          message: "Features section must have at least one item",
        });
      } else {
        section.items.forEach((item: any, i: number) => {
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

    case "footer":
      // Footer is flexible, no strict requirements
      break;

    case "testimonials":
      if (!section.items || !Array.isArray(section.items)) {
        errors.push({
          path: `${path}.items`,
          message: "Testimonials section requires 'items' array",
        });
      } else {
        section.items.forEach((item: any, i: number) => {
          if (!item.quote) {
            errors.push({
              path: `${path}.items[${i}].quote`,
              message: "Testimonial requires a quote",
            });
          }
          if (!item.author) {
            errors.push({
              path: `${path}.items[${i}].author`,
              message: "Testimonial requires an author",
            });
          }
        });
      }
      break;

    case "pricing":
      if (!section.items || !Array.isArray(section.items)) {
        errors.push({
          path: `${path}.items`,
          message: "Pricing section requires 'items' array",
        });
      } else {
        section.items.forEach((item: any, i: number) => {
          if (!item.name) {
            errors.push({
              path: `${path}.items[${i}].name`,
              message: "Pricing tier requires a name",
            });
          }
          if (!item.price) {
            errors.push({
              path: `${path}.items[${i}].price`,
              message: "Pricing tier requires a price",
            });
          }
          if (!item.cta) {
            errors.push({
              path: `${path}.items[${i}].cta`,
              message: "Pricing tier requires a CTA",
            });
          }
        });
      }
      break;

    case "faq":
      if (!section.items || !Array.isArray(section.items)) {
        errors.push({
          path: `${path}.items`,
          message: "FAQ section requires 'items' array",
        });
      } else {
        section.items.forEach((item: any, i: number) => {
          if (!item.question) {
            errors.push({
              path: `${path}.items[${i}].question`,
              message: "FAQ item requires a question",
            });
          }
          if (!item.answer) {
            errors.push({
              path: `${path}.items[${i}].answer`,
              message: "FAQ item requires an answer",
            });
          }
        });
      }
      break;

    case "contact":
      // Contact form is flexible
      break;

    case "gallery":
      if (!section.items || !Array.isArray(section.items)) {
        errors.push({
          path: `${path}.items`,
          message: "Gallery section requires 'items' array",
        });
      } else {
        section.items.forEach((item: any, i: number) => {
          if (!item.image) {
            errors.push({
              path: `${path}.items[${i}].image`,
              message: "Gallery item requires an image URL",
            });
          }
          if (!item.alt) {
            errors.push({
              path: `${path}.items[${i}].alt`,
              message: "Gallery item requires alt text for accessibility",
            });
          }
        });
      }
      break;
  }

  return errors;
}
