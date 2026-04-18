# Edit Mode: Dynamic, Form-Based Pages

Edit mode is a first-class feature in Gutenberg that enables dynamic, form-based pages (templates) that users can create and edit through the web UI.

## Core Concept

Unlike static pages that are built once, **templates** define reusable structures that create entries at runtime. Users interact with templates through a web form:

1. **View mode** - Display an entry with heat-map colors, read-only
2. **Edit mode** - Form with inputs for all editable sections
3. **Save** - Form submission stores entry in R2, rebuilds index

## Use Cases

- 📝 **Diary/Journal** - Users create daily/weekly entries
- 📝 **Blog** - Authors write posts with dynamic slugs
- 📝 **Form-Based Content** - Surveys, questionnaires, data collection
- 📝 **Personal Tracking** - Habit tracking, mood logs, fitness journeys

## Project Structure

```
my-project/
├── gutenberg.yaml           # Project config
├── pages/                   # Static pages (built once)
│   ├── landing.yaml
│   └── docs.yaml
├── templates/               # Dynamic templates (NOT built)
│   └── diary.yaml          # Template definition with editable sections
├── functions/               # Cloudflare Pages Functions
│   ├── diary/[date].ts     # Handlers for /diary/[date]
│   └── index.ts            # Archive index page
├── data/                    # Local development entries
│   └── diary/
│       ├── 2026-04-17.yaml
│       └── 2026-04-18.yaml
├── rendered/                # Build output (static pages only)
│   ├── landing.html
│   └── docs.html
└── wrangler.toml           # Cloudflare Pages config
```

## Template Structure

Templates are YAML files in `templates/` that define both the structure and metadata:

```yaml
template:
  name: diary
  route: /diary/[date]
  routeParam: date
  storage: r2

page:
  meta:
    title: "Diary Card — {{DATE}}"
    description: "Daily entry for {{DATE}}"
  
  sections:
    - type: hero
      _editable: true
      content:
        heading: "Daily Diary Card — {{DATE}}"
    
    - type: table
      _editable: true
      label: EMOTIONS
      cells:
        - label: Sadness
          value: 0
          type: numeric
          color-scale: [0, 10]
    
    - type: content
      _editable: true
      variant: prose
      markdown: |
        ## Daily Notes
        Add your notes here.
```

### Template Config

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Template identifier (e.g., "diary", "blog-post") |
| `route` | string | URL pattern (e.g., "/diary/[date]", "/posts/[slug]") |
| `routeParam` | string | Route parameter name (e.g., "date", "slug") |
| `storage` | "r2" \| "local" | Where entries are stored |

### Editable Sections

Add `_editable: true` to any section to make it editable:

```yaml
- type: hero
  _editable: true           # Make this section editable
  content:
    heading: "..."

- type: table
  _editable: true           # Users can edit table cells
  label: EMOTIONS
  cells: [...]

- type: content
  _editable: true           # Users can edit markdown
  variant: prose
  markdown: "..."
```

**Placeholders:** Use `{{PARAM}}` in text fields. They're replaced at runtime:

```yaml
heading: "Entry for {{DATE}}"  # Becomes "Entry for 2026-04-17"
```

## Quick Start

### 1. Initialize a Template

```bash
# Create a template with a route and parameter
gutenberg init_template diary --route="/diary/[date]" --param=date

# Creates:
# - templates/diary.yaml
# - functions/diary/[date].ts
# - wrangler.toml
# - data/diary/ (local storage)
```

### 2. Define Your Template

Edit `templates/diary.yaml` to define the structure and sections users can edit.

### 3. Build & Deploy

```bash
# Build the project
gutenberg build

# Deploy to Cloudflare Pages with Workers
wrangler pages deploy ./rendered
```

### 4. Local Development

```bash
# Start local dev server
wrangler pages dev ./rendered

# Visit: http://localhost:8788/diary/2026-04-17
# Visit: http://localhost:8788/diary/2026-04-17?mode=edit
```

## How It Works

### View Mode

1. User visits `/diary/2026-04-17`
2. Worker function:
   - Loads entry from R2: `entries/2026-04-17.yaml`
   - Runs Gutenberg pipeline with `mode: view`
   - Renders HTML with "Edit" button
3. User sees entry displayed with read-only styling

### Edit Mode

1. User visits `/diary/2026-04-17?mode=edit`
2. Worker function:
   - Loads entry (or uses template if new)
   - Runs Gutenberg pipeline with `mode: edit`
   - Renders form with input fields for editable sections
3. User fills form and clicks "Save & Publish"

### Save

1. User submits form (POST)
2. Worker function:
   - Reads form data
   - Converts FormData back to YAML
   - Saves to R2: `entries/2026-04-17.yaml`
   - Rebuilds `index.html` listing all entries
3. Redirects to view mode

## Workers Functions

Workers Functions (in `functions/`) use Gutenberg utilities to handle requests:

```typescript
// functions/diary/[date].ts
import { createEditHandler } from 'gutenberg/workers';

interface Env {
  DIARY_BUCKET: R2Bucket;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { date: string };
}) {
  return createEditHandler({
    templateKey: 'template.yaml',
    bucket: context.env.DIARY_BUCKET,
    routeParam: 'date',
    paramValidator: (date) => /^\d{4}-\d{2}-\d{2}$/.test(date),
  })(context);
}
```

### createEditHandler(config)

Creates a request handler for edit mode templates.

**Parameters:**
- `templateKey` (string) - R2 key where template is stored
- `bucket` (R2Bucket) - R2 bucket binding from wrangler
- `routeParam` (string) - Route parameter name (date, slug, etc)
- `paramValidator` (function, optional) - Validate parameter format
- `onSave` (function, optional) - Custom save handler

**Returns:** Async function that handles GET/POST requests

## Component Editable Properties

### Hero

```yaml
- type: hero
  _editable: true
  content:
    heading: "Edit this heading"
```

Input type: `<input type="text">` for heading

### Table

```yaml
- type: table
  _editable: true
  label: EMOTIONS
  cells:
    - label: Sadness
      value: 5
      type: numeric       # <input type="number">
    - label: Okay
      value: true
      type: bool          # <input type="checkbox">
    - label: Notes
      value: "..."
      type: text          # <input type="text">
```

Input types depend on `cell.type`

### Content

```yaml
- type: content
  _editable: true
  variant: prose
  markdown: "..."
```

Input type: `<textarea>` for markdown

## Local Development

### File-Based Storage

During local development, entries are stored as YAML files:

```
data/diary/
├── 2026-04-17.yaml
├── 2026-04-18.yaml
└── 2026-04-19.yaml
```

This is **git-friendly** - entries can be version controlled.

### Development Workflow

```bash
# 1. Build static pages
gutenberg build

# 2. Start dev server
wrangler pages dev ./rendered

# 3. Visit entry
http://localhost:8788/diary/2026-04-17?mode=edit

# 4. Edit and save
# (Entries saved to local R2 emulation)

# 5. Commit to git
git add data/diary/2026-04-17.yaml
git commit -m "Update diary entry"
```

## Production Deployment

### Prerequisites

- Cloudflare account with Pages + R2
- `wrangler` CLI
- Cloudflare API token

### Deploy

```bash
# 1. Build
gutenberg build

# 2. Create R2 bucket
wrangler r2 bucket create diary-entries

# 3. Upload template
wrangler r2 object put diary-entries template.yaml --file templates/diary.yaml

# 4. Deploy Pages + Functions
wrangler pages deploy ./rendered
```

### Configuration

`wrangler.toml` defines the R2 binding:

```toml
name = "my-project"
pages_build_output_dir = "rendered"

[[r2_buckets]]
binding = "DIARY_BUCKET"
bucket_name = "diary-entries"
```

## API Reference

### Gutenberg Workers Exports

Import from `'gutenberg/workers'`:

```typescript
export { lint, scaffold, enrich, style } from '../pipeline/index.js';
export type { PageSchema, TemplateSchema } from '../types.js';
export { isPageSchema, isTemplateSchema } from '../types.js';
export function createEditHandler(config: EditHandlerConfig): RequestHandler;
```

### EditHandlerConfig

```typescript
interface EditHandlerConfig {
  templateKey: string;           // R2 key for template
  bucket: R2Bucket;              // R2 bucket binding
  routeParam: string;            // URL parameter name
  paramValidator?: (value: string) => boolean;
  onSave?: (data: {
    param: string;
    yaml: string;
    schema: PageSchema;
  }) => Promise<void>;
}
```

## Examples

### Complete Diary Template

See `examples/diary-with-edit/` in the Gutenberg repo for a full working example.

### Creating a Blog

```yaml
# templates/blog-post.yaml
template:
  name: blog-post
  route: /posts/[slug]
  routeParam: slug
  storage: r2

page:
  meta:
    title: "{{SLUG}}"
  sections:
    - type: hero
      _editable: true
      content:
        heading: "{{SLUG}}"
    
    - type: content
      _editable: true
      variant: prose
      markdown: "# Write your post here"
```

## Troubleshooting

### "Template not found" error

1. Upload template to R2:
   ```bash
   wrangler r2 object put bucket-name template.yaml --file templates/my-template.yaml
   ```

2. Verify template name matches in Worker:
   ```typescript
   createEditHandler({
     templateKey: 'template.yaml',  // Must exist in R2
     ...
   })
   ```

### "DIARY_BUCKET is not defined"

1. Check `wrangler.toml` has R2 binding:
   ```toml
   [[r2_buckets]]
   binding = "DIARY_BUCKET"
   bucket_name = "my-bucket"
   ```

2. Restart dev server:
   ```bash
   wrangler pages dev ./rendered
   ```

### Form data not saving

1. Verify R2 bucket is writable
2. Check `functions/` files are deployed
3. Check browser network tab for POST errors

## Limitations & Future Work

- ✅ Form-based editing works
- ✅ Local R2 emulation in dev
- ✅ Multiple templates per project
- ⏳ User authentication (plan: Cloudflare Workers Auth)
- ⏳ Concurrent edit protection (plan: ETags)
- ⏳ Real-time collaboration (plan: websockets)

## More Resources

- [Gutenberg Pipeline Documentation](./pipeline.md)
- [Gutenberg Types Reference](./types.md)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
