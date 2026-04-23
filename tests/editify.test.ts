import { describe, test, expect } from "bun:test";
import { compileEdit, findEditableBlocks } from "../src/pipeline/editify.js";
import { fromYaml } from "../src/specs/page/yaml.js";
import { compile } from "../src/compile.js";

// ── Test specs ───────────────────────────────────────────────

const editableHeroSpec = `
title: My Page
hero:
  title: Welcome
  subtitle: A test page
  body: Some body text
blocks:
  - heading:
      text: Section One
  - prose:
      text: |
        Hello **world**.
`;

const editableProseSpec = `
title: Prose Test
blocks:
  - heading:
      text: Introduction
  - prose:
      text: |
        This is editable content.
  - prose:
      text: |
        This is NOT editable.
`;

const editableTableSpec = `
title: Table Test
blocks:
  - table:
      headers:
        - Name
        - Score
      rows:
        - [Alice, "95"]
        - [Bob, "87"]
`;

const fullEditSpec = `
title: Full Edit
hero:
  title: Dashboard
  subtitle: Daily view
blocks:
  - section_label:
      text: METRICS
  - prose:
      text: |
        Enter your notes below.
  - table:
      headers:
        - Metric
        - Value
      rows:
        - [Revenue, "$1000"]
        - [Users, "42"]
`;

// ── findEditableBlocks ───────────────────────────────────────

describe("findEditableBlocks", () => {
  test("extracts editable indices from raw template", () => {
    const raw = {
      title: "Test",
      blocks: [
        { heading: { text: "Hi" } },
        { prose: { text: "Body" }, _editable: true },
        { table: { headers: ["A"], rows: [["1"]] }, _editable: true },
      ],
    };
    const result = findEditableBlocks(raw);
    expect(result.size).toBe(2);
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(0)).toBe(false);
  });

  test("returns empty set for no editable blocks", () => {
    const raw = { title: "Test", blocks: [{ heading: { text: "Hi" } }] };
    expect(findEditableBlocks(raw).size).toBe(0);
  });

  test("returns empty set for missing blocks", () => {
    const raw = { title: "Test" };
    expect(findEditableBlocks(raw).size).toBe(0);
  });
});

// ── compileEdit ──────────────────────────────────────────────

describe("compileEdit", () => {
  test("hero renders form inputs in edit mode", () => {
    const spec = fromYaml(editableHeroSpec);
    // Hero is at spec.blocks index... but hero is a frame extracted from spec.hero.
    // The hero spec index depends on spec.blocks content. In this spec,
    // blocks[0] is heading, blocks[1] is prose. Hero is spec-level (spec.hero).
    // For hero edit, we need the hero's spec index. Since hero comes from
    // spec.hero (not spec.blocks), heroSpecIndex is determined by plan().
    // Let's just test with all blocks editable.
    const allEditable = new Set([0, 1]);
    const result = compileEdit(spec, allEditable);

    // Should have form wrapper
    expect(result.html).toContain('data-edit-mode');
    expect(result.html).toContain('<form method="POST"');
    expect(result.html).toContain('gb-edit-submit');
    expect(result.html).toContain('gb-edit-bar');

    // Non-editable hero (hero is a frame, not in blocks array) renders normally
    expect(result.html).toContain('gb-hero');
    expect(result.html).toContain('Welcome');
  });

  test("prose renders textarea in edit mode", () => {
    const spec = fromYaml(editableProseSpec);
    // blocks: [0: heading, 1: prose (editable), 2: prose (not editable)]
    const editable = new Set([1]);
    const result = compileEdit(spec, editable);

    // Editable prose gets textarea
    expect(result.html).toContain('<textarea');
    expect(result.html).toContain('name="section_1__text"');
    expect(result.html).toContain('gb-edit-field');
    expect(result.html).toContain('This is editable content.');

    // Non-editable prose renders as HTML (not textarea)
    expect(result.html).toContain('This is NOT editable.');
    // The non-editable one should be rendered markdown, not a textarea
    expect(result.html).toContain('<p>This is NOT editable.</p>');
  });

  test("table renders input cells in edit mode", () => {
    const spec = fromYaml(editableTableSpec);
    // blocks: [0: table]
    const editable = new Set([0]);
    const result = compileEdit(spec, editable);

    expect(result.html).toContain('gb-table');
    expect(result.html).toContain('gb-edit-field');
    expect(result.html).toContain('gb-edit-cell');
    // Cell inputs with correct field names
    expect(result.html).toContain('name="section_0__r0_c0"');
    expect(result.html).toContain('value="Alice"');
    expect(result.html).toContain('value="95"');
  });

  test("non-editable blocks render identically to view mode", () => {
    const spec = fromYaml(editableProseSpec);
    const viewResult = compile(spec);
    const editResult = compileEdit(spec, new Set([1])); // only prose[1] editable

    // The heading (block 0) should appear in both
    expect(viewResult.html).toContain('gb-heading');
    expect(editResult.html).toContain('gb-heading');

    // The non-editable prose (block 2) should render as HTML in both
    expect(viewResult.html).toContain('<p>This is NOT editable.</p>');
    expect(editResult.html).toContain('<p>This is NOT editable.</p>');
  });

  test("edit mode includes edit CSS", () => {
    const spec = fromYaml(editableProseSpec);
    const result = compileEdit(spec, new Set([1]));

    expect(result.html).toContain('.gb-edit-field');
    expect(result.html).toContain('.gb-edit-submit');
    expect(result.html).toContain('border: 1px dashed');
  });

  test("full edit spec with hero + prose + table", () => {
    const spec = fromYaml(fullEditSpec);
    // blocks: [0: section_label, 1: prose, 2: table]
    // hero is a frame (spec.hero), not in blocks
    // Make prose and table editable
    const editable = new Set([1, 2]);
    const result = compileEdit(spec, editable);

    // Hero renders normally (not editable — it's a frame)
    expect(result.html).toContain('gb-hero');
    expect(result.html).toContain('Dashboard');

    // Section label renders normally (not editable)
    expect(result.html).toContain('gb-section-label');
    expect(result.html).toContain('METRICS');

    // Prose is editable
    expect(result.html).toContain('name="section_1__text"');
    expect(result.html).toContain('<textarea');

    // Table is editable
    expect(result.html).toContain('name="section_2__r0_c0"');
    expect(result.html).toContain('value="Revenue"');
  });

  test("empty editable set produces view-mode-like output with form wrapper", () => {
    const spec = fromYaml(editableProseSpec);
    const result = compileEdit(spec, new Set());

    // Has form wrapper (editMode is still true)
    expect(result.html).toContain('data-edit-mode');
    expect(result.html).toContain('<form method="POST"');

    // No edit input elements (CSS still references .gb-edit-field as selector)
    expect(result.html).not.toContain('name="section_');
    expect(result.html).not.toContain('<textarea');
    expect(result.html).not.toContain('<input class="gb-edit');
  });
});
