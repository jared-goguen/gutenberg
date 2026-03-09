# Gutenberg Snapshot Tool - Implementation Plan

## 1. Overview

### Tool Name
`gutenberg_snapshot` (internally exported as `snapshot`)

### Purpose
Render arbitrary HTML content in a headless browser and return a base64-encoded screenshot. Unlike `snapshot_page` which works with YAML specs and Cloudflare Pages, this tool accepts raw HTML and works entirely locally.

### Key Features
- Headless browser rendering using Puppeteer (already a dependency)
- Configurable viewport dimensions (width/height)
- Optional clip region to zoom into specific page areas
- Base64-encoded PNG image output (no disk I/O required)
- Full page capture or viewport-only capture
- No external dependencies (no Cloudflare Pages deployment)

### Primary Entropy Dimensions (Configurability)
1. **HTML Content** - Any valid HTML string
2. **Viewport Size** - Width and height in pixels
3. **Clip Region** - X, Y, width, height to capture specific area
4. **Full Page Mode** - Capture entire scrollable content vs viewport only
5. **Image Format** - PNG or JPEG (PNG default for better quality)
6. **Image Quality** - 0-100 for JPEG compression (if JPEG format selected)

---

## 2. Prerequisites

### Current Dependencies (Verified)
From `/home/jared/source/gutenberg/package.json`:
```json
{
  "dependencies": {
    "puppeteer": "^21.0.0"
  }
}
```

✅ **Puppeteer is already installed** - No additional packages needed!

### Bun Compatibility
✅ **Puppeteer works with Bun** - The `snapshot_page` tool already uses Puppeteer successfully in the Bun runtime (see `/home/jared/source/gutenberg/tools/snapshot_page/index.ts`)

### What Needs to be Installed
**Nothing!** All dependencies are already present.

### Additional Notes
- Puppeteer will download Chromium automatically on first use (if not already cached)
- The browser runs in headless mode (no GUI required)
- Works in Docker/CI environments

---

## 3. File Structure

Create these exact files in `/home/jared/source/gutenberg/tools/snapshot/`:

```
/home/jared/source/gutenberg/tools/snapshot/
├── index.ts              # Handler implementation
├── schema.json           # Input/output JSON schemas
├── purpose.md            # MCP tool description
└── IMPLEMENTATION_PLAN.md # This file (for reference)
```

### File Purposes
- **index.ts**: Exports `snapshot()` async function - the tool handler
- **schema.json**: Defines the MCP tool's input parameters and output structure
- **purpose.md**: First line becomes the tool description in the MCP protocol

---

## 4. Schema Definition (schema.json)

Create `/home/jared/source/gutenberg/tools/snapshot/schema.json`:

```json
{
  "input": {
    "type": "object",
    "properties": {
      "html": {
        "type": "string",
        "description": "HTML content to render. Must be a complete HTML document with <!DOCTYPE html> or will be wrapped in minimal HTML structure."
      },
      "viewport": {
        "type": "object",
        "properties": {
          "width": {
            "type": "number",
            "description": "Viewport width in pixels",
            "default": 1440,
            "minimum": 100,
            "maximum": 3840
          },
          "height": {
            "type": "number",
            "description": "Viewport height in pixels",
            "default": 900,
            "minimum": 100,
            "maximum": 2160
          }
        },
        "description": "Browser viewport dimensions (default: 1440x900)"
      },
      "clip": {
        "type": "object",
        "properties": {
          "x": {
            "type": "number",
            "description": "X coordinate of top-left corner in pixels",
            "minimum": 0
          },
          "y": {
            "type": "number",
            "description": "Y coordinate of top-left corner in pixels",
            "minimum": 0
          },
          "width": {
            "type": "number",
            "description": "Width of clip region in pixels",
            "minimum": 1
          },
          "height": {
            "type": "number",
            "description": "Height of clip region in pixels",
            "minimum": 1
          }
        },
        "required": ["x", "y", "width", "height"],
        "description": "Optional clipping region to capture only a specific area of the page"
      },
      "full_page": {
        "type": "boolean",
        "description": "Capture entire scrollable page instead of just viewport (default: false). Ignored if clip is specified.",
        "default": false
      },
      "format": {
        "type": "string",
        "enum": ["png", "jpeg"],
        "description": "Image format (default: png)",
        "default": "png"
      },
      "quality": {
        "type": "number",
        "description": "Image quality for JPEG format, 0-100 (default: 90). Ignored for PNG.",
        "default": 90,
        "minimum": 0,
        "maximum": 100
      },
      "wait_for": {
        "type": "number",
        "description": "Milliseconds to wait after page load before capturing (default: 500). Useful for animations/transitions.",
        "default": 500,
        "minimum": 0,
        "maximum": 30000
      }
    },
    "required": ["html"],
    "additionalProperties": false
  },
  "output": {
    "type": "object",
    "properties": {
      "image": {
        "type": "string",
        "description": "Base64-encoded image data (without data URI prefix)"
      },
      "format": {
        "type": "string",
        "enum": ["png", "jpeg"],
        "description": "Image format used"
      },
      "dimensions": {
        "type": "object",
        "properties": {
          "width": {
            "type": "number",
            "description": "Actual captured image width in pixels"
          },
          "height": {
            "type": "number",
            "description": "Actual captured image height in pixels"
          }
        },
        "required": ["width", "height"],
        "description": "Actual dimensions of captured image"
      },
      "viewport": {
        "type": "object",
        "properties": {
          "width": {
            "type": "number",
            "description": "Browser viewport width used"
          },
          "height": {
            "type": "number",
            "description": "Browser viewport height used"
          }
        },
        "required": ["width", "height"],
        "description": "Browser viewport dimensions used for rendering"
      },
      "size_bytes": {
        "type": "number",
        "description": "Size of base64-decoded image data in bytes"
      },
      "timestamp": {
        "type": "string",
        "description": "ISO 8601 timestamp when snapshot was captured"
      }
    },
    "required": ["image", "format", "dimensions", "viewport", "size_bytes", "timestamp"]
  }
}
```

### Schema Notes
- `additionalProperties: false` is **required** per Gutenberg conventions
- All numeric constraints prevent invalid inputs
- Defaults are explicitly documented
- Output schema is complete and deterministic

---

## 5. Purpose Document (purpose.md)

Create `/home/jared/source/gutenberg/tools/snapshot/purpose.md`:

```markdown
Render HTML in headless browser and return base64-encoded screenshot with configurable dimensions and clip regions

## Usage Examples

### Basic snapshot
Capture a viewport-sized screenshot (1440x900 default):
```json
{
  "html": "<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>"
}
```

### Custom viewport
Capture with specific viewport dimensions:
```json
{
  "html": "<html>...</html>",
  "viewport": { "width": 1920, "height": 1080 }
}
```

### Clip region
Zoom into a specific area (useful for capturing components):
```json
{
  "html": "<html>...</html>",
  "viewport": { "width": 1440, "height": 900 },
  "clip": { "x": 100, "y": 200, "width": 500, "height": 300 }
}
```

### Full page capture
Capture entire scrollable content:
```json
{
  "html": "<html>...</html>",
  "full_page": true
}
```

### JPEG with quality
Smaller file size with compression:
```json
{
  "html": "<html>...</html>",
  "format": "jpeg",
  "quality": 80
}
```

## Return Value

Returns base64-encoded image data (without `data:` URI prefix):
```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "format": "png",
  "dimensions": { "width": 1440, "height": 900 },
  "viewport": { "width": 1440, "height": 900 },
  "size_bytes": 245830,
  "timestamp": "2026-03-08T10:30:45.123Z"
}
```

To use in HTML: `<img src="data:image/png;base64,${image}" />`

## Technical Details

- Uses Puppeteer headless Chromium
- No disk I/O (everything in memory)
- No external services required
- Supports incomplete HTML (auto-wraps in minimal structure)
- Wait time allows animations/transitions to complete
```

---

## 6. Handler Implementation (index.ts)

Create `/home/jared/source/gutenberg/tools/snapshot/index.ts`:

### Step-by-Step Pseudocode

```typescript
// STEP 1: Import dependencies
import puppeteer, { Browser, Page } from "puppeteer";

// STEP 2: Define input/output types
interface SnapshotInput {
  html: string;
  viewport?: { width: number; height: number };
  clip?: { x: number; y: number; width: number; height: number };
  full_page?: boolean;
  format?: "png" | "jpeg";
  quality?: number;
  wait_for?: number;
}

interface SnapshotOutput {
  image: string;
  format: "png" | "jpeg";
  dimensions: { width: number; height: number };
  viewport: { width: number; height: number };
  size_bytes: number;
  timestamp: string;
}

// STEP 3: Export handler function
export async function snapshot(input: SnapshotInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  // STEP 4: Extract and validate inputs
  // STEP 5: Wrap HTML if incomplete
  // STEP 6: Launch browser
  // STEP 7: Create page and set viewport
  // STEP 8: Set HTML content
  // STEP 9: Wait for rendering
  // STEP 10: Capture screenshot
  // STEP 11: Convert to base64
  // STEP 12: Calculate dimensions and size
  // STEP 13: Clean up browser
  // STEP 14: Return formatted output
}
```

### Complete Implementation

```typescript
import puppeteer, { Browser, Page } from "puppeteer";

/**
 * Input type matching schema.json
 */
interface SnapshotInput {
  html: string;
  viewport?: { width: number; height: number };
  clip?: { x: number; y: number; width: number; height: number };
  full_page?: boolean;
  format?: "png" | "jpeg";
  quality?: number;
  wait_for?: number;
}

/**
 * Output type matching schema.json
 */
interface SnapshotOutput {
  image: string;
  format: "png" | "jpeg";
  dimensions: { width: number; height: number };
  viewport: { width: number; height: number };
  size_bytes: number;
  timestamp: string;
}

/**
 * Render HTML in headless browser and return base64-encoded screenshot
 */
export async function snapshot(input: SnapshotInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  // STEP 4: Extract and validate inputs
  const {
    html,
    viewport = { width: 1440, height: 900 },
    clip,
    full_page = false,
    format = "png",
    quality = 90,
    wait_for = 500,
  } = input;

  // Validate viewport dimensions
  if (viewport.width < 100 || viewport.width > 3840) {
    throw new Error("Viewport width must be between 100 and 3840 pixels");
  }
  if (viewport.height < 100 || viewport.height > 2160) {
    throw new Error("Viewport height must be between 100 and 2160 pixels");
  }

  // Validate clip region if provided
  if (clip) {
    if (clip.x < 0 || clip.y < 0) {
      throw new Error("Clip coordinates must be non-negative");
    }
    if (clip.width < 1 || clip.height < 1) {
      throw new Error("Clip dimensions must be at least 1 pixel");
    }
  }

  // Validate quality for JPEG
  if (format === "jpeg" && (quality < 0 || quality > 100)) {
    throw new Error("Quality must be between 0 and 100");
  }

  // Validate wait time
  if (wait_for < 0 || wait_for > 30000) {
    throw new Error("wait_for must be between 0 and 30000 milliseconds");
  }

  // STEP 5: Wrap HTML if incomplete
  const processedHTML = ensureCompleteHTML(html);

  let browser: Browser | null = null;

  try {
    // STEP 6: Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Overcome limited resource problems
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    // STEP 7: Create page and set viewport
    const page: Page = await browser.newPage();
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1, // Use 1x for consistent sizing
    });

    // STEP 8: Set HTML content
    // Use setContent instead of goto for local HTML rendering
    await page.setContent(processedHTML, {
      waitUntil: "networkidle0", // Wait for all network requests to finish
      timeout: 30000,
    });

    // STEP 9: Wait for rendering
    if (wait_for > 0) {
      await page.waitForTimeout(wait_for);
    }

    // STEP 10: Capture screenshot
    let screenshotBuffer: Buffer;

    if (full_page && !clip) {
      // Full page mode: adjust viewport to full content height
      const fullHeight = await page.evaluate(
        () => document.documentElement.scrollHeight
      );
      await page.setViewport({
        width: viewport.width,
        height: fullHeight,
        deviceScaleFactor: 1,
      });

      screenshotBuffer = (await page.screenshot({
        type: format,
        quality: format === "jpeg" ? quality : undefined,
        fullPage: false, // We already adjusted viewport
      })) as Buffer;
    } else if (clip) {
      // Clip region mode
      screenshotBuffer = (await page.screenshot({
        type: format,
        quality: format === "jpeg" ? quality : undefined,
        clip: {
          x: clip.x,
          y: clip.y,
          width: clip.width,
          height: clip.height,
        },
      })) as Buffer;
    } else {
      // Normal viewport capture
      screenshotBuffer = (await page.screenshot({
        type: format,
        quality: format === "jpeg" ? quality : undefined,
      })) as Buffer;
    }

    // STEP 11: Convert to base64
    const base64Image = screenshotBuffer.toString("base64");

    // STEP 12: Calculate dimensions and size
    const actualDimensions = await calculateImageDimensions(
      screenshotBuffer,
      clip,
      full_page,
      page,
      viewport
    );

    const output: SnapshotOutput = {
      image: base64Image,
      format,
      dimensions: actualDimensions,
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
      size_bytes: screenshotBuffer.length,
      timestamp: new Date().toISOString(),
    };

    // STEP 13: Clean up browser (in finally block below)

    // STEP 14: Return formatted output
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(output),
        },
      ],
    };
  } catch (error) {
    // Handle errors gracefully
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to capture snapshot: ${errorMessage}`);
  } finally {
    // STEP 13: Always clean up browser
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Ensure HTML is a complete document with <!DOCTYPE html>
 */
function ensureCompleteHTML(html: string): string {
  const trimmed = html.trim();

  // Check if it starts with DOCTYPE (case-insensitive)
  if (/^<!DOCTYPE\s+html>/i.test(trimmed)) {
    return html;
  }

  // Check if it has <html> tag
  if (/<html[>\s]/i.test(trimmed)) {
    // Has <html> but no DOCTYPE - add DOCTYPE
    return `<!DOCTYPE html>\n${html}`;
  }

  // Incomplete HTML - wrap in minimal structure
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Calculate actual image dimensions based on capture mode
 */
async function calculateImageDimensions(
  buffer: Buffer,
  clip: { x: number; y: number; width: number; height: number } | undefined,
  full_page: boolean,
  page: Page,
  viewport: { width: number; height: number }
): Promise<{ width: number; height: number }> {
  if (clip) {
    // Clip region - dimensions are exactly the clip size
    return { width: clip.width, height: clip.height };
  }

  if (full_page) {
    // Full page - get actual scrollHeight
    const fullHeight = await page.evaluate(
      () => document.documentElement.scrollHeight
    );
    return { width: viewport.width, height: fullHeight };
  }

  // Normal viewport capture - use viewport dimensions
  return { width: viewport.width, height: viewport.height };
}
```

### Error Handling Requirements

The implementation includes:
1. ✅ **Input validation** - All numeric bounds checked before browser launch
2. ✅ **Try-catch-finally** - Browser always closed even on error
3. ✅ **Timeout protection** - 30s timeout on page.setContent
4. ✅ **Clear error messages** - All errors wrapped with context
5. ✅ **Resource cleanup** - Browser closed in finally block

### Browser Lifecycle Management

1. **Launch**: `puppeteer.launch()` with headless mode and safe args
2. **Create page**: `browser.newPage()` for isolated context
3. **Set viewport**: `page.setViewport()` for consistent rendering
4. **Load content**: `page.setContent()` instead of `goto()` for local HTML
5. **Wait**: `page.waitForTimeout()` for animations/transitions
6. **Capture**: `page.screenshot()` with appropriate options
7. **Close**: `browser.close()` in finally block (CRITICAL!)

### Puppeteer API Calls Reference

```typescript
// Launch browser
const browser = await puppeteer.launch({ headless: true, args: [...] });

// Create page
const page = await browser.newPage();

// Set viewport
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

// Load HTML content
await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

// Wait for rendering
await page.waitForTimeout(500);

// Get scroll height (for full page)
const height = await page.evaluate(() => document.documentElement.scrollHeight);

// Take screenshot
const buffer = await page.screenshot({
  type: "png", // or "jpeg"
  quality: 90, // JPEG only
  fullPage: false,
  clip: { x: 0, y: 0, width: 100, height: 100 }, // Optional
});

// Close browser
await browser.close();
```

---

## 7. Implementation Checklist

Execute these tasks **in order**. Mark each as complete before moving to the next.

### Phase 1: File Creation
- [ ] Create `/home/jared/source/gutenberg/tools/snapshot/schema.json` with complete input/output schemas
- [ ] Create `/home/jared/source/gutenberg/tools/snapshot/purpose.md` with tool description and examples
- [ ] Create `/home/jared/source/gutenberg/tools/snapshot/index.ts` with imports only

### Phase 2: Type Definitions
- [ ] Add `SnapshotInput` interface to `index.ts`
- [ ] Add `SnapshotOutput` interface to `index.ts`
- [ ] Add JSDoc comments to both interfaces

### Phase 3: Helper Functions
- [ ] Implement `ensureCompleteHTML(html: string): string` function
- [ ] Implement `calculateImageDimensions(...)` function
- [ ] Add JSDoc comments to helper functions

### Phase 4: Main Handler - Input Processing
- [ ] Implement `snapshot()` function signature
- [ ] Add input destructuring with defaults
- [ ] Add viewport dimension validation (100-3840 width, 100-2160 height)
- [ ] Add clip region validation (non-negative coordinates, positive dimensions)
- [ ] Add quality validation (0-100 for JPEG)
- [ ] Add wait_for validation (0-30000 milliseconds)

### Phase 5: Main Handler - Browser Operations
- [ ] Add `let browser: Browser | null = null` before try block
- [ ] Add try-catch-finally structure
- [ ] Implement `puppeteer.launch()` with headless options
- [ ] Implement `browser.newPage()`
- [ ] Implement `page.setViewport()`
- [ ] Implement `page.setContent()` with `waitUntil: "networkidle0"`
- [ ] Implement `page.waitForTimeout()` for wait_for

### Phase 6: Main Handler - Screenshot Capture
- [ ] Add conditional for `full_page && !clip` mode
  - [ ] Get scrollHeight with `page.evaluate()`
  - [ ] Adjust viewport to full height
  - [ ] Take screenshot
- [ ] Add conditional for `clip` mode
  - [ ] Take screenshot with clip parameter
- [ ] Add else branch for normal viewport mode
  - [ ] Take screenshot without special options

### Phase 7: Main Handler - Output Processing
- [ ] Convert Buffer to base64 with `toString("base64")`
- [ ] Call `calculateImageDimensions()` to get actual dimensions
- [ ] Construct `SnapshotOutput` object
- [ ] Return formatted `{ content: [{ type: "text", text: JSON.stringify(output) }] }`

### Phase 8: Main Handler - Error Handling
- [ ] Add catch block with error message wrapping
- [ ] Add finally block with `browser?.close()`
- [ ] Verify browser is always closed

### Phase 9: Code Quality
- [ ] Add JSDoc comment to `snapshot()` function
- [ ] Verify all types are correct
- [ ] Check for TypeScript errors with `bun run build`
- [ ] Format code with `bun run format` (if available)

### Phase 10: Integration
- [ ] Run `/rebuild` from rosetta directory to regenerate schema bundle
- [ ] Verify `gutenberg_snapshot` appears in `rosetta/rosetta.schema.json`
- [ ] Check that input/output schemas match

---

## 8. Testing Strategy

### Manual Testing Approach

1. **Start the MCP server**:
   ```bash
   cd /home/jared/source/gutenberg
   bun run src/index.ts
   ```

2. **Call the tool via MCP protocol** (use OpenCode or manual MCP client)

### Test Cases

#### Test Case 1: Basic HTML Snapshot
**Input**:
```json
{
  "html": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1 style='color: blue; font-size: 48px;'>Hello World</h1></body></html>"
}
```

**Expected Output**:
- `format`: "png"
- `dimensions`: { "width": 1440, "height": 900 }
- `viewport`: { "width": 1440, "height": 900 }
- `image`: Valid base64 string (starts with "iVBORw0KG..." for PNG)
- `size_bytes`: > 0
- `timestamp`: Valid ISO 8601 string

**Validation**:
- Decode base64 and verify it's a valid PNG
- Image should show blue "Hello World" text

#### Test Case 2: Custom Viewport
**Input**:
```json
{
  "html": "<!DOCTYPE html><html><body><div style='width: 800px; height: 600px; background: red;'></div></body></html>",
  "viewport": { "width": 800, "height": 600 }
}
```

**Expected Output**:
- `dimensions`: { "width": 800, "height": 600 }
- `viewport`: { "width": 800, "height": 600 }

#### Test Case 3: Clip Region
**Input**:
```json
{
  "html": "<!DOCTYPE html><html><body><div style='width: 1000px; height: 1000px; background: linear-gradient(to right, red, blue);'></div></body></html>",
  "clip": { "x": 100, "y": 100, "width": 200, "height": 200 }
}
```

**Expected Output**:
- `dimensions`: { "width": 200, "height": 200 }
- Image should be exactly 200x200 pixels
- Should show a portion of the gradient

#### Test Case 4: Full Page Capture
**Input**:
```json
{
  "html": "<!DOCTYPE html><html><body><div style='height: 3000px; background: linear-gradient(to bottom, white, black);'></div></body></html>",
  "full_page": true
}
```

**Expected Output**:
- `dimensions.width`: 1440
- `dimensions.height`: ~3000 (approximate scrollHeight)
- Image should be very tall

#### Test Case 5: JPEG Format
**Input**:
```json
{
  "html": "<!DOCTYPE html><html><body style='background: yellow;'><h1>JPEG Test</h1></body></html>",
  "format": "jpeg",
  "quality": 80
}
```

**Expected Output**:
- `format`: "jpeg"
- `image`: Valid base64 string (starts with "/9j/" for JPEG)
- `size_bytes`: Smaller than equivalent PNG

#### Test Case 6: Incomplete HTML (Auto-wrap)
**Input**:
```json
{
  "html": "<h1>Just a heading</h1><p>No HTML tags</p>"
}
```

**Expected Output**:
- Should successfully render
- HTML should be auto-wrapped in DOCTYPE/html/head/body

#### Test Case 7: Wait for Animations
**Input**:
```json
{
  "html": "<!DOCTYPE html><html><head><style>@keyframes fade { from { opacity: 0; } to { opacity: 1; } } h1 { animation: fade 2s; }</style></head><body><h1>Fading In</h1></body></html>",
  "wait_for": 2500
}
```

**Expected Output**:
- Screenshot should show fully visible text (animation complete)

### Validation Commands

After capturing a snapshot, validate the base64 data:

```bash
# Decode base64 and save to file
echo "BASE64_STRING" | base64 -d > test-output.png

# View image (Linux)
xdg-open test-output.png

# Check image dimensions
file test-output.png
# Should output: PNG image data, 1440 x 900, 8-bit/color RGBA

# Check file size matches size_bytes
stat -f%z test-output.png  # macOS
stat -c%s test-output.png  # Linux
```

### Error Case Testing

#### Test Invalid Viewport
```json
{ "html": "<html></html>", "viewport": { "width": 50, "height": 900 } }
```
**Expected**: Error "Viewport width must be between 100 and 3840 pixels"

#### Test Invalid Clip
```json
{ "html": "<html></html>", "clip": { "x": -10, "y": 0, "width": 100, "height": 100 } }
```
**Expected**: Error "Clip coordinates must be non-negative"

#### Test Invalid Quality
```json
{ "html": "<html></html>", "format": "jpeg", "quality": 150 }
```
**Expected**: Error "Quality must be between 0 and 100"

---

## 9. Integration Steps

### Step 1: Verify Files Exist
```bash
ls -la /home/jared/source/gutenberg/tools/snapshot/
```
Should show: `index.ts`, `schema.json`, `purpose.md`

### Step 2: Rebuild Schema Bundle
```bash
cd /home/jared/source/rosetta
/rebuild
# OR if /rebuild is a tool:
# Call the rosetta_rebuild tool via MCP
```

This regenerates `/home/jared/source/rosetta/rosetta.schema.json`

### Step 3: Verify Tool Registration
```bash
cat /home/jared/source/rosetta/rosetta.schema.json | grep -A 5 "gutenberg_snapshot"
```

Should show the tool definition with input/output schemas.

### Step 4: Restart Gutenberg Server
```bash
cd /home/jared/source/gutenberg
bun run src/index.ts
```

The server will auto-discover the new tool.

### Step 5: Test Tool Discovery
Use the MCP client to list tools:
```json
{
  "method": "tools/list"
}
```

Should include `gutenberg_snapshot` in the response.

### Step 6: Run First Test
Call the tool with minimal input:
```json
{
  "method": "tools/call",
  "params": {
    "name": "gutenberg_snapshot",
    "arguments": {
      "html": "<!DOCTYPE html><html><body><h1>Test</h1></body></html>"
    }
  }
}
```

Should return valid base64 image data.

---

## 10. Common Issues and Solutions

### Issue: "Browser not found"
**Solution**: Run `bunx puppeteer browsers install chrome`

### Issue: "Cannot find module 'puppeteer'"
**Solution**: Run `bun install` in gutenberg directory

### Issue: "Timeout waiting for page load"
**Solution**: Increase timeout in `page.setContent()` or check HTML for external resource URLs that can't load

### Issue: "Invalid base64 output"
**Solution**: Verify Buffer.toString("base64") is used, not Buffer.toString()

### Issue: "Screenshot is blank/white"
**Solution**: Increase `wait_for` parameter to allow rendering to complete

### Issue: "Browser not closing"
**Solution**: Verify `browser.close()` is in finally block and always executes

---

## 11. Success Criteria

The implementation is complete when:

- ✅ All files created in correct locations
- ✅ TypeScript compiles without errors (`bun run build`)
- ✅ Tool appears in `rosetta.schema.json` after rebuild
- ✅ All 7 test cases pass
- ✅ Error cases throw appropriate error messages
- ✅ Browser always closes (no zombie processes)
- ✅ Base64 output decodes to valid PNG/JPEG
- ✅ MCP protocol response format is correct: `{ content: [{ type: "text", text: "..." }] }`

---

## 12. Reference Material

### Puppeteer Documentation
- **Launch options**: https://pptr.dev/api/puppeteer.puppeteernodelaunchoptions
- **Page.setContent()**: https://pptr.dev/api/puppeteer.page.setcontent
- **Page.screenshot()**: https://pptr.dev/api/puppeteer.page.screenshot
- **Page.setViewport()**: https://pptr.dev/api/puppeteer.page.setviewport

### Gutenberg Conventions (from AGENTS.md)
- Tools import from `../../src/` (two levels up)
- First exported function becomes the tool handler
- Handler returns `{ content: [{ type: "text", text: string }] }`
- `schema.json` must have `additionalProperties: false` in input

### Example Tools to Reference
- `/home/jared/source/gutenberg/tools/snapshot_page/index.ts` - Puppeteer usage
- `/home/jared/source/gutenberg/tools/render_page/index.ts` - Simple handler structure
- `/home/jared/source/gutenberg/tools/validate_schema/index.ts` - Input validation patterns

---

## End of Implementation Plan

This plan contains everything needed to implement the `gutenberg_snapshot` tool without making any decisions. Follow the checklist in order, implement each function as specified, and test with the provided test cases.

**Next Step**: Begin Phase 1 - Create the three required files (schema.json, purpose.md, index.ts).
