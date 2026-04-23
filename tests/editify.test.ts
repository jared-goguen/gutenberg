import { describe, test, expect } from "bun:test";
import { editify } from "../src/pipeline/editify.js";
import type { PageSpec } from "../src/specs/page/index.js";

/**
 * Editify tests — currently minimal since editify is stubbed.
 *
 * The old RenderNode-based editify has been replaced with a stub that throws,
 * pending a rewrite for the new HTML pipeline (fromYaml → plan → compile → wrapDocument).
 *
 * When the HTML-based edit transform is implemented, these tests should be
 * expanded to cover:
 *   - Hero heading → editable text input
 *   - Content markdown → editable textarea
 *   - Table cells → editable number/text/checkbox inputs
 *   - Field naming convention: section_{index}__{field}
 *   - Navigation hidden in edit mode
 *   - Non-editable sections pass through unchanged
 *   - Unsupported types with _editable pass through unchanged
 *   - Semantic axes preserved on transformed nodes
 */

describe("editify (stub)", () => {
  test("throws with not-implemented error", () => {
    const spec = { title: "Test" } as unknown as PageSpec;
    expect(() => editify(spec)).toThrow("not yet implemented");
  });

  test("error message mentions HTML pipeline", () => {
    const spec = { title: "Test" } as unknown as PageSpec;
    expect(() => editify(spec)).toThrow("HTML pipeline");
  });
});
