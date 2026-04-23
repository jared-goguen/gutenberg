/**
 * EDITIFY Stage — post-scaffold transform for edit mode
 *
 * Runs between SCAFFOLD and ENRICH. Replaces editable sections with
 * form input nodes using proper roles that ENRICH can resolve to CSS classes.
 *
 * Components never know about edit mode — editify owns it centrally.
 *
 * Field naming convention: `section_{index}__{field}`
 * This ensures uniqueness even when multiple sections share the same type.
 */

import type { PageSchema, Section, TableSection, HeroSection, ContentSection } from "../types.js";
import type { RenderNode } from "../scaffold/node.js";
import { createNode } from "../scaffold/node.js";

/**
 * Transform scaffold output for edit mode.
 *
 * For each section with `_editable: true`, the view-mode RenderNode is replaced
 * with an edit-mode tree that uses `editable-*` roles. Non-editable sections
 * and unsupported component types pass through unchanged.
 *
 * Navigation sections are hidden in edit mode.
 *
 * @param nodes  RenderNode[] from scaffold (parallel with schema.page.sections for standard layout)
 * @param schema The page schema — used to read section data and detect layout type
 */
export function editify(nodes: RenderNode[], schema: PageSchema): RenderNode[] {
  // Edit mode doesn't apply to docs layout (nodes aren't 1:1 with sections)
  if (schema.page.layout?.type === "docs") return nodes;

  const sections = schema.page.sections;

  return nodes.map((node, i) => {
    const section = sections[i];
    if (!section) return node;

    // Hide navigation in edit mode
    if (section.type === "navigation") {
      return createNode("div", {
        role: "edit-hidden",
        attrs: { "aria-hidden": "true" },
        children: [],
      });
    }

    // Only transform editable sections
    if (!section._editable) return node;

    const editNode = buildEditNode(section, i);
    if (!editNode) return node;

    // Preserve semantic axes from the original scaffold output
    editNode.semantic = node.semantic;
    return editNode;
  });
}

/**
 * Build an edit-mode RenderNode for a section.
 * Returns null for unsupported component types (they pass through as view-mode).
 */
function buildEditNode(section: Section, index: number): RenderNode | null {
  switch (section.type) {
    case "hero":
      return buildHeroEdit(section as HeroSection, index);
    case "content":
      return buildContentEdit(section as ContentSection, index);
    case "table":
      return buildTableEdit(section as TableSection, index);
    default:
      return null;
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function buildHeroEdit(section: HeroSection, index: number): RenderNode {
  const heading = section.content?.heading ?? "";

  return createNode("section", {
    role: "section-root",
    children: [
      createNode("div", {
        layout: { width: "narrow", align: "left" },
        children: [
          createNode("input", {
            role: "editable-text",
            attrs: {
              type: "text",
              name: `section_${index}__heading`,
              value: heading,
              placeholder: "Heading…",
            },
          }),
        ],
      }),
    ],
  });
}

// ── Content ───────────────────────────────────────────────────────────────────

function buildContentEdit(section: ContentSection, index: number): RenderNode {
  const markdown = section.markdown ?? "";

  return createNode("section", {
    role: "section-root",
    layout: { variant: section.variant || "prose" },
    children: [
      createNode("div", {
        layout: { width: "narrow", align: "left" },
        children: [
          createNode("textarea", {
            role: "editable-textarea",
            attrs: {
              name: `section_${index}__markdown`,
              rows: "15",
              placeholder: "Markdown content…",
            },
            children: [markdown],
          }),
        ],
      }),
    ],
  });
}

// ── Table ─────────────────────────────────────────────────────────────────────

function buildTableEdit(section: TableSection, index: number): RenderNode {
  const label = section.label ?? "Table";
  const cells = section.cells ?? [];
  const rowTypeAttr = label.toLowerCase().replace(/[/\s]+/g, "-");
  const allCells: RenderNode[] = [];

  // 1. Row label (not editable)
  allCells.push(
    createNode("div", {
      role: "table-cell-label",
      attrs: { "data-row-type": rowTypeAttr },
      children: [label],
    }),
  );

  // 2. Header cells (not editable)
  for (const cell of cells) {
    allCells.push(
      createNode("div", {
        role: "table-cell-header",
        attrs: { "data-row-type": rowTypeAttr },
        children: [cell.label],
      }),
    );
  }

  // 3. Spacer
  allCells.push(
    createNode("div", {
      role: "table-cell-spacer",
      attrs: { "data-row-type": rowTypeAttr },
      children: [],
    }),
  );

  // 4. Editable value cells
  for (const cell of cells) {
    const fieldName = `section_${index}__${cell.label}`;
    let inputNode: RenderNode;

    if (cell.type === "bool") {
      // Hidden input pattern: ensures "off" is submitted when unchecked
      const hiddenNode = createNode("input", {
        attrs: { type: "hidden", name: fieldName, value: "off" },
      });
      const checkboxNode = createNode("input", {
        role: "editable-checkbox",
        attrs: {
          type: "checkbox",
          name: fieldName,
          value: "on",
          ...(cell.value ? { checked: "checked" } : {}),
        },
      });
      // Wrap both in the cell container
      allCells.push(
        createNode("div", {
          role: "editable-cell",
          attrs: { "data-row-type": rowTypeAttr },
          children: [hiddenNode, checkboxNode],
        }),
      );
      continue;
    } else if (cell.type === "numeric") {
      inputNode = createNode("input", {
        role: "editable-number",
        attrs: {
          type: "number",
          name: fieldName,
          value: String(cell.value ?? 0),
          ...(cell["color-scale"]
            ? {
                min: String(cell["color-scale"][0]),
                max: String(cell["color-scale"][1]),
              }
            : {}),
        },
      });
    } else {
      inputNode = createNode("input", {
        role: "editable-text",
        attrs: {
          type: "text",
          name: fieldName,
          value: String(cell.value ?? ""),
        },
      });
    }

    allCells.push(
      createNode("div", {
        role: "editable-cell",
        attrs: { "data-row-type": rowTypeAttr },
        children: [inputNode],
      }),
    );
  }

  // Root container with grid layout
  const gridColumnsValue = `100px repeat(${cells.length}, 1fr)`;

  return createNode("div", {
    role: "table-container",
    attrs: { "data-grid-columns": gridColumnsValue },
    children: allCells,
  });
}
