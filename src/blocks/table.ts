import type { TableSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import type { BlockEnrichment } from "../enrich.js";
import { esc } from "./types.js";
import { renderInline } from "../inline.js";

export function renderTable(spec: TableSpec, ctx: RenderContext, enrichment?: BlockEnrichment): string {
  // Edit mode: render table with editable cell inputs
  if (ctx.editMode) {
    return renderTableEdit(spec, ctx);
  }

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

// ── Edit-mode table ──────────────────────────────────────────

function renderTableEdit(spec: TableSpec, ctx: RenderContext): string {
  const si = ctx.specIndex ?? 0;
  const headers = spec.headers;
  const rows = spec.rows;

  // Normalize headers
  const normalizedHeaders = headers.map((h) => typeof h === "string" ? { label: h } : h);

  // Header row (read-only)
  const thCells = normalizedHeaders.map((h) => {
    const sizeAttr = (h.size && h.size !== "fill") ? ` data-size="${h.size}"` : "";
    return `<th scope="col"${sizeAttr}>${renderInline(h.label)}</th>`;
  });

  // Data rows with editable cells
  const headerCol = spec.headerColumn ?? false;
  const trRows = rows.map((row, ri) => {
    const tds = row.map((cell, ci) => {
      // First column as row header — read-only
      if (ci === 0 && headerCol) {
        return `<th scope="row">${renderInline(cell)}</th>`;
      }
      // Editable cell: text input inheriting table cell styling
      const fieldName = `section_${si}__r${ri}_c${ci}`;
      const value = typeof cell === "string" ? cell : String(cell);
      return `<td><input class="gb-edit-field gb-edit-cell" type="text" name="${fieldName}" value="${esc(value)}"></td>`;
    });
    return `<tr>${tds.join("")}</tr>`;
  });

  const captionHtml = spec.caption
    ? `<caption class="gb-table-caption">${renderInline(spec.caption)}</caption>`
    : "";

  return `<div class="gb-table-wrapper"><table class="gb-table" data-striped>
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
