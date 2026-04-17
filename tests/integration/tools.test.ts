import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { spawnServer, type TestServer } from "../helpers/server.js";
import { writeFileSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { stringify } from "yaml";

let srv: TestServer;
const testDir = join(process.cwd(), "test-specs");
const renderedDir = join(testDir, "rendered");

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
          cta: { text: "Get Started", href: "/start" },
        },
      },
      {
        type: "features",
        variant: "grid-3",
        heading: "Features",
        items: [
          { title: "Fast", description: "Very fast" },
          { title: "Easy", description: "Very easy" },
          { title: "Reliable", description: "Very reliable" },
        ],
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
  mkdirSync(renderedDir, { recursive: true });
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
  test("server exposes all pipeline tools", async () => {
    const tools = await srv.listTools();
    expect(tools.sort()).toEqual([
      "build",
      "create_project",
      "enrich",
      "get_project",
      "lint",
      "list_projects",
      "publish",
      "scaffold",
      "snapshot",
      "style",
    ]);
  });
});

describe("lint", () => {
  test("returns valid:true for a well-formed schema", async () => {
    const spec_path = writeSpec("lint-minimal", minimalSchema);
    const result = JSON.parse(await srv.call("lint", { spec_path }));
    expect(typeof result.lint_path).toBe("string");
    expect(result.valid).toBe(true);
    expect(result.errors).toBe(0);
  });

  test("returns valid:false with errors for missing required fields", async () => {
    const badSchema = {
      page: {
        sections: [
          { type: "hero" }, // missing content.heading
        ],
      },
    };
    const spec_path = writeSpec("lint-missing", badSchema);
    const result = JSON.parse(await srv.call("lint", { spec_path }));
    expect(result.valid).toBe(false);
    expect(result.errors).toBeGreaterThan(0);
  });

  test("returns valid:false for invalid section type", async () => {
    const badSchema = {
      page: {
        sections: [{ type: "totally-unknown-type" }],
      },
    };
    const spec_path = writeSpec("lint-badtype", badSchema);
    const result = JSON.parse(await srv.call("lint", { spec_path }));
    expect(result.valid).toBe(false);
    expect(result.errors).toBeGreaterThan(0);
  });

  test("returns warnings for missing metadata", async () => {
    const schemaNoMeta = {
      page: {
        sections: [{ type: "hero", content: { heading: "Hi" } }],
      },
    };
    const spec_path = writeSpec("lint-nometa", schemaNoMeta);
    const result = JSON.parse(await srv.call("lint", { spec_path }));
    expect(result.warnings).toBeGreaterThan(0);
  });
});

describe("scaffold", () => {
  test("builds RenderNode tree from lint artifact", async () => {
    const spec_path = writeSpec("scaffold-test", minimalSchema);
    await srv.call("lint", { spec_path });
    
    const scaffoldResult = JSON.parse(
      await srv.call("scaffold", { spec_path })
    );
    
    expect(typeof scaffoldResult.scaffold_path).toBe("string");
    expect(scaffoldResult.scaffold_path).toMatch(/\.scaffold\.json$/);
    expect(scaffoldResult.section_count).toBeGreaterThan(0);
  });
});

describe("enrich", () => {
  test("resolves CSS classes from RenderNode tree", async () => {
    const spec_path = writeSpec("enrich-test", minimalSchema);
    await srv.call("lint", { spec_path });
    await srv.call("scaffold", { spec_path });
    
    const enrichResult = JSON.parse(
      await srv.call("enrich", { spec_path })
    );
    
    expect(typeof enrichResult.enrich_path).toBe("string");
    expect(enrichResult.enrich_path).toMatch(/\.enrich\.json$/);
    expect(enrichResult.section_count).toBeGreaterThan(0);
  });
});

describe("style", () => {
  test("generates complete HTML from enriched tree", async () => {
    const spec_path = writeSpec("style-test", fullSchema);
    await srv.call("lint", { spec_path });
    await srv.call("scaffold", { spec_path });
    await srv.call("enrich", { spec_path });
    
    const styleResult = JSON.parse(
      await srv.call("style", { spec_path })
    );
    
    expect(typeof styleResult.html_path).toBe("string");
    expect(styleResult.html_path).toMatch(/\.html$/);
    expect(styleResult.bytes).toBeGreaterThan(1000);

    const html = readFileSync(styleResult.html_path, "utf8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Full Test Page");
    expect(html).toContain("<style>");
    expect(html).toContain("--accent");
  });
});

describe("snapshot", () => {
  test("captures HTML to PNG screenshot", async () => {
    const spec_path = writeSpec("snapshot-test", minimalSchema);
    await srv.call("lint", { spec_path });
    await srv.call("scaffold", { spec_path });
    await srv.call("enrich", { spec_path });
    await srv.call("style", { spec_path });
    
    const snapshotResult = JSON.parse(
      await srv.call("snapshot", { spec_path })
    );
    
    expect(typeof snapshotResult.image_path).toBe("string");
    expect(snapshotResult.image_path).toMatch(/\.png$/);
    expect(readFileSync(snapshotResult.image_path).byteLength).toBeGreaterThan(5000);
  });

  test("respects custom viewport dimensions", async () => {
    const spec_path = writeSpec("snapshot-viewport", minimalSchema);
    await srv.call("lint", { spec_path });
    await srv.call("scaffold", { spec_path });
    await srv.call("enrich", { spec_path });
    await srv.call("style", { spec_path });
    
    const snapshotResult = JSON.parse(
      await srv.call("snapshot", { 
        spec_path,
        width: 375,
        height: 667
      })
    );
    
    expect(snapshotResult.image_path).toMatch(/\.png$/);
  });
});

describe("E2E Pipeline: Full Render Chain", () => {
  const smokeSpec = {
    page: {
      meta: { 
        title: "Smoke Test" 
      },
      layout: {
        theme: "ink"
      },
      sections: [
        {
          type: "navigation",
          links: [{ text: "Home", href: "/" }]
        },
        {
          type: "hero",
          content: {
            heading: "Smoke Test",
            subheading: "All tools working"
          }
        },
        {
          type: "features",
          variant: "grid-3",
          items: [
            { title: "Feature 1", description: "desc1" },
            { title: "Feature 2", description: "desc2" }
          ]
        },
        {
          type: "footer",
          copyright: "2024 Test"
        }
      ]
    }
  };

  test("lint → scaffold → enrich → style → snapshot chain", async () => {
    const spec_path = writeSpec("smoke-test", smokeSpec);
    console.log(`📝 Spec written to: ${spec_path}`);

    // 1. LINT
    const lintResult = JSON.parse(
      await srv.call("lint", { spec_path })
    );
    console.log(`✅ lint: valid=${lintResult.valid}, errors=${lintResult.errors}`);
    expect(lintResult.valid).toBe(true);

    // 2. SCAFFOLD
    const scaffoldResult = JSON.parse(
      await srv.call("scaffold", { spec_path })
    );
    console.log(`📐 scaffold: ${scaffoldResult.scaffold_path} (${scaffoldResult.section_count} sections)`);
    expect(scaffoldResult.section_count).toBeGreaterThan(0);

    // 3. ENRICH
    const enrichResult = JSON.parse(
      await srv.call("enrich", { spec_path })
    );
    console.log(`💎 enrich: ${enrichResult.enrich_path} (${enrichResult.section_count} sections)`);
    expect(enrichResult.section_count).toBe(scaffoldResult.section_count);

    // 4. STYLE
    const styleResult = JSON.parse(
      await srv.call("style", { spec_path })
    );
    console.log(`🎨 style: ${styleResult.html_path} (${styleResult.bytes} bytes)`);
    expect(styleResult.html_path).toMatch(/\.html$/);

    // 5. SNAPSHOT
    const snapshotResult = JSON.parse(
      await srv.call("snapshot", { spec_path })
    );
    const pngSize = readFileSync(snapshotResult.image_path).byteLength;
    console.log(`🖼️  snapshot: ${snapshotResult.image_path} (${pngSize} bytes)`);
    expect(snapshotResult.image_path).toMatch(/\.png$/);
    expect(pngSize).toBeGreaterThan(5000);

    console.log(`✨ Full pipeline complete: 5 stages executed successfully`);
  });
});
