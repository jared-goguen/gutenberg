import { renderSectionWithoutContext } from "../../src/components/index.js";
import { renderDocument } from "../../src/templates/base.js";
import { RenderOptions } from "../../src/types.js";
import { resolveTheme } from "../../src/theme.js";

export async function previewComponent(input: {
  section: Record<string, any>;
  options?: RenderOptions;
}) {
  try {
    // Resolve theme
    const resolvedTheme = resolveTheme(input.options?.theme);

    // Render options
    const options: RenderOptions = {
      minify: input.options?.minify || false,
      includeComments: input.options?.includeComments !== false,
      tailwindCDN: input.options?.tailwindCDN !== false,
      indentSize: input.options?.indentSize || 2,
      theme: resolvedTheme,
    };

    // Render the section (without page context - uses defaults for semantic axes)
    const sectionHTML = renderSectionWithoutContext(input.section, options);

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
