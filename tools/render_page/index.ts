import { parseSchema } from "../../src/parser.js";
import { normalizeSection } from "../../src/parser.js";
import { renderSections } from "../../src/components/index.js";
import { applyLayout } from "../../src/templates/layouts.js";
import { renderDocument } from "../../src/templates/base.js";
import { resolveTheme, defaultTheme } from "../../src/theme.js";
import type { RenderOptions } from "../../src/types.js";

export async function renderPage(input: {
  schema: string | Record<string, unknown>;
  options?: RenderOptions;
}) {
  const page = parseSchema(input.schema);
  
  // Resolve theme from schema or options
  const themeSpec = input.options?.theme || page.page.layout?.theme;
  const resolvedTheme = resolveTheme(typeof themeSpec === "string" ? themeSpec : undefined);
  
  const options: RenderOptions = {
    minify: input.options?.minify ?? false,
    includeComments: input.options?.includeComments ?? true,
    tailwindCDN: input.options?.tailwindCDN ?? true,
    indentSize: input.options?.indentSize ?? 2,
    theme: resolvedTheme,
  };

  // Normalize all sections first
  const normalizedSections = page.page.sections.map(normalizeSection);

  // Render with semantic context (handles prev/next relationships)
  const sectionsHTML = renderSections(normalizedSections, options);

  const body = applyLayout(sectionsHTML, page.page.layout, resolvedTheme);

  const html = renderDocument(page.page.meta, body, options);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ html }),
    }],
  };
}
