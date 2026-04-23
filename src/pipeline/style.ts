/**
 * STYLE Stage — AnnotatedNode[] → complete HTML document
 */

import type { AnnotatedNode } from "../scaffold/node.js";
import type { PageMeta, RenderOptions } from "../types.js";
import { serializeHTMLNodes } from "../serializer.js";
import { generateInkCSS } from "../stylesheets/index.js";

export function style(
  nodes: AnnotatedNode[],
  meta: PageMeta | undefined,
  options: RenderOptions = {}
): string {
  // Validate input
  if (!Array.isArray(nodes)) {
    throw new Error(
      `Invalid STYLE input: 'nodes' must be an array of AnnotatedNode, got ${typeof nodes}`
    );
  }

  if (nodes.length === 0) {
    throw new Error(
      "Invalid STYLE input: 'nodes' array is empty. SCAFFOLD stage must produce at least one node."
    );
  }

  // Validate options
  if (options.indentSize !== undefined && (typeof options.indentSize !== "number" || options.indentSize < 0)) {
    throw new Error(
      `Invalid STYLE option: 'indentSize' must be a non-negative number, got ${options.indentSize}`
    );
  }

  const mode = options.mode || 'view';
  const css = generateInkCSS();

  try {
    const bodyHTML = serializeHTMLNodes(nodes, {
      minify: options.minify,
      indentSize: options.indentSize,
    });

    // Add edit button or wrap in form based on mode
    const finalBodyHTML = mode === 'edit' 
      ? wrapInForm(bodyHTML)
      : addEditButton(bodyHTML);

    const title = (meta?.title && String(meta.title)) || "Untitled";
    const description = (meta?.description && String(meta.description)) || "";
    const language = (meta?.language && String(meta.language)) || "en";

    return `<!DOCTYPE html>
<html lang="${escapeHTML(language)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  ${description ? `<meta name="description" content="${escapeHTML(description)}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap" rel="stylesheet">
  <style>
${css}
${mode === 'edit' ? getEditModeCSS() : ''}
  </style>
</head>
<body>
${finalBodyHTML}
</body>
</html>`;
  } catch (error) {
    throw new Error(
      `Failed to serialize nodes to HTML: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function wrapInForm(bodyHTML: string): string {
  return `<form method="POST" action="?mode=save" class="edit-form">
  ${bodyHTML}
  <div class="edit-actions">
    <button type="submit" class="btn-save">Save & Publish</button>
    <a href="?" class="btn-cancel">Cancel</a>
  </div>
</form>`;
}

function addEditButton(bodyHTML: string): string {
  return bodyHTML + `
<div class="edit-button-fixed">
  <a href="?mode=edit" class="btn-edit">Edit This Page</a>
</div>`;
}

function getEditModeCSS(): string {
  return `
/* Edit mode UI */
.edit-form {
  position: relative;
}
.edit-actions {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  gap: 1rem;
  background: rgba(0,0,0,0.9);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  z-index: 1000;
}
.btn-save {
  background: #e63946;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-save:hover {
  background: #d62828;
}
.btn-cancel {
  padding: 0.75rem 1.5rem;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
}
.edit-button-fixed {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}
.btn-edit {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: rgba(0,0,0,0.8);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.2);
  font-weight: 600;
  transition: background 0.2s;
}
.btn-edit:hover {
  background: rgba(0,0,0,0.95);
}
/* Edit mode — hidden sections */
.gb-edit-hidden {
  display: none;
}
/* Edit mode — text input (hero heading, text table cells) */
.gb-input-text {
  width: 100%;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  letter-spacing: inherit;
  padding: 0.5rem;
  border-radius: 4px;
}
/* Edit mode — textarea (content markdown) */
.gb-input-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 0.875rem;
  border-radius: 4px;
  resize: vertical;
  line-height: 1.6;
}
/* Edit mode — number input (table numeric cells) */
.gb-input-number {
  width: 100%;
  padding: 0.35rem 0.3rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  text-align: center;
  font-weight: 700;
  border-radius: 2px;
  font-size: 0.75rem;
}
/* Edit mode — checkbox (table bool cells) */
.gb-input-checkbox {
  width: 24px;
  height: 24px;
  cursor: pointer;
}
`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
