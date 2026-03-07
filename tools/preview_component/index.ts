import { renderSection } from "../../src/components/index.js";
import { renderDocument } from "../../src/templates/base.js";
import { RenderOptions } from "../../src/types.js";

export async function previewComponent(input: {
  section: Record<string, any>;
  options?: RenderOptions;
}) {
  try {
    // Render options
    const options: RenderOptions = {
      minify: input.options?.minify || false,
      includeComments: input.options?.includeComments !== false,
      tailwindCDN: input.options?.tailwindCDN !== false,
      indentSize: input.options?.indentSize || 2,
    };

    // Render the section
    const sectionHTML = renderSection(input.section, options);

    // Wrap in a minimal document for preview
    const html = renderDocument(
      {
        title: `Preview: ${input.section.type}`,
        description: `Component preview for ${input.section.type}`,
      },
      sectionHTML,
      options
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ html }, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error.message,
          stack: error.stack,
        }, null, 2),
      }],
    };
  }
}
