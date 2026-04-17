/**
 * TABLE DATA EXTRACTION — Extract and validate table data from section
 */

import type { TableCell, TableSection } from "../types.js";

export interface TableData {
  label: string;
  cells: Array<{
    label: string;
    value: string | number | boolean;
    type: "text" | "numeric" | "bool";
    colorScale?: [number, number];
    invertColors?: boolean;
  }>;
}

/**
 * Extract table data from a TableSection
 */
export function extractTableData(section: any): TableData {
  const label = section.label as string;
  const cells = (section.cells || []) as TableCell[];

  return {
    label,
    cells: cells.map((cell) => ({
      label: cell.label,
      value: cell.value,
      type: cell.type,
      colorScale: cell["color-scale"],
      invertColors: cell["invert-colors"] || false,
    })),
  };
}
