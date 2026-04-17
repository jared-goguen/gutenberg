/**
 * Content scaffolding (prose, narrow, wide variants)
 * 
 * Converts ContentData to RenderNode tree
 */

import { marked } from "marked";
import type { RenderNode } from "../scaffold/node.js";
import type { ContentData } from "./content.data.js";
import { createNode } from "../scaffold/node.js";

/**
 * Scaffold content section into RenderNode tree
 * 
 * Structure:
 * - Section root with variant layout
 * - Width-constrained container (prose/narrow/standard/wide)
 * - Content div with prose role containing markdown or html
 * 
 * @param data Content data
 * @param mode 'view' (default) or 'edit' - controls if markdown is editable
 * @param section Original section object (contains _editable flag)
 */
export function scaffoldContent(data: ContentData, mode: 'view' | 'edit' = 'view', section?: any): RenderNode {
  // In edit mode, render as textarea if editable
  if (mode === 'edit' && section?._editable === true) {
    return scaffoldContentEdit(data);
  }

  // View mode - standard rendering
  return scaffoldContentView(data);
}

function scaffoldContentView(data: ContentData): RenderNode {
  // Map variant to width constraint
  const widthMap: Record<string, string> = {
    prose: "narrow",
    narrow: "narrow",
    wide: "wide",
  };
  
  const width = widthMap[data.variant] || "standard";
  
  // Parse markdown to HTML (or use raw HTML if provided)
  let htmlContent: string;
  
  if (data.markdown) {
    htmlContent = marked.parse(data.markdown) as string;
  } else if (data.html) {
    htmlContent = data.html;
  } else {
    htmlContent = "";
  }
  
  return createNode("section", {
    role: "section-root",
    layout: { variant: data.variant },
    children: [
      createNode("div", {
        layout: { width, align: "left" },
        children: [
          createNode("div", {
            role: "content-prose",
            rawHtml: htmlContent,
          }),
        ],
      }),
    ],
  });
}

function scaffoldContentEdit(data: ContentData): RenderNode {
  return createNode("section", {
    role: "section-root",
    layout: { variant: data.variant },
    children: [
      createNode("div", {
        layout: { width: "narrow", align: "left" },
        children: [
          createNode("textarea", {
            attrs: {
              name: "content__markdown",
              rows: "15",
              class: "content-markdown-input",
            },
            children: [data.markdown || ''],
          }),
        ],
      }),
    ],
  });
}
