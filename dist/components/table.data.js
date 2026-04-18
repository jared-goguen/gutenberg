/**
 * TABLE DATA EXTRACTION — Extract and validate table data from section
 */
/**
 * Extract table data from a TableSection
 */
export function extractTableData(section) {
    const label = section.label;
    const cells = (section.cells || []);
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
//# sourceMappingURL=table.data.js.map