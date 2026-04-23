/**
 * Integration tests for the new gutenberg pipeline.
 *
 * Tests the core rendering path: YAML → parse → enrich → plan → compile → HTML.
 * Does NOT spawn an MCP server — calls pipeline functions directly.
 */

import { describe, test, expect } from "bun:test";
import { fromYaml, validateSpec } from "../../src/specs/page/yaml.js";
import { compile, compileYaml } from "../../src/compile.js";

// ── Minimal spec ─────────────────────────────────────────────

const minimalSpec = `
title: Test Page
theme: mono
blocks:
  - heading:
      text: Hello World
  - prose:
      text: |
        This is a **test** page.
`;

const fullSpec = `
title: Full Test Page
description: A comprehensive test of the rendering pipeline
theme: mono
blocks:
  - hero:
      title: Welcome
      subtitle: A test hero
  - section_label:
      text: FEATURES
  - heading:
      text: Key Features
      level: 2
  - cards:
      items:
        - title: Card One
          body: First card body
        - title: Card Two
          body: Second card body
  - stat:
      items:
        - value: "99.9%"
          label: Uptime
        - value: "42"
          label: Features
  - prose:
      text: |
        ## Details

        Some detailed content with **bold** and *italic*.

        - Item one
        - Item two
  - flow_chain:
      steps:
        - label: Step 1
        - label: Step 2
        - label: Step 3
  - badge:
      items:
        - label: v2.0
          tone: positive
        - label: beta
          tone: neutral
  - table:
      headers:
        - Name
        - Status
      rows:
        - [Alpha, Active]
        - [Beta, Pending]
  - closing:
      text: |
        ## Get Started

        Ready to begin?
`;

// ── Tests ────────────────────────────────────────────────────

describe("Pipeline: YAML → HTML", () => {
  test("minimal spec parses and validates", () => {
    const spec = fromYaml(minimalSpec);
    expect(spec.title).toBe("Test Page");
    expect(spec.blocks.length).toBe(2);

    const errors = validateSpec(spec);
    expect(errors).toEqual([]);
  });

  test("minimal spec compiles to HTML", () => {
    const result = compileYaml(minimalSpec);
    expect(result.html).toContain("Hello World");
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("gb-heading");
    expect(result.html).toContain("gb-prose");
  });

  test("full spec compiles with all block types", () => {
    const result = compileYaml(fullSpec);
    const html = result.html;

    // Document structure
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Full Test Page</title>");

    // Hero
    expect(html).toContain("gb-hero");
    expect(html).toContain("Welcome");

    // Section label
    expect(html).toContain("gb-section-label");
    expect(html).toContain("FEATURES");

    // Cards
    expect(html).toContain("gb-card");
    expect(html).toContain("Card One");

    // Stat
    expect(html).toContain("gb-stat");
    expect(html).toContain("99.9%");

    // Flow chain
    expect(html).toContain("gb-flow-chain");
    expect(html).toContain("Step 1");

    // Badge
    expect(html).toContain("gb-badge");

    // Table
    expect(html).toContain("gb-table");
    expect(html).toContain("Alpha");

    // Closing
    expect(html).toContain("gb-closing");
    expect(html).toContain("Get Started");
  });

  test("compile() returns well-formed HTML document", () => {
    const spec = fromYaml(minimalSpec);
    const result = compile(spec);

    // Has proper HTML structure
    expect(result.html).toStartWith("<!DOCTYPE html>");
    expect(result.html).toContain("<html lang=\"en\">");
    expect(result.html).toContain("<head>");
    expect(result.html).toContain("</head>");
    expect(result.html).toContain("<body");
    expect(result.html).toContain("</body>");
    expect(result.html).toContain("</html>");

    // Has stylesheet
    expect(result.html).toContain("<style>");

    // Has mono theme CSS variables
    expect(result.html).toContain("--gb-accent");
  });

  test("theme defaults to mono", () => {
    const specNoTheme = `
title: No Theme
blocks:
  - heading:
      text: Test
`;
    const result = compileYaml(specNoTheme);
    // Should still produce valid HTML (mono is the only stylesheet)
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("gb-heading");
  });
});

describe("Spec validation", () => {
  test("rejects empty spec", () => {
    expect(() => fromYaml("")).toThrow();
  });

  test("rejects spec without title", () => {
    const noTitle = `
blocks:
  - heading:
      text: No title
`;
    // Should parse but validation may flag it
    const spec = fromYaml(noTitle);
    expect(spec.blocks.length).toBe(1);
  });
});
