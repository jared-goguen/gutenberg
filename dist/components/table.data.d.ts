/**
 * TABLE DATA EXTRACTION — Extract and validate table data from section
 */
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
export declare function extractTableData(section: any): TableData;
//# sourceMappingURL=table.data.d.ts.map