import { ContentSection, RenderOptions } from "../types.js";
import { marked } from "marked";
import { renderSection } from "../templates/base.js";
import { defaultThemeSpec } from "../theme.js";

/**
 * Render a content section
 */
export function renderContent(section: ContentSection, options: RenderOptions = {}): string {
  const variant = section.variant || "prose";
  const theme = options.theme || defaultThemeSpec;
  
  let htmlContent = "";
  
  if (section.markdown) {
    htmlContent = marked.parse(section.markdown) as string;
  } else if (section.html) {
    htmlContent = section.html;
  }

  const widthClasses = {
    prose: "max-w-3xl",
    narrow: "max-w-2xl",
    wide: "max-w-5xl",
  };

  const content = `
    <div class="${widthClasses[variant]} mx-auto prose prose-lg prose-blue">
      ${htmlContent}
    </div>
  `;

  return renderSection(content, {
    id: section.id,
    spacing: "lg",
    theme,
  });
}
