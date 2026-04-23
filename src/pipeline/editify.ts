/**
 * EDITIFY Stage — edit mode transform (STUB)
 *
 * TODO: This module was built for the old RenderNode pipeline
 * (scaffold → editify → enrich → style). The new pipeline produces
 * HTML strings directly (fromYaml → plan → compile → wrapDocument).
 *
 * To support edit mode in the new pipeline, this needs to be rewritten
 * as an HTML-based edit transform — either:
 *   1. A post-HTML transform that injects form inputs into the rendered HTML, or
 *   2. A pre-compile transform that modifies the PageSpec to include edit affordances
 *      before it enters the plan → compile pipeline.
 *
 * The old implementation replaced RenderNode subtrees with form input nodes
 * for sections marked `_editable: true`. The new approach should achieve the
 * same result but operate on either the PageSpec or the final HTML string.
 *
 * Supported section types for edit mode: hero, content, table.
 * Field naming convention: `section_{index}__{field}`
 *
 * See src/workers/index.ts for the runtime handler that uses edit mode.
 */

// Re-export the stub so existing imports don't break at the type level.
// At runtime, calling editify() will throw until the HTML-based transform is implemented.

import type { PageSpec } from "../specs/page/index.js";

/**
 * Placeholder for the edit mode transform.
 *
 * @throws Always — edit mode transform not yet ported to the new pipeline.
 */
export function editify(_spec: PageSpec): string {
  throw new Error(
    "editify() is not yet implemented for the new HTML pipeline. " +
    "The old RenderNode-based editify needs to be rewritten as an HTML-based transform."
  );
}
