# Gutenberg — Agent Instructions

## Runtime
Use Bun throughout. Never use Node.js, ts-node, jest, or vitest.

- `bun run src/index.ts` — start the MCP server
- `bun test` — run all tests
- `bun test tests/integration` — integration tests (spawns real server subprocess)

## Project-Level Architecture

**gutenberg.yaml is the unit of work.** All pages in a project share one `gutenberg.yaml` config file that defines the Cloudflare Pages project name. Pages are auto-discovered, navigation is auto-injected, and the `build` + `publish` tools operate on the entire project at once.

### Directory Structure

```
examples/
  gutenberg.yaml           ← Project config (just the CF Pages project name)
  landing-page.yaml        ← Auto-discovered page
  docs-page.yaml           ← Auto-discovered page
  product.yaml             ← Auto-discovered page
  rendered/                ← Conventional output dir (auto-created)
    landing-page.lint.json
    landing-page.scaffold.json
    landing-page.enrich.json
    landing-page.html
    landing-page.png
    docs-page.lint.json
    docs-page.scaffold.json
    docs-page.enrich.json
    docs-page.html
    docs-page.png
    product.lint.json
    product.scaffold.json
    product.enrich.json
    product.html
    product.png
```

### Project Config (`gutenberg.yaml`)

```yaml
project:
  name: gutenberg-examples
```

That's it. Everything else is convention:
- **Pages:** All `.yaml` files in the project directory (recursively), excluding `gutenberg.yaml` itself
- **Navigation:** Auto-generated from all page titles, auto-injected into each page's `navigation` section
- **Output:** Always `{project_dir}/rendered/`, mirroring input structure
- **`_index.yaml`:** Renders to `index.html` at that directory level

---

## The 5 Pipeline Stages

All pipeline tools now take **`spec_path` only** — artifact paths are derived by convention.

```
YAML Spec
    ↓
[LINT]           → {spec_dir}/rendered/{name}.lint.json
    ↓
[SCAFFOLD]       → {spec_dir}/rendered/{name}.scaffold.json
    ↓
[ENRICH]         → {spec_dir}/rendered/{name}.enrich.json
    ↓
[STYLE]          → {spec_dir}/rendered/{name}.html
    ↓
[SNAPSHOT]       → {spec_dir}/rendered/{name}.png
```

### Tool Reference (Individual Stages)

| Tool | Input | Output | Purpose |
|---|---|---|---|
| `lint` | `spec_path` | `lint.json` | Parse and validate spec |
| `scaffold` | `spec_path` | `scaffold.json` | Build classless RenderNode tree |
| `enrich` | `spec_path` | `enrich.json` | Resolve CSS classes from roles/layout |
| `style` | `spec_path` | `{name}.html` | Serialize to HTML with theme CSS |
| `snapshot` | `spec_path`, `width?`, `height?` | `{name}.png` | Screenshot in headless browser |

All artifact paths are derived using `getArtifactPath(spec_path, stage)` from `src/project.ts`.

---

## Project-Level Tools

| Tool | Input | Output | Purpose |
|---|---|---|---|
| `build` | `project_path` (gutenberg.yaml) | `{ project_name, rendered_dir, pages[] }` | Build all pages (auto-discovery, nav injection, full pipeline) |
| `publish` | `project_path` | `{ url, project_name }` | Deploy entire `rendered/` to Cloudflare Pages |

---

## Agent Workflows

### Build and Deploy an Entire Site

**Recommended workflow** — use project-level tools:
```
build(project_path="examples/gutenberg.yaml")
publish(project_path="examples/gutenberg.yaml")
```

The `build` tool:
1. Auto-discovers all `.yaml` pages in the project
2. Lints all pages to gather titles
3. Builds a flat navigation structure from titles
4. Injects nav into each page's `navigation` section
5. Runs the full pipeline (scaffold → enrich → style) for each page
6. Writes all HTML to `rendered/` mirroring input structure

The `publish` tool:
1. Reads project config → gets `project_name`
2. Finds `rendered/` directory
3. Deploys entire directory to Cloudflare Pages
4. Returns live URL

**Result:** One deployment containing all pages at their respective paths (`/landing-page`, `/docs-page`, `/product`).

### Inspect Individual Stages During Development

For debugging or fine-grained control, run pipeline stages individually:
```
lint(spec_path="examples/landing-page.yaml")
scaffold(spec_path="examples/landing-page.yaml")
enrich(spec_path="examples/landing-page.yaml")
style(spec_path="examples/landing-page.yaml")
snapshot(spec_path="examples/landing-page.yaml")
```

All stages write to `examples/rendered/{name}.{stage}.{ext}` by convention — no path threading needed.

---

## Key Conventions

### Tool Structure
- **Location:** `tools/<tool_name>/`
- **Handler:** `tools/<tool_name>/index.ts` — export one async function named `handler`
- **Schema:** `tools/<tool_name>/schema.json` — input/output types with `x-semantic-type` annotations
- **Description:** `tools/<tool_name>/purpose.md` — first line is the MCP description
- **Auto-discovery:** `src/core/serve.ts` scans `tools/*/index.ts` automatically

### Artifact Paths (Convention Over Configuration)

**All pipeline tools derive artifact paths automatically** using `src/project.ts` utilities:

```typescript
findProjectRoot(specPath)           // Walks up to find gutenberg.yaml
getRenderedDir(specPath)            // {projectRoot}/rendered/
getArtifactPath(specPath, stage)    // {renderedDir}/{relPath}/{name}.{stage}.ext
```

No more passing `lint_path`, `scaffold_path`, `enrich_path` between tools. Every tool takes `spec_path` and derives what it needs.

### Navigation Auto-Injection

The `build` tool automatically:
1. Gathers all page titles from lint artifacts
2. Builds a flat nav: `[{ text: "Page Title", href: "/page-name" }]`
3. Injects nav into each page's `navigation` section (or prepends one if missing)
4. Filters out the current page from its own nav (no self-linking)

Spec authors don't need to manually maintain nav links — it's computed from the project.

### Credentials & Environment

- **Cloudflare credentials** (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) are injected by `opencode.json` into the MCP subprocess
- They are **NOT** available in your shell environment during agent execution
- Always call CF tools through the MCP interface — never by importing handlers directly in scripts
- Never write standalone scripts; write tools instead (they're discoverable and get proper credentials)

---

## Project Structure

```
src/
  index.ts              # entry point — stdio MCP server
  core/serve.ts         # convention server runtime — auto-discovers tools
  types.ts              # all TypeScript interfaces (PageSchema, Section types, etc.)
  parser.ts             # parseSchema() — YAML → PageSchema
  validator.ts          # validateSchema() — returns { valid, errors, warnings }
  project.ts            # NEW: project-level utilities (findProjectRoot, getArtifactPath, etc.)
  pipeline/
    index.ts            # orchestrator (re-exports all stages)
    lint.ts             # LINT stage
    scaffold.ts         # SCAFFOLD stage
    enrich.ts           # ENRICH stage
    style.ts            # STYLE stage
    publish.ts          # file write helpers
  components/
    hero.{data,scaffold}.ts
    features.{data,scaffold}.ts
    content.{data,scaffold}.ts
    cta.{data,scaffold}.ts
    navigation.{data,scaffold}.ts
    footer.{data,scaffold}.ts
  scaffold/node.ts      # RenderNode, AnnotatedNode types
  enricher.ts           # Class name resolution logic
  serializer.ts         # HTML serialization
  stylesheets/
    base.ts             # CSS reset + 13 structural semantic classes
    ink.ts, mono.ts, ocean.ts, light.ts, dark.ts  # Theme implementations
  cf.ts                 # Cloudflare API helpers
  theme.ts              # Theme resolution
  
tools/                  # MCP tools (auto-discovered)
  lint/                 # Parse & validate spec (spec_path only)
  scaffold/             # Build RenderNode tree (spec_path only)
  enrich/               # Resolve CSS classes (spec_path only)
  style/                # Generate HTML (spec_path only)
  snapshot/             # Screenshot (spec_path + viewport dims)
  build/                # NEW: Build entire project (project_path)
  publish/              # Deploy to CF Pages (project_path)
  create_project/       # Cloudflare Pages project management
  list_projects/
  get_project/
  
examples/
  gutenberg.yaml        # Project config
  landing-page.yaml     # Page specs
  docs-page.yaml
  product.yaml
  rendered/             # Auto-generated
  
tests/
  integration/tools.test.ts
```

---

## Page Schema Format

```yaml
page:
  meta:                    # optional — SEO metadata
    title: My Page
    description: ...
    language: en
    
  layout:                  # optional — layout type + theme
    type: standard         # standard | wide | narrow | docs
    theme: ink             # ink | mono | ocean | light | dark (default: dark)
    
  sections:                # required — ordered list of sections
    - type: navigation
      variant: default
      logo: My Logo
      links: [...]         # Will be auto-injected by build tool
      
    - type: hero
      variant: centered
      content:
        heading: Hello World
        subheading: ...
        cta: [...]
      vibe: vibrant        # optional semantic axis
      intent: engage       # optional semantic axis
      
    - type: features
      variant: grid-3
      heading: Features
      items: [...]
      
    - type: content
      variant: prose       # prose | narrow | wide
      markdown: |
        # Section heading
        Content with **markdown**.
      
    - type: cta
      variant: centered    # centered | split | banner
      heading: Call to Action
      cta: [...]
      
    - type: footer
      variant: detailed
      logo: My Logo
      links: [...]
```

### Semantic Axes (all optional, all section types)

```
vibe:      serene | gentle | steady | vibrant | intense | urgent
intent:    engage | inform | persuade | direct
narrative: exposition | inciting | rising | climax | falling | resolution
cohesion:  opens | continues | amplifies | supports | contrasts | pivots | echoes | resolves | closes
```

---

## Adding a New Tool

1. Create `tools/<tool_name>/` directory
2. Add `tools/<tool_name>/index.ts` — export async `handler(input: Record<string, unknown>)` function
3. Add `tools/<tool_name>/schema.json` — `input` and `output` keys with `additionalProperties: false` in input
4. Add `tools/<tool_name>/purpose.md` — first line is the short MCP description
5. Run `bun test` — all tests must pass

**Tools are automatically discovered by `serve.ts`. No server code changes needed.**

---

## Adding a New Component

1. Create `src/components/<name>.data.ts` — export `extract<Name>Data(section: any)` and `<Name>Data` interface
2. Create `src/components/<name>.scaffold.ts` — export `scaffold<Name>(data: <Name>Data): RenderNode`
3. Add the type to `ComponentType` in `src/types.ts`
4. Add validation in `src/validator.ts` `validateSection()` switch case
5. Wire into `src/pipeline/scaffold.ts` `scaffoldSection()` switch
6. Update examples to use the new component
7. Run `bun test` to verify

---

## CloudFlare Pages Integration

The `publish` tool handles all CF Pages operations:

**Deploy an entire project:**
```javascript
publish(project_path="examples/gutenberg.yaml")
```

Reads `gutenberg.yaml` → gets `project_name` → deploys `rendered/` → returns live URL.

**Required environment variables** (injected by opencode.json):
- `CLOUDFLARE_ACCOUNT_ID` — Account ID from dash.cloudflare.com
- `CLOUDFLARE_API_TOKEN` — API token with Pages write access

**Features:**
- ✅ Auto-creates project if it doesn't exist
- ✅ MD5-based asset deduplication (only uploads changed files)
- ✅ Idempotent — same input always produces same deployment
- ✅ Preview branches supported via optional `branch` parameter
- ✅ All pages deployed as one unit (one URL, multiple routes)

---

## Edit Mode: Dynamic, Form-Based Pages

Edit mode enables **templates** — reusable structures for dynamic, form-based pages (diaries, blogs, surveys).

### Key Differences: Pages vs Templates

| | Pages | Templates |
|---|-------|-----------|
| Location | Project root or `pages/` | `templates/` directory |
| Built | Yes, to HTML | No, never rendered |
| Usage | Static, built once | Dynamic, created at runtime |
| Editing | None | Via web form |
| Storage | None (static) | R2 entries |

### Template Structure

Templates define **both structure AND editability**:

```yaml
template:
  name: diary
  route: /diary/[date]
  routeParam: date
  storage: r2

page:
  meta:
    title: "Diary — {{DATE}}"
  sections:
    - type: hero
      _editable: true    # Make this section editable
      content:
        heading: "Daily Card {{DATE}}"
    
    - type: table
      _editable: true    # Users can edit table cells
      label: EMOTIONS
      cells: [...]
    
    - type: content
      _editable: true    # Users can edit markdown
      variant: prose
      markdown: "## Notes\n..."
```

### Build Pipeline with Templates

```
gutenberg build
├── Discover pages/ and templates/
├── Lint pages → rendered/*.lint.json
├── Build pages → rendered/*.html
├── Validate templates (but DON'T render them)
└── Write template metadata → .gutenberg-edit/templates.json
```

**Important:** `gutenberg build` only renders **pages** to HTML. Templates are validated but never rendered.

### Initialization

```bash
# Initialize a new template with route and parameter
gutenberg init_template diary --route="/diary/[date]" --param=date

# Creates:
# - templates/diary.yaml (template definition)
# - functions/diary/[date].ts (Worker handler)
# - functions/index.ts (index handler)
# - wrangler.toml (Cloudflare config)
# - data/diary/ (local storage for dev)
```

### Runtime: Workers Functions

Templates are rendered dynamically by Cloudflare Pages Functions using Gutenberg utilities:

```typescript
// functions/diary/[date].ts
import { createEditHandler } from 'gutenberg/workers';

export async function onRequest(context) {
  return createEditHandler({
    templateKey: 'template.yaml',
    bucket: context.env.DIARY_BUCKET,
    routeParam: 'date',
    paramValidator: (d) => /^\d{4}-\d{2}-\d{2}$/.test(d),
  })(context);
}
```

The handler:
- GET `/diary/2026-04-17` → renders entry (view mode)
- GET `/diary/2026-04-17?mode=edit` → renders form (edit mode)
- POST `/diary/2026-04-17?mode=save` → saves form data to R2

### Local Development

```bash
# Build pages (templates ignored)
gutenberg build

# Start Cloudflare dev server
wrangler pages dev ./rendered

# Edit entries locally (git-friendly YAML)
# Stored in data/diary/*.yaml
```

### For More Details

See `docs/edit-mode.md` for complete edit mode documentation.

---

## Important Rules for Agents

1. **Never write ad-hoc scripts** — if a workflow might be repeated, create a tool instead
2. **CF credentials live in the MCP subprocess** — always call tools via MCP, never import handlers directly
3. **Rely on convention** — pipeline tools derive all paths automatically, don't pass paths manually
4. **gutenberg.yaml is the unit of deployment** — use `build` + `publish` for multi-page sites
5. **Individual pipeline tools are for inspection** — use them when debugging or exploring artifacts
6. **Templates are separate from pages** — discovered from `templates/` directory, validated but never rendered
7. **Edit mode uses Workers Functions** — not a separate system, just a different rendering mode
