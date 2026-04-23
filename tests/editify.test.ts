import { describe, test, expect } from "bun:test";
import { scaffold } from "../src/pipeline/scaffold.js";
import { editify } from "../src/pipeline/editify.js";
import { enrichRenderNodes } from "../src/enricher.js";
import { style } from "../src/pipeline/style.js";
import { lint } from "../src/pipeline/lint.js";
import type { PageSchema } from "../src/types.js";
import type { RenderNode } from "../src/scaffold/node.js";
import { stringify } from "yaml";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal PageSchema from sections */
function makeSchema(
  sections: any[],
  layout?: { type: string },
): PageSchema {
  return {
    page: {
      meta: { title: "Test" },
      ...(layout ? { layout } : {}),
      sections,
    },
  };
}

/** Deep-find all RenderNodes matching a predicate */
function findNodes(
  node: RenderNode,
  pred: (n: RenderNode) => boolean,
): RenderNode[] {
  const found: RenderNode[] = [];
  if (pred(node)) found.push(node);
  for (const child of node.children) {
    if (typeof child !== "string") {
      found.push(...findNodes(child, pred));
    }
  }
  return found;
}

/** Find all nodes with a given role in a tree */
function findByRole(nodes: RenderNode[], role: string): RenderNode[] {
  return nodes.flatMap((n) => findNodes(n, (x) => x.role === role));
}

/** Run the full pipeline and return HTML */
function renderPipeline(
  schema: PageSchema,
  mode: "view" | "edit",
): string {
  const nodes = scaffold(schema);
  const transformed = mode === "edit" ? editify(nodes, schema) : nodes;
  const annotated = enrichRenderNodes(transformed);
  return style(annotated, schema.page.meta, { mode });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const editableHero = {
  type: "hero",
  _editable: true,
  content: { heading: "My Title", subheading: "Sub" },
};

const editableContent = {
  type: "content",
  _editable: true,
  markdown: "## Hello\n\nSome *markdown* here.",
};

const editableTable = {
  type: "table",
  _editable: true,
  label: "Scores",
  cells: [
    { label: "Speed", value: 8, type: "numeric", "color-scale": [0, 10] },
    { label: "Name", value: "Alice", type: "text" },
    { label: "Active", value: true, type: "bool" },
    { label: "Inactive", value: false, type: "bool" },
  ],
};

const nonEditableHero = {
  type: "hero",
  content: { heading: "Static Title" },
};

const navigation = {
  type: "navigation",
  links: [{ text: "Home", href: "/" }],
};

const features = {
  type: "features",
  _editable: true,
  heading: "Features",
  items: [{ title: "Fast", description: "Very fast" }],
};

// ── editify transform tests ──────────────────────────────────────────────────

describe("editify", () => {
  test("hero → editable-text input with correct field name", () => {
    const schema = makeSchema([editableHero]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    const inputs = findByRole(edited, "editable-text");
    expect(inputs.length).toBe(1);
    expect(inputs[0].tag).toBe("input");
    expect(inputs[0].attrs.type).toBe("text");
    expect(inputs[0].attrs.name).toBe("section_0__heading");
    expect(inputs[0].attrs.value).toBe("My Title");
  });

  test("content → editable-textarea with raw markdown", () => {
    const schema = makeSchema([editableContent]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    const textareas = findByRole(edited, "editable-textarea");
    expect(textareas.length).toBe(1);
    expect(textareas[0].tag).toBe("textarea");
    expect(textareas[0].attrs.name).toBe("section_0__markdown");
    // Should contain raw markdown, not rendered HTML
    expect(textareas[0].children[0]).toBe("## Hello\n\nSome *markdown* here.");
  });

  test("table numeric → editable-number with min/max", () => {
    const schema = makeSchema([editableTable]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    const numbers = findByRole(edited, "editable-number");
    expect(numbers.length).toBe(1);
    expect(numbers[0].tag).toBe("input");
    expect(numbers[0].attrs.type).toBe("number");
    expect(numbers[0].attrs.name).toBe("section_0__Speed");
    expect(numbers[0].attrs.value).toBe("8");
    expect(numbers[0].attrs.min).toBe("0");
    expect(numbers[0].attrs.max).toBe("10");
  });

  test("table text → editable-text input", () => {
    const schema = makeSchema([editableTable]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    // Find editable-text nodes inside table (not hero)
    const textInputs = findByRole(edited, "editable-text");
    const nameInput = textInputs.find(
      (n) => n.attrs.name === "section_0__Name",
    );
    expect(nameInput).toBeDefined();
    expect(nameInput!.attrs.value).toBe("Alice");
  });

  test("table bool → checkbox with hidden input pattern", () => {
    const schema = makeSchema([editableTable]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    const checkboxes = findByRole(edited, "editable-checkbox");
    expect(checkboxes.length).toBe(2);

    // Active=true should have checked attr
    const activeCheckbox = checkboxes.find(
      (n) => n.attrs.name === "section_0__Active",
    );
    expect(activeCheckbox).toBeDefined();
    expect(activeCheckbox!.attrs.checked).toBe("checked");
    expect(activeCheckbox!.attrs.value).toBe("on");

    // Inactive=false should NOT have checked attr
    const inactiveCheckbox = checkboxes.find(
      (n) => n.attrs.name === "section_0__Inactive",
    );
    expect(inactiveCheckbox).toBeDefined();
    expect(inactiveCheckbox!.attrs.checked).toBeUndefined();

    // Each checkbox cell should have a hidden input sibling
    const cells = findByRole(edited, "editable-cell");
    const boolCells = cells.filter((c) =>
      c.children.some(
        (ch) =>
          typeof ch !== "string" && ch.role === "editable-checkbox",
      ),
    );
    expect(boolCells.length).toBe(2);
    for (const cell of boolCells) {
      const hidden = cell.children.find(
        (ch) =>
          typeof ch !== "string" &&
          ch.tag === "input" &&
          ch.attrs.type === "hidden",
      ) as RenderNode | undefined;
      expect(hidden).toBeDefined();
      expect(hidden!.attrs.value).toBe("off");
    }
  });

  test("field name uniqueness across same-type sections", () => {
    const content1 = { ...editableContent, markdown: "First" };
    const content2 = { ...editableContent, markdown: "Second" };
    // Indices: 0=hero, 1=content1, 2=content2
    const schema = makeSchema([nonEditableHero, content1, content2]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    const textareas = findByRole(edited, "editable-textarea");
    expect(textareas.length).toBe(2);

    const names = textareas.map((t) => t.attrs.name);
    expect(names).toContain("section_1__markdown");
    expect(names).toContain("section_2__markdown");
    // No duplicates
    expect(new Set(names).size).toBe(2);
  });

  test("navigation → edit-hidden", () => {
    const schema = makeSchema([navigation, editableHero]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    const hidden = findByRole(edited, "edit-hidden");
    expect(hidden.length).toBe(1);
    expect(hidden[0].attrs["aria-hidden"]).toBe("true");
  });

  test("non-editable section passes through unchanged", () => {
    const schema = makeSchema([nonEditableHero]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    // Should be the exact same node (no transform)
    expect(edited[0]).toBe(nodes[0]);
  });

  test("unsupported type with _editable passes through unchanged", () => {
    const schema = makeSchema([features]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    // Features doesn't have an editify handler — should pass through
    expect(edited[0]).toBe(nodes[0]);
  });

  test("docs layout skips editify entirely", () => {
    const schema = makeSchema(
      [{ ...editableHero }, navigation],
      { type: "docs" },
    );
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    // Should return the exact same array
    expect(edited).toBe(nodes);
  });

  test("semantic axes preserved on transformed nodes", () => {
    const schema = makeSchema([
      { ...editableHero, vibe: "vibrant", intent: "engage" },
    ]);
    const nodes = scaffold(schema);
    const edited = editify(nodes, schema);

    expect(edited[0].semantic).toBeDefined();
    expect(edited[0].semantic!.vibe).toBe("vibrant");
    expect(edited[0].semantic!.intent).toBe("engage");
  });
});

// ── Full pipeline integration ────────────────────────────────────────────────

describe("edit mode pipeline", () => {
  const mixedSchema = makeSchema([
    editableHero,
    nonEditableHero,
    editableContent,
    editableTable,
    navigation,
  ]);

  test("edit HTML contains gb-input-* classes", () => {
    const html = renderPipeline(mixedSchema, "edit");

    expect(html).toContain("gb-input-text");
    expect(html).toContain("gb-input-textarea");
    expect(html).toContain("gb-input-number");
    expect(html).toContain("gb-input-checkbox");
  });

  test("edit HTML does NOT contain old phantom classes", () => {
    const html = renderPipeline(mixedSchema, "edit");

    expect(html).not.toContain("hero-heading-input");
    expect(html).not.toContain("content-markdown-input");
  });

  test("edit HTML contains form wrapper", () => {
    const html = renderPipeline(mixedSchema, "edit");

    expect(html).toContain('<form method="POST"');
    expect(html).toContain("Save & Publish");
    expect(html).toContain("Cancel");
  });

  test("edit HTML hides navigation", () => {
    const html = renderPipeline(mixedSchema, "edit");

    expect(html).toContain("gb-edit-hidden");
  });

  test("view mode is unaffected — hero-heading class present", () => {
    const html = renderPipeline(mixedSchema, "view");

    expect(html).toContain("hero-heading");
    expect(html).not.toContain("gb-input-text");
    expect(html).not.toContain("gb-edit-hidden");
  });

  test("view mode has edit button", () => {
    const html = renderPipeline(mixedSchema, "view");

    expect(html).toContain("Edit This Page");
    expect(html).toContain("?mode=edit");
  });
});

// ── formDataToYAML ───────────────────────────────────────────────────────────
// formDataToYAML is not exported, so we test it via a YAML round-trip:
// build a schema YAML → run through the same logic the workers handler uses.

describe("formDataToYAML round-trip", () => {
  // We can't import formDataToYAML directly (it's private to workers/index.ts).
  // Instead, replicate the core logic inline to test field mapping.
  // This verifies the convention: section_{index}__{field}

  function applyFormData(
    schema: PageSchema,
    fields: Record<string, string>,
  ): PageSchema {
    const spec = JSON.parse(JSON.stringify(schema));
    const sections = spec.page.sections;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section._editable) continue;

      switch (section.type) {
        case "hero": {
          const v = fields[`section_${i}__heading`];
          if (v !== undefined) section.content.heading = v;
          break;
        }
        case "content": {
          const v = fields[`section_${i}__markdown`];
          if (v !== undefined) section.markdown = v;
          break;
        }
        case "table": {
          for (const cell of section.cells) {
            const fieldName = `section_${i}__${cell.label}`;
            const v = fields[fieldName];
            if (cell.type === "bool") {
              cell.value = v === "on";
            } else if (cell.type === "numeric") {
              if (v !== undefined) cell.value = parseFloat(v) || 0;
            } else {
              if (v !== undefined) cell.value = v;
            }
          }
          break;
        }
      }
    }
    return spec;
  }

  test("hero heading update via indexed field name", () => {
    const schema = makeSchema([editableHero]);
    const result = applyFormData(schema, {
      section_0__heading: "Updated Title",
    });
    expect(result.page.sections[0].content.heading).toBe("Updated Title");
  });

  test("content markdown update via indexed field name", () => {
    const schema = makeSchema([nonEditableHero, editableContent]);
    const result = applyFormData(schema, {
      section_1__markdown: "# New content",
    });
    expect(result.page.sections[1].markdown).toBe("# New content");
  });

  test("checkbox unchecking produces false", () => {
    const schema = makeSchema([editableTable]);
    const result = applyFormData(schema, {
      section_0__Active: "off", // hidden input value when unchecked
      section_0__Inactive: "off",
      section_0__Speed: "5",
      section_0__Name: "Bob",
    });
    expect(result.page.sections[0].cells[2].value).toBe(false); // Active
    expect(result.page.sections[0].cells[3].value).toBe(false); // Inactive
  });

  test("checkbox checking produces true", () => {
    const schema = makeSchema([editableTable]);
    const result = applyFormData(schema, {
      section_0__Active: "on",
      section_0__Inactive: "on",
      section_0__Speed: "5",
      section_0__Name: "Bob",
    });
    expect(result.page.sections[0].cells[2].value).toBe(true);
    expect(result.page.sections[0].cells[3].value).toBe(true);
  });

  test("multiple same-type sections get independent values", () => {
    const schema = makeSchema([
      { ...editableContent, markdown: "Original 1" },
      nonEditableHero,
      { ...editableContent, markdown: "Original 2" },
    ]);
    const result = applyFormData(schema, {
      section_0__markdown: "Changed 1",
      section_2__markdown: "Changed 2",
    });
    expect(result.page.sections[0].markdown).toBe("Changed 1");
    expect(result.page.sections[2].markdown).toBe("Changed 2");
  });

  test("non-editable sections are not modified", () => {
    const schema = makeSchema([nonEditableHero, editableContent]);
    const result = applyFormData(schema, {
      section_0__heading: "Hacked!", // non-editable — should be ignored
      section_1__markdown: "Legit update",
    });
    expect(result.page.sections[0].content.heading).toBe("Static Title");
    expect(result.page.sections[1].markdown).toBe("Legit update");
  });
});

// ── Scaffold API surface ─────────────────────────────────────────────────────

describe("scaffold API", () => {
  test("scaffold() accepts no mode parameter", () => {
    const schema = makeSchema([editableHero]);
    // Should compile and work with just schema — no mode param
    const nodes = scaffold(schema);
    expect(nodes.length).toBe(1);
  });

  test("scaffold always produces view-mode output for editable hero", () => {
    const schema = makeSchema([editableHero]);
    const nodes = scaffold(schema);

    // Should have hero-heading role (view mode), not editable-text
    const headings = findByRole(nodes, "hero-heading");
    expect(headings.length).toBe(1);
    expect(headings[0].children[0]).toBe("My Title");
  });

  test("scaffold always produces view-mode output for editable content", () => {
    const schema = makeSchema([editableContent]);
    const nodes = scaffold(schema);

    // Should have content-prose role (view mode), not editable-textarea
    const prose = findByRole(nodes, "content-prose");
    expect(prose.length).toBe(1);
  });

  test("scaffold produces view-mode navigation (not hidden)", () => {
    const schema = makeSchema([navigation]);
    const nodes = scaffold(schema);

    // Should have nav-root role, not be a hidden div
    const navs = findByRole(nodes, "nav-root");
    expect(navs.length).toBe(1);
  });
});
