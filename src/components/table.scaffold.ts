/**
 * TABLE SCAFFOLD — Build RenderNode tree for semantic table component
 * 
 * Returns RenderNode (classless) with semantic roles.
 * Stores cell metadata in attrs for enricher to compute color classes.
 * Flattens HTML structure for grid layout while preserving semantic data.
 */

import type { RenderNode } from "../scaffold/node.js";
import { extractTableData, type TableData } from "./table.data.js";

/**
 * Format cell value for display
 */
function formatCellValue(
  value: string | number | boolean,
  type: "text" | "numeric" | "bool"
): string {
  if (type === "bool") {
    return value === true || value === "true" || value === 1 ? "✓" : "✗";
  }

  if (type === "numeric") {
    return `${value}`;
  }

  return String(value);
}

/**
 * Scaffold a table section into a RenderNode tree
 * Structure: all cells are direct children of table-container with roles
 * Cell metadata (value, type, colorScale) stored in attrs for enricher to process
 * 
 * @param section Table section data
 * @param mode 'view' (default) or 'edit' - controls if cells are rendered as inputs
 */
export function scaffoldTable(section: any, mode: 'view' | 'edit' = 'view'): RenderNode {
  const isEditable = section._editable === true;
  
  if (mode === 'edit' && isEditable) {
    return scaffoldTableEdit(section);
  }
  
  // View mode (existing implementation)
  return scaffoldTableView(section);
}

function scaffoldTableView(section: any): RenderNode {
  const data = extractTableData(section);
  const rowTypeAttr = data.label.toLowerCase().replace(/[/\s]+/g, "-");

  // Build all cells as direct children (flattened for CSS Grid)
  const allCells: RenderNode[] = [];

  // 1. Row label cell (column 1)
  allCells.push({
    tag: "div",
    role: "table-cell-label",
    attrs: { "data-row-type": rowTypeAttr },
    children: [data.label],
  });

  // 2. Header cells (columns 2-N)
  data.cells.forEach((cell) => {
    allCells.push({
      tag: "div",
      role: "table-cell-header",
      attrs: { "data-row-type": rowTypeAttr },
      children: [cell.label],
    });
  });

  // 3. Spacer cell (aligns value row with label cell in first column)
  allCells.push({
    tag: "div",
    role: "table-cell-spacer",
    attrs: { "data-row-type": rowTypeAttr },
    children: [],
  });

  // 4. Data value cells (columns 2-N)
  data.cells.forEach((cell) => {
    // Store cell metadata in attrs for enricher to compute color class
    const cellAttrs: Record<string, string> = {
      "data-row-type": rowTypeAttr,
      "data-cell-type": cell.type,
      "data-cell-value": String(cell.value),
    };

    // For numeric cells with color scales, compute normalized value (0-1) for smooth gradient
    if (cell.type === "numeric" && cell.colorScale) {
      const [min, max] = cell.colorScale;
      const numValue = typeof cell.value === "number" ? cell.value : 0;
      const normalized = (numValue - min) / (max - min);
      cellAttrs["data-normalized"] = String(Math.max(0, Math.min(1, normalized)));
      cellAttrs["data-color-scale"] = `${cell.colorScale[0]},${cell.colorScale[1]}`;
    }

    if (cell.colorScale) {
      cellAttrs["data-color-scale"] = `${cell.colorScale[0]},${cell.colorScale[1]}`;
    }

    if (cell.invertColors) {
      cellAttrs["data-invert-colors"] = "true";
    }

    allCells.push({
      tag: "div",
      role: "table-cell-value",
      attrs: cellAttrs,
      children: [formatCellValue(cell.value, cell.type)],
    });
  });

  // Root container with dynamic grid layout
  // 1 label column + N data columns
  const numDataColumns = data.cells.length;
  const gridColumnsValue = `100px repeat(${numDataColumns}, 1fr)`;

  return {
    tag: "div",
    role: "table-container",
    attrs: {
      "data-grid-columns": gridColumnsValue,
    },
    children: allCells,
  };
}

function scaffoldTableEdit(section: any): RenderNode {
  const data = extractTableData(section);
  const rowTypeAttr = data.label.toLowerCase().replace(/[/\s]+/g, "-");
  const allCells: RenderNode[] = [];

  // 1. Label cell (not editable)
  allCells.push({
    tag: "div",
    role: "table-cell-label",
    attrs: { "data-row-type": rowTypeAttr },
    children: [data.label],
  });

  // 2. Header cells (not editable)
  data.cells.forEach((cell) => {
    allCells.push({
      tag: "div",
      role: "table-cell-header",
      attrs: { "data-row-type": rowTypeAttr },
      children: [cell.label],
    });
  });

  // 3. Spacer cell
  allCells.push({
    tag: "div",
    role: "table-cell-spacer",
    attrs: { "data-row-type": rowTypeAttr },
    children: [],
  });

  // 4. Value cells as INPUT elements
  data.cells.forEach((cell) => {
    const fieldName = `${data.label}__${cell.label}`;
    let inputNode: RenderNode;

    if (cell.type === 'bool') {
      inputNode = {
        tag: "input",
        attrs: {
          type: "checkbox",
          name: fieldName,
          ...(cell.value ? { checked: "checked" } : {}),
        },
        children: [],
      };
    } else if (cell.type === 'numeric') {
      inputNode = {
        tag: "input",
        attrs: {
          type: "number",
          name: fieldName,
          value: String(cell.value || 0),
          ...(cell.colorScale ? {
            min: String(cell.colorScale[0]),
            max: String(cell.colorScale[1])
          } : {}),
        },
        children: [],
      };
    } else {
      // text
      inputNode = {
        tag: "input",
        attrs: {
          type: "text",
          name: fieldName,
          value: String(cell.value || ''),
        },
        children: [],
      };
    }

    // Wrap input in cell-value div for consistent styling
    allCells.push({
      tag: "div",
      role: "table-cell-value-edit",
      attrs: { "data-row-type": rowTypeAttr },
      children: [inputNode],
    });
  });

  // Root container
  const numDataColumns = data.cells.length;
  const gridColumnsValue = `100px repeat(${numDataColumns}, 1fr)`;

  return {
    tag: "div",
    role: "table-container",
    attrs: {
      "data-grid-columns": gridColumnsValue,
    },
    children: allCells,
  };
}
