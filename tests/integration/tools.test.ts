import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { spawnServer, type TestServer } from "../helpers/server.js";

let srv: TestServer;

const minimalSchema = {
  page: {
    meta: { title: "Test Page" },
    sections: [
      {
        type: "hero",
        content: {
          heading: "Hello World",
          subheading: "A test page",
        },
      },
    ],
  },
};

const fullSchema = {
  page: {
    meta: {
      title: "Full Test Page",
      description: "Integration test page",
    },
    layout: {
      type: "standard",
      theme: "light",
    },
    sections: [
      {
        type: "navigation",
        links: [
          { text: "Home", href: "/" },
          { text: "About", href: "/about" },
        ],
      },
      {
        type: "hero",
        variant: "centered",
        content: {
          heading: "Welcome",
          subheading: "Testing Gutenberg",
          cta: { text: "Get Started", href: "/start", variant: "primary" },
        },
      },
      {
        type: "footer",
        copyright: "2024 Test Corp",
      },
    ],
  },
};

beforeAll(async () => {
  srv = await spawnServer();
});

afterAll(async () => {
  await srv.close();
});

describe("Tool discovery", () => {
  test("server exposes all 5 expected tools", async () => {
    const tools = await srv.listTools();
    expect(tools.sort()).toEqual([
      "generate_theme",
      "list_components",
      "preview_component",
      "render_page",
      "validate_schema",
    ]);
  });
});

describe("list_components", () => {
  test("returns all 6 component types", async () => {
    const result = JSON.parse(await srv.call("list_components", {}));
    expect(result).toHaveLength(6);

    const types = result.map((c: any) => c.type).sort();
    expect(types).toEqual([
      "content", "cta", "features", "footer", "hero", "navigation",
    ]);
  });

  test("each component has type, variants array, and description", async () => {
    const result = JSON.parse(await srv.call("list_components", {}));
    for (const component of result) {
      expect(typeof component.type).toBe("string");
      expect(Array.isArray(component.variants)).toBe(true);
      expect(component.variants.length).toBeGreaterThan(0);
      expect(typeof component.description).toBe("string");
      expect(component.description.length).toBeGreaterThan(0);
    }
  });
});

describe("validate_schema", () => {
  test("returns valid:true for a well-formed schema", async () => {
    const result = JSON.parse(await srv.call("validate_schema", { schema: minimalSchema }));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("returns valid:false with errors for missing required fields", async () => {
    const badSchema = {
      page: {
        sections: [
          { type: "hero" }, // missing content.heading
        ],
      },
    };
    const result = JSON.parse(await srv.call("validate_schema", { schema: badSchema }));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e: any) => e.path.includes("content"))).toBe(true);
  });

  test("returns valid:false for invalid section type", async () => {
    const badSchema = {
      page: {
        sections: [{ type: "totally-unknown-type" }],
      },
    };
    const result = JSON.parse(await srv.call("validate_schema", { schema: badSchema }));
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("Invalid section type");
  });

  test("accepts YAML string input", async () => {
    const yaml = `
page:
  meta:
    title: YAML Test
  sections:
    - type: hero
      content:
        heading: From YAML
`.trim();
    const result = JSON.parse(await srv.call("validate_schema", { schema: yaml }));
    expect(result.valid).toBe(true);
  });

  test("returns warnings for missing metadata", async () => {
    const schemaNoMeta = {
      page: {
        sections: [{ type: "hero", content: { heading: "Hi" } }],
      },
    };
    const result = JSON.parse(await srv.call("validate_schema", { schema: schemaNoMeta }));
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("render_page", () => {
  test("returns HTML string for minimal schema", async () => {
    const result = JSON.parse(await srv.call("render_page", { schema: minimalSchema }));
    expect(typeof result.html).toBe("string");
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("Hello World");
  });

  test("includes page title from meta in <title> tag", async () => {
    const result = JSON.parse(await srv.call("render_page", { schema: fullSchema }));
    expect(result.html).toContain("<title>Full Test Page</title>");
  });

  test("renders all sections in order", async () => {
    const result = JSON.parse(await srv.call("render_page", { schema: fullSchema }));
    const navPos = result.html.indexOf("nav");
    const heroPos = result.html.indexOf("Welcome");
    const footerPos = result.html.indexOf("2024 Test Corp");
    expect(navPos).toBeGreaterThan(-1);
    expect(heroPos).toBeGreaterThan(navPos);
    expect(footerPos).toBeGreaterThan(heroPos);
  });

  test("applies layout theme class", async () => {
    const result = JSON.parse(await srv.call("render_page", { schema: fullSchema }));
    expect(result.html).toContain("--sky-500");  // CSS var for hue scale
    expect(result.html).toContain("--color-primary");  // CSS var for token
    expect(result.html).toContain("bg-page");  // semantic utility class
  });

  test("accepts YAML string input", async () => {
    const yaml = `
page:
  meta:
    title: YAML Render Test
  sections:
    - type: hero
      content:
        heading: Rendered from YAML
`.trim();
    const result = JSON.parse(await srv.call("render_page", { schema: yaml }));
    expect(result.html).toContain("Rendered from YAML");
  });

  test("respects tailwindCDN option", async () => {
    const withCDN = JSON.parse(await srv.call("render_page", {
      schema: minimalSchema,
      options: { tailwindCDN: true },
    }));
    expect(withCDN.html).toContain("cdn.tailwindcss.com");

    const withoutCDN = JSON.parse(await srv.call("render_page", {
      schema: minimalSchema,
      options: { tailwindCDN: false },
    }));
    expect(withoutCDN.html).not.toContain("cdn.tailwindcss.com");
  });
});

describe("preview_component", () => {
  test("renders a hero section as a standalone HTML document", async () => {
    const section = {
      type: "hero",
      variant: "centered",
      content: {
        heading: "Preview Hero",
        subheading: "Testing preview",
      },
    };
    const result = JSON.parse(await srv.call("preview_component", { section }));
    expect(typeof result.html).toBe("string");
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("Preview Hero");
  });

  test("renders a features section", async () => {
    const section = {
      type: "features",
      variant: "grid-3",
      items: [
        { title: "Feature A", description: "Does A" },
        { title: "Feature B", description: "Does B" },
      ],
    };
    const result = JSON.parse(await srv.call("preview_component", { section }));
    expect(result.html).toContain("Feature A");
    expect(result.html).toContain("Feature B");
  });
});

describe("generate_theme", () => {
  test("returns theme spec with hue bindings", async () => {
    const result = JSON.parse(await srv.call("generate_theme", {
      primaryHue: "rose",
      neutralHue: "slate",
    }));
    expect(result.light.hues.primary).toBe("rose");
    expect(result.light.hues.neutral).toBe("slate");
    expect(result.light.tokens["primary"]).toBe("primary.500");
    expect(result.light.radius.button).toBe("rounded-lg");
    expect(Array.isArray(result.availableHues)).toBe(true);
  });

  test("uses defaults when no options provided", async () => {
    const result = JSON.parse(await srv.call("generate_theme", {}));
    expect(result.light.hues.primary).toBe("sky");
    expect(result.light.hues.neutral).toBe("slate");
    expect(result.dark.hues.primary).toBe("sky");
    expect(result.dark.hues.neutral).toBe("slate");
  });
});
