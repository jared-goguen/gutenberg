/**
 * Edit mode orchestration.
 *
 * Thin wrapper around compile() that threads edit-mode options through
 * the existing pipeline. Block renderers (hero, prose, table) handle
 * the actual form-input rendering when ctx.editMode is true.
 *
 * The full pipeline runs unchanged — enrichment, tonal colors, gap
 * computation, entrance animations — edit mode just swaps display
 * elements for form inputs at the leaf level.
 */

import type { PageSpec } from "../specs/page/index.js";
import { compile } from "../compile.js";
import type { CompileResult, CompileOptions } from "../engines/html5.js";

/**
 * Compile a PageSpec in edit mode.
 *
 * Editable blocks render as form inputs (inheriting all visual styling)
 * instead of static display elements. The page is wrapped in a <form>
 * with a floating submit button.
 *
 * @param spec          Parsed PageSpec
 * @param editableBlocks Set of spec.blocks[] indices that are editable
 * @param options       Additional compile options (siteNav, resolveLink, etc.)
 */
export function compileEdit(
  spec: PageSpec,
  editableBlocks: Set<number>,
  options?: Omit<CompileOptions, "editMode" | "editableBlocks">,
): CompileResult {
  return compile(spec, {
    ...options,
    editMode: true,
    editableBlocks,
  });
}

/**
 * Extract editable block indices from a raw template YAML object.
 *
 * Templates mark blocks with `_editable: true` to indicate they should
 * render as form inputs in edit mode. This function scans the raw parsed
 * YAML (before pipeline processing) and returns the indices.
 */
export function findEditableBlocks(
  templateRaw: Record<string, unknown>,
): Set<number> {
  const blocks = (templateRaw as { blocks?: unknown[] }).blocks;
  if (!Array.isArray(blocks)) return new Set();

  const editable = new Set<number>();
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as Record<string, unknown> | undefined;
    if (!block) continue;

    // Top-level: { _editable: true, table: {...} } (old format)
    if (block._editable) {
      editable.add(i);
      continue;
    }

    // Nested: { table: { _editable: true, headers: [...] } } (new PageSpec format)
    for (const key of Object.keys(block)) {
      if (key.startsWith("_")) continue;
      const val = block[key];
      if (val && typeof val === "object" && !Array.isArray(val) && (val as Record<string, unknown>)._editable) {
        editable.add(i);
        break;
      }
    }
  }
  return editable;
}
