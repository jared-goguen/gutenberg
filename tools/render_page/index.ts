import { parseSchema } from "../../src/parser.js";
import { normalizeSection } from "../../src/parser.js";
import { renderSections } from "../../src/components/index.js";
import { applyLayout } from "../../src/templates/layouts.js";
import { renderDocument } from "../../src/templates/base.js";
import { resolveTheme } from "../../src/theme.js";
import type { RenderOptions } from "../../src/types.js";
import { promises as fs } from "fs";
import { basename, dirname, join } from "path";

export async function handler(input: Record<string, unknown>) {
  const spec_path = input.spec_path as string;
  const output_dir = (input.output_dir as string) || join(dirname(dirname(spec_path)), "rendered");

  if (!spec_path) {
    throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
  }

  // Read the schema from the file
  const schemaContent = await fs.readFile(spec_path, "utf8");
  const page = parseSchema(schemaContent);
  
  // Resolve theme from schema
  const themeSpec = page.page.layout?.theme;
  const resolvedTheme = resolveTheme(typeof themeSpec === "string" ? themeSpec : undefined);
  
  const renderOptions: RenderOptions = {
    minify: false,
    includeComments: false,
    indentSize: 2,
    theme: resolvedTheme,
  };

  // Normalize all sections first
  const normalizedSections = page.page.sections.map(normalizeSection);

  // Render with semantic context (handles prev/next relationships)
  const sectionsHTML = renderSections(normalizedSections, renderOptions);

  const body = applyLayout(sectionsHTML, page.page.layout, resolvedTheme);

  const html = renderDocument(page.page.meta, body, renderOptions);

  // Write HTML to disk
  await fs.mkdir(output_dir, { recursive: true });
  
  // Derive output filename from input spec (strip .yaml, add .html)
  const specName = basename(spec_path, ".yaml");
  const html_path = join(output_dir, `${specName}.html`);
  
  await fs.writeFile(html_path, html, "utf8");

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ html_path }),
    }],
  };
}
