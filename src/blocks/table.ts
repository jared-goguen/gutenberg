import type { TableSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import type { BlockEnrichment } from "../enrich.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

export function renderTable(spec: TableSpec, ctx: RenderContext, enrichment?: BlockEnrichment): string {
  const headers = spec.headers;
  const rows = spec.rows;
  const compact = enrichment?.compact ?? (ctx.density === "compact");

  const attrs: string[] = ['class="gb-table"'];
  attrs.push("data-striped");
  if (compact) attrs.push("data-compact");

  // Build header — normalize bare strings to {label} objects
  const thCells = headers.map((h) => {
    const header = typeof h === "string" ? { label: h } : h;
    const sizeAttr = (header.size && header.size !== "fill") ? ` data-size="${header.size}"` : "";
    const style = header.align ? ` style="text-align: ${header.align}"` : "";
    return `<th scope="col"${sizeAttr}${style}>${renderInline(header.label)}</th>`;
  });

  // Build rows
  const headerCol = spec.headerColumn ?? false;
  // Normalize all headers for alignment lookups in rows
  const normalizedHeaders = headers.map((h) => typeof h === "string" ? { label: h } : h);
  const trRows = rows.map((row) => {
    const tds = row.map((cell, ci) => {
      const align = normalizedHeaders[ci]?.align ? ` style="text-align: ${normalizedHeaders[ci].align}"` : "";
      // First column as row header: <th scope="row"> with primary text styling.
      // Escaped — headerColumn cells are semantic labels, not markup containers.
      if (ci === 0 && headerCol) {
        return `<th scope="row"${align}>${renderInline(cell)}</th>`;
      }
      // Regular cells: inline rendering for code, bold, italic, and links.
      return `<td${align}>${renderInline(cell)}</td>`;
    });
    return `<tr>${tds.join("")}</tr>`;
  });

  const captionHtml = spec.caption ? `<caption class="gb-table-caption">${renderInline(spec.caption)}</caption>` : "";

  return `<div class="gb-table-wrapper"><table ${attrs.join(" ")}>
${captionHtml}
<thead>
<tr>${thCells.join("")}</tr>
</thead>
<tbody>
${trRows.join("\n")}
</tbody>
</table>
</div>`;
}
