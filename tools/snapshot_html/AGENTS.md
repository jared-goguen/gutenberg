# Snapshot HTML to Image

Visual QA checkpoint. Captures full-page screenshot of rendered HTML in headless browser. Used for visual regression testing, documentation, and pre-deployment preview.

## Type Signature

```typescript
snapshot_html(
  html_path: HTMLFilePath,              // Rendered HTML file to screenshot
  output_dir?: DirectoryPath,           // Optional output directory (defaults to pages/snapshots/)
  width?: number,                       // Browser viewport width (default: 1440)
  height?: number                       // Browser viewport height (default: 900)
) → {
  image_path: ImageFilePath             // Path to captured PNG on disk
}
```

## Usage Examples

**Desktop screenshot (default 1440x900):**
```javascript
snapshot_html(html_path="/path/to/rendered/landing.html")
→ {image_path: "/path/to/snapshots/landing.png"}
```

**Mobile preview (iPhone 12 dimensions):**
```javascript
snapshot_html(
  html_path="/path/to/rendered/landing.html",
  width=390,
  height=844
)
→ {image_path: "/path/to/snapshots/landing.png"}
```

**Custom output directory:**
```javascript
snapshot_html(
  html_path="/path/to/rendered/page.html",
  output_dir="/tmp/qa-screenshots"
)
```

## What Gets Captured

- ✅ **Full page height** - Entire page vertically (not just viewport)
- ✅ **Dark mode** - Colors exactly as rendered (theme applied in HTML)
- ✅ **All assets** - Images, styles, layout (fully rendered)
- ✅ **Interactive state** - After network idle (all JS/CSS loads complete)

## Capture Process

1. Reads HTML file from disk
2. Launches headless Chromium browser
3. Sets viewport dimensions (width × height)
4. Loads HTML into browser
5. Waits for network idle (all resources loaded)
6. Captures full-page screenshot (height extends to content length)
7. Writes PNG to `{output_dir}/{basename}.png`
8. Returns absolute path to PNG file

## Viewport Presets

Use these common dimensions for consistent QA:

| Device | Width | Height | Usage |
|--------|-------|--------|-------|
| Desktop | 1440 | 900 | Default, laptop/desktop |
| Tablet | 768 | 1024 | iPad landscape |
| Mobile | 375 | 667 | iPhone SE, mobile first |
| Wide | 1920 | 1080 | Ultra-wide monitor |

## Complete Pipeline

```
YAML Spec
  ↓ validate_schema(spec_path)
{valid: true}
  ↓
render_page(spec_path)
  ↓
HTML File
  ↓ snapshot_html(html_path) ← YOU ARE HERE
  ↓
PNG Screenshot (for visual QA)
  ↓ deploy_directory(directory)
🌍 https://short-id.project.pages.dev (LIVE)
```

## Use Cases

1. **Visual Regression Testing** - Compare before/after screenshots
2. **QA Preview** - Review design before deployment
3. **Documentation** - Screenshots of rendered pages for docs/blog
4. **Design Review** - Share with team before publishing

## Design Decisions

- **PNG only** - Lossless format, best for UI screenshots
- **Full page** - Always captures entire height, not just viewport
- **No annotations** - Plain screenshot, no overlays or markup
- **Headless Chromium** - Same rendering engine as Chrome, matches production
