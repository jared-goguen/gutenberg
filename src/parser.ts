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
    };
    normalized.variant = defaultVariants[normalized.type] || "default";
  }

  // Set default semantic axes (all optional, these are sensible defaults)
  if (!normalized.vibe) {
    normalized.vibe = "steady";
  }
  if (!normalized.intent) {
    // Smart default based on component type
    const defaultIntents: Record<string, string> = {
      hero: "engage",
      cta: "direct",
      features: "inform",
      content: "inform",
      navigation: "inform",
      footer: "inform",
    };
    normalized.intent = defaultIntents[normalized.type] || "inform";
  }
  if (!normalized.narrative) {
    normalized.narrative = "rising";  // Most common position
  }
  if (!normalized.cohesion) {
    normalized.cohesion = "continues";  // Most natural flow
  }

  return normalized;
}
