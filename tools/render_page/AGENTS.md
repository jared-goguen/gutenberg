# Render Page Spec to HTML

Transforms a Gutenberg page specification (YAML) into a production-ready HTML document with all styles, content, and responsive layouts embedded. Output is ready for deployment, screenshots, or QA.

## Type Signature

```typescript
render_page(
  spec_path: GutenbergSpecPath,           // Path to YAML spec file
  output_dir?: DirectoryPath              // Optional output directory (defaults to pages/rendered/)
) → {
  html_path: HTMLFilePath                 // Path to rendered HTML on disk
}
```

## Usage Examples

**Basic usage (default output directory):**
```javascript
render_page(spec_path="/home/jared/source/pages/specs/landing-page.yaml")
→ {html_path: "/home/jared/source/pages/rendered/landing-page.html"}
```

**Custom output directory:**
```javascript
render_page(
  spec_path="/path/to/specs/campaign.yaml",
  output_dir="/tmp/custom-output"
)
→ {html_path: "/tmp/custom-output/campaign.html"}
```

## What Gets Rendered

The tool transforms YAML into complete, production-ready HTML:

- ✅ **Semantic Components** - Hero, CTA, features, navigation, footer, etc.
- ✅ **Responsive Layout** - Mobile-first CSS with Tailwind classes
- ✅ **Dark Mode** - Colors follow spec's theme (light/dark/auto)
- ✅ **Embedded Styles** - All CSS inlined (no external stylesheets)
- ✅ **Optimized** - Static HTML, no JavaScript needed for rendering

## Rendering Process

1. Parses YAML spec file
2. Validates structure (type checking, required fields)
3. Normalizes sections (applies component defaults)
4. Renders each section with component-specific logic
5. Applies global layout/theme styling
6. Wraps in HTML document (DOCTYPE, meta tags, etc.)
7. Writes to `{output_dir}/{basename}.html`
8. Returns absolute path to file

## File Path Contract

This tool enforces strict type discipline:
- **Input:** `GutenbergSpecPath` (YAML file path, not content)
- **Output:** `HTMLFilePath` (written file, path returned—not content)

No string content parameters. File operations only.

## Complete Pipeline

```
YAML Spec File
  ↓ validate_schema(spec_path)
{valid: true, errors: []}
  ↓
render_page(spec_path) ← YOU ARE HERE
  ↓
HTML File (ready for next step)
  ↓ snapshot_html(html_path)
PNG Screenshot
  ↓ deploy_directory(directory)
🌍 https://short-id.project.pages.dev (LIVE)
```

## Important Notes

- **Idempotent:** Multiple renders of same spec produce identical output
- **Output filename:** Uses basename of spec file (e.g., `landing.yaml` → `landing.html`)
- **Embedded CSS:** No CDN, no external dependencies—HTML is self-contained
- **Ready to deploy:** Output can immediately go to Cloudflare Pages, S3, or any static host