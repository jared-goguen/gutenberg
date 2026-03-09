# Gutenberg — Agent Instructions

## Runtime
Use Bun throughout. Never use Node.js, ts-node, jest, or vitest.

- `bun run src/index.ts` — start the MCP server
- `bun test` — run all tests
- `bun test tests/integration` — integration tests (spawns real server subprocess)

## Project Structure

```
src/
  index.ts          # entry point — stdio MCP server
  serve.ts          # convention server runtime — auto-discovers tools
  types.ts          # all TypeScript interfaces (PageSchema, Section types, etc.)
  parser.ts         # parseSchema() — YAML string or object → PageSchema
                    # normalizeSection() — fills in default variants
  validator.ts      # validateSchema() — returns { valid, errors, warnings }
  renderer.ts       # renderHTML(), escapeHTML(), h(), selfClosing() — HTML AST helpers
  components/
    index.ts        # renderSection() — dispatches to component renderers
                    # getComponentList() — returns all component types + variants
    hero.ts         # renderHero (centered, split, full-bleed)
    features.ts     # renderFeatures (grid-2, grid-3, grid-4, list)
    content.ts      # renderContent (prose, narrow, wide) — uses marked for markdown
    cta.ts          # renderCTA (centered, split, banner)
    navigation.ts   # renderNavigation (default, centered, split)
    footer.ts       # renderFooter (simple, detailed, newsletter)
  templates/
    base.ts         # renderDocument() — wraps body in <!DOCTYPE html> with meta tags
                    # renderContainer(), renderSection() — layout helpers
    layouts.ts      # applyLayout() — wraps content with layout/theme div
                    # getLayoutClasses() — resolves layout type + theme to CSS classes
tools/              # convention-based MCP tools (auto-discovered)
   render_page/      # parse schema → render all sections → apply layout → renderDocument
   validate_schema/  # parse schema → validateSchema → return errors + warnings
   list_components/  # getComponentList → return all component types and variants
   preview_component/# render single section + wrap in document (for isolated preview)
   generate_theme/   # generate theme object + tailwind.config.js string
   snapshot_page/    # render spec → deploy to CF Pages preview → screenshot (visual QA)
   deploy_html/      # deploy rendered files to CF Pages with hash-based manifest [SEE BELOW]
   list_projects/    # list all CF Pages projects for account
   create_project/   # create new CF Pages project
   list_deployments/ # list deployments for CF Pages project
   get_deployment/   # get details for specific CF Pages deployment
tests/
  helpers/          # server subprocess harness (spawnServer), temp dir helpers
  integration/      # full-stack tests through stdio transport
flows/
   publish.yaml      # Flowbot state machine: draft → validated → rendered → published
   instances/        # runtime flow instances (git-ignored)
examples/
   landing-page.yaml # SaaS landing page example
   docs-page.yaml    # Documentation page example
src/
   cf.ts             # Cloudflare API helpers (getConfig, cfFetch)
```

## Key Conventions

- Tools import from `../../src/` (two levels up from `tools/<name>/`)
- All logic lives in `src/` — tool handlers are thin wrappers
- `serve.ts` auto-discovers tools by scanning `tools/*/index.ts`
- The first exported function in each `index.ts` becomes the tool handler
- `purpose.md` first line is the MCP tool description shown to clients
- `schema.json` `input` key is passed directly to `tools/list` as `inputSchema`
- Environment variables needed for CF Pages tools: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`

## Page Schema Format

```yaml
page:
  meta:                   # optional — SEO metadata
    title: My Page
    description: ...
    language: en
  layout:                 # optional — layout type + theme
    type: standard        # standard | wide | narrow | docs
    theme: light          # light | dark | auto
  sections:               # required — ordered list of sections
    - type: navigation
      links: [...]
    - type: hero
      content:
        heading: Hello
    - type: footer
      copyright: "2024"
```

## Adding a New Tool

1. Create `tools/<tool_name>/` directory
2. Add `tools/<tool_name>/index.ts` — export one async function; import from `../../src/`
3. Add `tools/<tool_name>/schema.json` — `input` (with `additionalProperties: false`) + `output`
4. Add `tools/<tool_name>/purpose.md` — first line is the short MCP description
5. Run `bun test` — all tests must pass

**Tools are automatically discovered. No server code changes needed.**

## Adding a New Component

1. Create `src/components/<name>.ts` — export `render<Name>(section, options): string`
2. Add the type to `ComponentType` in `src/types.ts`
3. Register the renderer in `src/components/index.ts` `componentRenderers` map
4. Add the component metadata to `getComponentList()` in `src/components/index.ts`
5. Add validation in `src/validator.ts` `validateSection()` switch case
6. Add default variant to `normalizeSection()` in `src/parser.ts`

## Integration with Cloudflare Pages

**Gutenberg + Cloudflare = Complete Publishing Pipeline**

Gutenberg renders page specs to HTML. Cloudflare Pages deploys them globally.

### The Deploy Flow

```
Page Spec (YAML)
    ↓
[gutenberg_render_page]  ← Parse + render + apply theme
    ↓
HTML Output
    ↓
[gutenberg_deploy_html]  ← Read from directory + upload to CF Pages
    ↓
Live at https://<id>.pages.dev
```

### Using deploy_html Tool

**Two modes** supported:

**Mode 1: Files Parameter** (small batches)
```
gutenberg_deploy_html(
  project_name="my-site",
  files={"/index.html": "...", "/about.html": "..."}
)
```

**Mode 2: Directory Parameter** (batch rendering) ✓ RECOMMENDED
```
gutenberg_deploy_html(
  project_name="my-site",
  directory="/path/to/rendered/pages"
)
```

The directory mode recursively reads all files from disk, avoiding MCP parameter size limits. Perfect for deploying entire rendered output directories.

### How It Works

The `deploy_html` tool:
1. Accepts either inline files or a directory path
2. Computes MD5 hashes for all files
3. Uploads to Cloudflare with manifest-based deduplication
4. Creates a deployment (returns deployment ID + live URL)

**Result:** All files uploaded atomically. Fast, reliable, idempotent.

### Required Credentials

Set these environment variables:
- `CLOUDFLARE_ACCOUNT_ID` — Your account ID
- `CLOUDFLARE_API_TOKEN` — API token with Pages write access

### Why This Architecture Works

- **Separation of Concerns**: Gutenberg renders, Cloudflare deploys
- **Rosetta Discovery**: Agents see the full pipeline (render + deploy)
- **No MCP Size Limits**: Directory mode reads from disk, not parameters
- **Direct API**: Uses Cloudflare's manifest-based upload (what Wrangler uses internally)
- **Integrated**: All tools discoverable in `rosetta.schema.json`

**Agents naturally know:** render a page spec → deploy the output → get a live URL.
