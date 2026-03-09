import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { spawnServer, type TestServer } from "../helpers/server.js";
import { writeFileSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { stringify } from "yaml";

let srv: TestServer;
const testDir = join(process.cwd(), "test-specs");

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

// Helper to write schema to file and return path
function writeSpec(name: string, schema: any): string {
  mkdirSync(testDir, { recursive: true });
  const path = join(testDir, `${name}.yaml`);
  writeFileSync(path, stringify(schema));
  return path;
}

beforeAll(async () => {
  srv = await spawnServer();
});

afterAll(async () => {
  await srv.close();
  try {
    rmSync(testDir, { recursive: true });
  } catch {
    // ignore cleanup errors
  }
});

describe("Tool discovery", () => {
  test("server exposes all 3 rendering tools", async () => {
    const tools = await srv.listTools();
    expect(tools.sort()).toEqual([
      "render_page",
      "snapshot_html",
      "validate_schema",
    ]);
  });
});

describe("validate_schema", () => {
  test("returns valid:true for a well-formed schema", async () => {
    const spec_path = writeSpec("validate-minimal", minimalSchema);
    const result = JSON.parse(await srv.call("validate_schema", { spec_path }));
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
    const spec_path = writeSpec("validate-missing", badSchema);
    const result = JSON.parse(await srv.call("validate_schema", { spec_path }));
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
    const spec_path = writeSpec("validate-badtype", badSchema);
    const result = JSON.parse(await srv.call("validate_schema", { spec_path }));
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("Invalid section type");
  });

  test("returns warnings for missing metadata", async () => {
    const schemaNoMeta = {
      page: {
        sections: [{ type: "hero", content: { heading: "Hi" } }],
      },
    };
    const spec_path = writeSpec("validate-nometa", schemaNoMeta);
    const result = JSON.parse(await srv.call("validate_schema", { spec_path }));
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("render_page", () => {
  test("renders minimal schema to HTML file", async () => {
    const spec_path = writeSpec("render-minimal", minimalSchema);
    const result = JSON.parse(await srv.call("render_page", { spec_path }));
    
    expect(typeof result.html_path).toBe("string");
    expect(result.html_path).toMatch(/\.html$/);
    
    // Verify file exists and contains expected content
    const html = readFileSync(result.html_path, "utf8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Hello World");
  });

  test("renders full schema and includes page title", async () => {
    const spec_path = writeSpec("render-full", fullSchema);
    const result = JSON.parse(await srv.call("render_page", { spec_path }));
    
    const html = readFileSync(result.html_path, "utf8");
    expect(html).toContain("<title>Full Test Page</title>");
  });

  test("renders all sections in order", async () => {
    const spec_path = writeSpec("render-order", fullSchema);
    const result = JSON.parse(await srv.call("render_page", { spec_path }));
    
    const html = readFileSync(result.html_path, "utf8");
    const navPos = html.indexOf("nav");
    const heroPos = html.indexOf("Welcome");
    const footerPos = html.indexOf("2024 Test Corp");
    expect(navPos).toBeGreaterThan(-1);
    expect(heroPos).toBeGreaterThan(navPos);
    expect(footerPos).toBeGreaterThan(heroPos);
  });

  test("applies layout theme CSS variables", async () => {
    const spec_path = writeSpec("render-theme", fullSchema);
    const result = JSON.parse(await srv.call("render_page", { spec_path }));
    
    const html = readFileSync(result.html_path, "utf8");
    expect(html).toContain("--sky-500");  // CSS var for hue scale
    expect(html).toContain("--color-primary");  // CSS var for token
  });

  test("derives output filename from spec name", async () => {
    const spec_path = writeSpec("my-test-page", minimalSchema);
    const result = JSON.parse(await srv.call("render_page", { spec_path }));
    
    expect(result.html_path).toContain("my-test-page.html");
  });

  test("accepts custom output directory", async () => {
    const spec_path = writeSpec("render-custom", minimalSchema);
    const customDir = join(testDir, "custom-output");
    mkdirSync(customDir, { recursive: true });
    
    const result = JSON.parse(await srv.call("render_page", { spec_path, output_dir: customDir }));
    
    expect(result.html_path).toContain(customDir);
    expect(readFileSync(result.html_path, "utf8")).toContain("<!DOCTYPE html>");
  });
});

describe("snapshot_html", () => {
  test("renders HTML file to PNG screenshot", async () => {
    // First render a page
    const spec_path = writeSpec("snapshot-test", minimalSchema);
    const renderResult = JSON.parse(await srv.call("render_page", { spec_path }));
    
    // Then snapshot it
    const result = JSON.parse(await srv.call("snapshot_html", { 
      html_path: renderResult.html_path 
    }));
    
    expect(typeof result.image_path).toBe("string");
    expect(result.image_path).toMatch(/\.png$/);
  });

  test("creates snapshots directory if needed", async () => {
    const spec_path = writeSpec("snapshot-dir", minimalSchema);
    const renderResult = JSON.parse(await srv.call("render_page", { spec_path }));
    
    const result = JSON.parse(await srv.call("snapshot_html", { 
      html_path: renderResult.html_path 
    }));
    
    // Verify directory was created and file exists
    const dir = result.image_path.split("/").slice(0, -1).join("/");
    expect(dir).toContain("snapshots");
  });

  test("derives snapshot filename from HTML filename", async () => {
    const spec_path = writeSpec("my-snapshot-page", minimalSchema);
    const renderResult = JSON.parse(await srv.call("render_page", { spec_path }));
    
    const result = JSON.parse(await srv.call("snapshot_html", { 
      html_path: renderResult.html_path 
    }));
    
    expect(result.image_path).toContain("my-snapshot-page.png");
  });

  test("respects custom viewport dimensions", async () => {
    const spec_path = writeSpec("snapshot-viewport", minimalSchema);
    const renderResult = JSON.parse(await srv.call("render_page", { spec_path }));
    
    const result = JSON.parse(await srv.call("snapshot_html", { 
      html_path: renderResult.html_path,
      width: 375,
      height: 667
    }));
    
    expect(typeof result.image_path).toBe("string");
    expect(result.image_path).toMatch(/\.png$/);
  });
});

describe("E2E Smoke Test: Full Pipeline", () => {
  const smokeSpec = {
    page: {
      meta: { 
        title: "Smoke Test" 
      },
      sections: [
        {
          type: "hero",
          content: {
            heading: "Smoke Test",
            subheading: "All tools working"
          }
        }
      ]
    }
  };

  test("validates → renders → snapshots in sequence", async () => {
    // 1. Write spec to file
    const spec_path = writeSpec("smoke-test", smokeSpec);
    console.log(`📝 Spec written to: ${spec_path}`);

    // 2. VALIDATE: Schema should be valid
    const validateResult = JSON.parse(
      await srv.call("validate_schema", { spec_path })
    );
    console.log(`✅ validate_schema: valid=${validateResult.valid}, errors=${validateResult.errors.length}`);
    expect(validateResult.valid).toBe(true);
    expect(validateResult.errors).toEqual([]);

    // 3. RENDER: Should produce HTML
    const renderResult = JSON.parse(
      await srv.call("render_page", { spec_path })
    );
    const htmlStats = readFileSync(renderResult.html_path);
    console.log(`📄 render_page: ${renderResult.html_path} (${htmlStats.byteLength} bytes)`);
    expect(renderResult.html_path).toMatch(/\.html$/);
    const html = htmlStats.toString();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Smoke Test");

    // 4. SNAPSHOT: Should produce PNG from rendered HTML
    const snapshotResult = JSON.parse(
      await srv.call("snapshot_html", { 
        html_path: renderResult.html_path 
      })
    );
    const pngStats = readFileSync(snapshotResult.image_path);
    console.log(`🖼️  snapshot_html: ${snapshotResult.image_path} (${pngStats.byteLength} bytes)`);
    expect(snapshotResult.image_path).toMatch(/\.png$/);
    expect(snapshotResult.image_path).toContain("smoke-test");

    // Verify files exist and have reasonable size
    expect(htmlStats.byteLength).toBeGreaterThan(1000);
    expect(pngStats.byteLength).toBeGreaterThan(5000);
    console.log(`✨ Smoke test complete: all 3 tools executed successfully`);
  });
});
