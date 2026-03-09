# Validate Page Schema

Pre-flight check for Gutenberg page specifications. Catches errors before rendering—saves time by failing fast instead of rendering broken HTML.

## Type Signature

```typescript
validate_schema(
  spec_path: GutenbergSpecPath
) → {
  valid: boolean,                        // true if no blocking errors
  errors: Array<{path, message}>,       // Blocking validation errors
  warnings: Array<string>               // Non-blocking suggestions
}
```

## Usage Examples

**Basic validation:**
```javascript
validate_schema(spec_path="/path/to/pages/specs/landing.yaml")
→ {
  "valid": true,
  "errors": [],
  "warnings": ["Recommendation: Add meta.description for SEO"]
}
```

**Validation failed:**
```javascript
validate_schema(spec_path="/path/to/invalid.yaml")
→ {
  "valid": false,
  "errors": [
    {path: "page.sections[0].type", message: "Unknown component type 'invalid-hero'"},
    {path: "page.meta.theme", message: "Invalid theme 'rainbow'. Allowed: light, dark, auto"}
  ],
  "warnings": ["Missing navigation section—recommended for discoverability"]
}
```

## Validation Levels

### Blocking Errors (valid=false)
These MUST be fixed before rendering. If present, render_page will fail:
- Missing required YAML structure (missing `page` root key)
- Unknown component type (typo in component name)
- Invalid property values per component (e.g., invalid `theme` value)
- Schema structure violations (wrong data type, missing required fields)
- Component-specific validation (e.g., CTA buttons without links)

### Non-Blocking Warnings (valid=true)
Suggestions for improvement. Spec is renderable, but could be better:
- Missing SEO metadata (title, description, canonical)
- Recommended accessibility attributes
- Best practice suggestions (e.g., "Add navigation for discoverability")
- Missing optional sections

## Complete Pipeline

```
YAML Spec File
  ↓ validate_schema(spec_path) ← YOU ARE HERE
{valid: true/false, errors: [], warnings: []}
  ↓ if valid:true
render_page(spec_path)
  ↓
HTML File (ready for production)
  ↓ snapshot_html(html_path)
PNG Screenshot (for QA/preview)
  ↓ deploy_directory(directory)
🌍 https://short-id.project.pages.dev (LIVE)
```

## Design Philosophy: Files, Not Content

This tool accepts `spec_path` (file path), not inline YAML content. Why?
- File operations are explicit and testable
- Enforces single source of truth (YAML file on disk)
- Compatible with version control and auditing
- Prevents accidental content-via-parameter issues

## Key Behaviors

- **Fast fail:** Returns immediately on first blocking error
- **All warnings:** Collects all non-blocking issues in one pass
- **Detailed paths:** Error `path` field points to exact location (JSON-path style)
- **Actionable messages:** Each error explains what's wrong and how to fix it
