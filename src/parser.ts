import { parse } from "yaml";
import { PageSchema } from "./types.js";

/**
 * Parse YAML string or object into PageSchema
 */
export function parseSchema(input: string | Record<string, any>): PageSchema {
  let data: any;

  if (typeof input === "string") {
    try {
      data = parse(input);
    } catch (error: any) {
      throw new Error(`YAML parsing error: ${error.message}`);
    }
  } else {
    data = input;
  }

  // Validate basic structure
  if (!data || typeof data !== "object") {
    throw new Error("Schema must be an object");
  }

  if (!data.page) {
    throw new Error("Schema must have a 'page' property");
  }

  if (!data.page.sections || !Array.isArray(data.page.sections)) {
    throw new Error("Page must have a 'sections' array");
  }

  return data as PageSchema;
}

/**
 * Normalize section data and set defaults
 */
export function normalizeSection(section: any): any {
  const normalized = { ...section };

  // Set default variants based on component type
  if (!normalized.variant) {
    const defaultVariants: Record<string, string> = {
      hero: "centered",
      features: "grid-3",
      content: "prose",
      cta: "centered",
      navigation: "default",
      footer: "simple",
      testimonials: "grid",
      pricing: "cards",
      faq: "accordion",
      contact: "form",
      gallery: "grid",
    };
    normalized.variant = defaultVariants[normalized.type] || "default";
  }

  return normalized;
}
