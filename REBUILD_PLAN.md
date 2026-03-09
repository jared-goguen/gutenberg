# Gutenberg Snapshot Tool Rebuild Plan

## Status: render_page complete, snapshot needs rebuild

## Objective
Complete the typed file path architecture for Gutenberg's 4-tool pipeline: validate → render → snapshot → deploy

## Completed
✅ Removed 8 unnecessary tools (only 4 remain)
✅ Defined file path conventions (FILE_CONVENTIONS.md)
✅ Updated render_page to write HTML to disk and return FilePath
✅ Updated render_page schema and AGENTS.md
✅ Updated integration tests to expect 4 tools

## Remaining Tasks

### 1. Rebuild snapshot tool
**File:** `/home/jared/source/gutenberg/tools/snapshot/index.ts`

**Current signature:**
```typescript
snapshot(html: string, width?: number, height?: number, ...) 
  → {image: base64, format, width, height}
```

**New signature:**
```typescript
snapshot(html_path: HTMLFilePath, output_dir?: DirectoryPath)
  → {image_path: ImageFilePath}
```

**Changes:**
- Accept `html_path` parameter (required)
- Accept `output_dir` parameter (optional, defaults to `pages/snapshots/`)
- Read HTML from file instead of accepting as string
- Write PNG to disk instead of returning base64
- Derive output filename from input (e.g., `landing.html` → `landing.png`)
- Remove: `clip`, `format`, `quality` (opinionated: always PNG, full page, default quality)
- Keep: `width`, `height` (optional viewport dimensions, default 1440x900)
- Return: `{image_path: "/absolute/path/to/snapshot.png"}`

**Implementation outline:**
```typescript
import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import { basename, dirname, join } from "path";

export async function handler(input: Record<string, unknown>) {
  const html_path = input.html_path as string;
  const output_dir = (input.output_dir as string) || 
    join(dirname(dirname(html_path)), "snapshots");
  const width = (input.width as number) || 1440;
  const height = (input.height as number) || 900;

  if (!html_path) {
    throw new Error("'html_path' is required");
  }

  // Read HTML from disk
  const html = await fs.readFile(html_path, "utf8");

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Create output directory
    await fs.mkdir(output_dir, { recursive: true });

    // Derive filename from input
    const baseName = basename(html_path, ".html");
    const image_path = join(output_dir, `${baseName}.png`);

    // Capture screenshot
    await page.screenshot({ path: image_path, fullPage: true });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ image_path }),
      }],
    };
  } finally {
    await browser.close();
  }
}
```

### 2. Update snapshot schema
**File:** `/home/jared/source/gutenberg/tools/snapshot/schema.json`

```json
{
  "input": {
    "type": "object",
    "properties": {
      "html_path": {
        "type": "string",
        "description": "Absolute path to rendered HTML file (HTMLFilePath)"
      },
      "output_dir": {
        "type": "string",
        "description": "Optional: Directory to write screenshot (defaults to pages/snapshots/)"
      },
      "width": {
        "type": "number",
        "description": "Viewport width in pixels (default: 1440)",
        "default": 1440
      },
      "height": {
        "type": "number",
        "description": "Viewport height in pixels (default: 900)",
        "default": 900
      }
    },
    "required": ["html_path"],
    "additionalProperties": false
  },
  "output": {
    "type": "object",
    "properties": {
      "image_path": {
        "type": "string",
        "description": "Absolute path to the screenshot PNG file (ImageFilePath)"
      }
    }
  }
}
```

### 3. Update snapshot AGENTS.md
**File:** `/home/jared/source/gutenberg/tools/snapshot/AGENTS.md`

```markdown
# Snapshot HTML to Image

Render an HTML file in a headless browser and capture a full-page screenshot.

## Type Signature

```
snapshot(html_path: HTMLFilePath, output_dir?: DirectoryPath, width?: number, height?: number)
  → {image_path: ImageFilePath}
```

## Usage

```
gutenberg_snapshot(
  html_path="/home/jared/source/pages/rendered/landing-page.html"
)
→ {image_path: "/home/jared/source/pages/snapshots/landing-page.png"}
```

**Optional viewport size:**
```
gutenberg_snapshot(
  html_path="/path/to/page.html",
  width=375,
  height=667
)
```

## Behavior

1. Reads HTML from `html_path`
2. Launches headless Chromium via Puppeteer
3. Sets viewport to specified dimensions (default 1440x900)
4. Renders HTML and waits for network idle
5. Captures full-page screenshot as PNG
6. Writes to `{output_dir}/{name}.png`
7. Returns absolute path to screenshot

**Default output directory:** `pages/snapshots/` (sibling to `pages/rendered/`)

## File Path Contract

- **Input:** `HTMLFilePath` (rendered HTML file)
- **Output:** `ImageFilePath` (PNG written to disk, path returned)

## Opinionated Defaults

- Format: PNG only (no JPEG)
- Mode: Full page (no viewport-only or clip regions)
- Quality: Default Puppeteer PNG quality

## Pipeline Position

```
validate_schema(spec_path) → {valid, errors}
         ↓
render_page(spec_path) → {html_path}
         ↓
snapshot(html_path) → {image_path}  ← YOU ARE HERE
         ↓
deploy_html(directory) → {deployment_url}
```
```

### 4. Add semantic types to Rosetta
**File:** `/home/jared/source/rosetta/types.json`

Add these type definitions:

```json
{
  "GutenbergSpecPath": {
    "description": "Path to a Gutenberg page specification YAML file",
    "base": "string",
    "validation": {
      "pattern": "^.*\\.yaml$",
      "examples": [
        "/home/jared/source/pages/specs/landing.yaml",
        "pages/specs/showcase/homepage.yaml"
      ]
    },
    "related": ["FilePath", "YAMLString"]
  },
  "HTMLFilePath": {
    "description": "Path to a rendered HTML document",
    "base": "string",
    "validation": {
      "pattern": "^.*\\.html$",
      "examples": [
        "/home/jared/source/pages/rendered/landing.html",
        "pages/rendered/homepage.html"
      ]
    },
    "related": ["FilePath", "HTMLString"]
  },
  "ImageFilePath": {
    "description": "Path to an image file (PNG, JPEG, etc.)",
    "base": "string",
    "validation": {
      "pattern": "^.*\\.(png|jpg|jpeg|gif|webp|svg)$",
      "examples": [
        "/home/jared/source/pages/snapshots/landing.png",
        "pages/snapshots/screenshot.png"
      ]
    },
    "related": ["FilePath"]
  }
}
```

### 5. Update integration tests
**File:** `/home/jared/source/gutenberg/tests/integration/tools.test.ts`

The test file has already been partially updated. Complete the following:

1. Remove all test cases that reference deleted tools
2. Update `render_page` tests to expect `{html_path}` output instead of `{html}`
3. Add test for `snapshot` tool:

```typescript
describe("snapshot", () => {
  test("renders HTML file to PNG screenshot", async () => {
    // First render a page
    const spec_path = writeSpec("snapshot-test", minimalSchema);
    const renderResult = JSON.parse(await srv.call("render_page", { spec_path }));
    
    // Then snapshot it
    const result = JSON.parse(await srv.call("snapshot", { 
      html_path: renderResult.html_path 
    }));
    
    expect(typeof result.image_path).toBe("string");
    expect(result.image_path).toMatch(/\.png$/);
    
    // Verify file exists
    const exists = await fs.access(result.image_path).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});
```

### 6. Rebuild Rosetta schema
**Command:**
```bash
cd /home/jared/source/rosetta
bun run src/index.ts rebuild
```

This will regenerate `rosetta.schema.json` with:
- Only 4 Gutenberg tools (validate_schema, render_page, snapshot, deploy_html)
- New semantic types (GutenbergSpecPath, HTMLFilePath, ImageFilePath)
- Updated tool signatures

### 7. Run tests
**Command:**
```bash
cd /home/jared/source/gutenberg
bun test
```

Expected: All tests pass with 4 tools discovered

### 8. Verify end-to-end pipeline
**Manual test:**
```bash
# 1. Validate a spec
gutenberg_validate_schema(spec_path="pages/specs/test-page.yaml")

# 2. Render to HTML
gutenberg_render_page(spec_path="pages/specs/test-page.yaml")
→ {html_path: "pages/rendered/test-page.html"}

# 3. Snapshot to PNG
gutenberg_snapshot(html_path="pages/rendered/test-page.html")
→ {image_path: "pages/snapshots/test-page.png"}

# 4. Deploy
gutenberg_deploy_html(directory="pages/rendered")
→ {deployment_url: "https://...pages.dev"}
```

## Success Criteria

✅ All 4 tools use typed file paths (no content strings)
✅ `rosetta.schema.json` includes semantic types
✅ Integration tests pass
✅ End-to-end pipeline executes without errors
✅ File outputs exist in expected locations:
   - `pages/specs/*.yaml` → input
   - `pages/rendered/*.html` → render output
   - `pages/snapshots/*.png` → snapshot output

## Notes

- The new architecture eliminates MCP parameter size limits
- All intermediate outputs are inspectable on disk
- Type system enforces correct data flow through the pipeline
- Opinionated defaults reduce configuration burden
