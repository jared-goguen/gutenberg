import { parseSchema } from "../../src/parser.js";
import { normalizeSection } from "../../src/parser.js";
import { renderSection } from "../../src/components/index.js";
import { applyLayout } from "../../src/templates/layouts.js";
import { renderDocument } from "../../src/templates/base.js";
import type { RenderOptions } from "../../src/types.js";

export async function renderPage(input: {
  schema: string | Record<string, unknown>;
  options?: RenderOptions;
}) {
  const options: RenderOptions = {
    minify: input.options?.minify ?? false,
    includeComments: input.options?.includeComments ?? true,
    tailwindCDN: input.options?.tailwindCDN ?? true,
    indentSize: input.options?.indentSize ?? 2,
  };

  const page = parseSchema(input.schema);

  const sectionsHTML = page.page.sections
    .map(normalizeSection)
    .map(section => renderSection(section, options))
    .join("\n");

  const body = applyLayout(sectionsHTML, page.page.layout);

  const html = renderDocument(page.page.meta, body, options);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ html }),
    }],
  };
}
