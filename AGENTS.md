# Gutenberg — Agent Instructions

## Runtime

Use Bun throughout. Never use Node.js, ts-node, jest, or vitest.

- `bun test` — run all tests
- `bun run src/index.ts` — start MCP server
- `bun build` or `tsc --noEmitOnError` — compile to dist/

## Architecture

Dynamic page builder and edit mode framework for Cloudflare Pages. Renders YAML page specs to semantic HTML with embedded CSS. Mono theme only. First-class edit mode enables interactive form-based pages (diaries, trackers, surveys).

The library is consumed as an npm package (`@jared-goguen/gutenberg`) by downstream apps like dbt-diary-cards. It also runs as an MCP server exposing build/lint/publish/snapshot tools.

## Source Structure

```
src/
  index.ts              # MCP server entry point
  index-lib.ts          # Library exports for consumers
  cli.ts                # CLI entry point
  compile.ts            # compile(), compileYaml(), plan()
  backend.ts            # CompilePlan, RenderResult, RenderEngine types
  build.ts              # Project build: discoverSpecs(), plan(), render()
  document.ts           # wrapDocument() — HTML shell, edit CSS, view actions bar
  plan.ts               # Navigation tree, yaml cache, title map, graph
  project.ts            # Project path utilities
  project-config.ts     # readProjectConfig() — reads _site.yaml (or _project.yaml)
  enrich.ts             # CSS class resolution from semantic roles
  tonal-enrich.ts       # Chromata tonal enrichment
  inline.ts             # Inline element processing
  markdown.ts           # Markdown rendering via marked
  site-enrich.ts        # Site-level enrichment
  site-nav.ts           # Navigation generation
  right-rail.ts         # Right rail / TOC
  theme.ts              # Theme resolution

  blocks/               # 17 block renderers
    dispatch.ts         # Block type → renderer routing
    types.ts            # Block renderer types
    transform.ts        # Block transformation utilities
    hero.ts             # Page header with title, subtitle, body
    superhero.ts        # Full-width dramatic header
    prose.ts            # Markdown text content
    table.ts            # Data table with headers and rows
    tracker.ts          # Rating/toggle/text grid (1-5 segmented scale)
    calendar.ts         # Monthly grid with filled/today/future indicators
    cards.ts            # Card grid layout
    stat.ts             # Metric/statistic display
    timeline.ts         # Chronological events
    flow-chain.ts       # Step-by-step process
    info-box.ts         # Highlighted information panel
    callout.ts          # Emphasized message
    heading.ts          # Section heading
    section-label.ts    # Uppercase section divider
    badge.ts            # Status badge
    page-nav.ts         # Navigation links
    closing.ts          # Page footer content

  chromata/             # OkLCH color engine
    themes.ts           # Inlined themes.json (Workers-compatible)
    palette.ts          # Palette generation
    oklch.ts            # OkLCH color space
    color-functions.ts  # Color manipulation
    resolve-colors.ts   # Color resolution
    semantic.ts         # Semantic color mapping
    sequence.ts         # Accent color sequencing
    tonal.ts            # Tonal enrichment

  specs/
    page/               # Page spec types and parsing
      types.ts          # PageSpec, SpecBlock, TrackerItemSpec, CalendarSpec, etc.
      yaml.ts           # fromYaml(), toYaml()
      sanitize.ts       # sanitizeSpec(), lintSpec()
      schema.ts         # Schema definitions
      lint.ts           # Lint rules
      convention.ts     # Naming conventions
      visual-lint.ts    # Visual validation
      semantics.ts      # Semantic analysis
      resolved.ts       # Resolved spec types
      index.ts          # Re-exports
    site/               # Site config
      types.ts          # SiteSpec, SpecEntry
      yaml.ts           # fromSiteYaml()
      nav.ts, lint.ts, keys.ts, graph.ts, index.ts
    meta/               # Metadata types
      types.ts, index.ts

  pipeline/
    editify.ts          # compileEdit(), findEditableBlocks()

  stylesheets/
    base.ts             # CSS reset + structural classes + scale segment CSS
    index.ts            # Stylesheet router
    mono.ts             # Mono theme generator
    themes/
      mono.ts           # Mono theme implementation (~vermillion accent, Helvetica Neue, 8px grid, zero radius)

  engines/
    html5.ts            # HTML5 render engine, CompileOptions

  workers/
    index.ts            # createEditHandler() for CF Pages Functions

  core/                 # MCP server infrastructure
    serve.ts            # Auto-discovers tools from tools/
    types.ts, hooks.ts, enforcement.ts, index.ts

tools/                  # MCP tools (auto-discovered by serve.ts)
  build/                # Build entire project (project_path → rendered HTML)
  lint/                 # Parse & validate spec
  publish/              # Deploy to CF Pages
  snapshot/             # Screenshot via headless browser
  create_project/       # CF Pages project management
  get_project/
  list_projects/
  init_template/

tests/
  editify.test.ts           # Edit mode unit tests
  integration/tools.test.ts # Integration tests (spawns MCP server subprocess)
  helpers/server.ts, fixtures.ts
```

## Page Spec Format

Specs use `title`, `hero`, `blocks` — NOT the old `page.sections` format.

```yaml
title: "Page Title"
theme: mono                    # optional, inherited from _site.yaml

hero:
  title: "Heading"
  subtitle: "Subheading"
  body: "Description text."

blocks:
  - section_label:
      text: SECTION NAME

  - prose:
      text: "**Markdown** content here."
      _editable: true          # becomes interactive in edit mode

  - tracker:
      _editable: true
      caption: "1 = low · 3 = neutral · 5 = high"
      cols: 4
      items:
        - {label: Mood, value: "3", type: rating, max: 5}
        - {label: Sleep, value: "", type: text}
        - {label: Exercise, value: "off", type: toggle}

  - table:
      headers: [{label: "Col 1"}, {label: "Col 2"}]
      rows: [["cell a", "cell b"]]

  - calendar:
      month: 4
      year: 2026
      filled: ["2026-04-15", "2026-04-16"]
```

Blocks are discriminated unions: each array item is `{block_type: {config...}}`.

## Block Types

| Block | Description |
|---|---|
| `hero` | Page header with title, subtitle, body |
| `superhero` | Full-width dramatic header |
| `prose` | Markdown text content |
| `table` | Data table with headers and rows |
| `tracker` | Rating/toggle/text grid (1-5 segmented scale) |
| `calendar` | Monthly grid with filled/today/future indicators |
| `cards` | Card grid layout |
| `stat` | Metric/statistic display |
| `timeline` | Chronological events |
| `flow_chain` | Step-by-step process |
| `info_box` | Highlighted information panel |
| `callout` | Emphasized message |
| `heading` | Section heading |
| `section_label` | Uppercase section divider |
| `badge` | Status badge |
| `page_nav` | Navigation links |
| `closing` | Page footer content |

## Edit Mode

Edit mode is first-class — the full rendering pipeline runs unchanged. Block renderers conditionally emit `<input>` / `<textarea>` / `<select>` elements with `gb-edit-field` class that inherits ALL visual styling via CSS `inherit`.

**Key components:**

- **CompileOptions** (`engines/html5.ts`): `editMode`, `editableBlocks`, `editLink`, `deleteLink` flags thread through the render context.
- **editify.ts** (`pipeline/editify.ts`): `compileEdit(spec, editableBlocks)` orchestrates edit-mode compilation. `findEditableBlocks()` extracts `_editable` markers from raw template YAML.
- **document.ts**: Wraps output in `<form>` for edit mode. View mode shows a floating action bar with Edit + Delete buttons.
- **Tracker edit mode**: Hidden radio buttons + CSS `:has()` for live intensity updates — pure CSS, no JavaScript. 1-5 segmented scale where 3 = neutral. Each item uses its own chromata accent color; intensity is driven by deviation from neutral (0.3 at center → 1.0 at extremes). Neutral marker (small tick on segment 3) always visible.

**Field naming**: `section_{specIndex}__{field}` where `specIndices[]` on CompilePlan maps contentBlocks to `spec.blocks` positions.

## Library Exports

Package exports map provides 8 subpaths with dual resolution (`bun` → source TS, `import` → compiled JS):

| Subpath | Key Exports |
|---|---|
| `.` | `compile`, `compileYaml`, `plan`, `fromYaml`, `toYaml`, `wrapDocument`, `createEditHandler` |
| `./compile` | `compile()` |
| `./specs/page` | Page spec index |
| `./specs/page/yaml` | `fromYaml()`, `toYaml()` |
| `./specs/page/sanitize` | `sanitizeSpec()`, `lintSpec()` |
| `./specs/page/types` | `PageSpec`, `SpecBlock`, `blockType()`, `blockValue()` |
| `./pipeline/editify` | `compileEdit()`, `findEditableBlocks()` |
| `./engines/html5` | HTML5 engine, `CompileOptions` |
| `./workers` | `createEditHandler()`, `EditHandlerConfig` |

## Project Config

Project-level config uses `_site.yaml` (not the old `gutenberg.yaml`):

```yaml
project: my-project
theme: mono
targets:
  - cloudflare-pages
```

`readProjectConfig()` looks for `_site.yaml` first, then `_project.yaml` (legacy). Does NOT walk up the directory tree.

## Chromata Color Engine

OkLCH-based color system for semantic coloring:

- **themes.ts**: Theme definitions inlined as JSON (Workers-compatible, no filesystem reads).
- **Tonal enrichment**: Assigns accent colors to blocks based on semantic sequence position.
- **Palette generation**: Produces harmonious color sets from a base hue.
- **Semantic mapping**: Maps abstract semantic roles to concrete color values.

## Key Conventions

1. **Page spec format is `title` / `hero` / `blocks`** — never `page.sections`.
2. **_site.yaml is the project config** — not gutenberg.yaml.
3. **dist/ is gitignored**. The `prepare` script (`tsc --noEmitOnError || true`) runs on `npm install` to build dist/ from source.
4. **Version bump required** when downstream projects (like dbt-diary-cards) need to pick up changes. npm caches git dependencies by the `version` field in package.json.
5. **Mono theme only** currently — vermillion/red accent, Helvetica Neue, strict 8px grid, zero border radius.
6. **Edit mode is first-class** — same pipeline, block renderers conditionally switch display → input at the leaf level. No separate edit pipeline.

## MCP Tool Structure

Tools live in `tools/<name>/` with three files:
- `index.ts` — export async `handler(input)` function
- `schema.json` — input/output types
- `purpose.md` — first line is the MCP tool description

`serve.ts` auto-discovers tools from `tools/*/index.ts`. No registration needed.

## Important Rules

1. **Never write ad-hoc scripts** — create MCP tools instead (they're discoverable and get proper credentials).
2. **CF credentials live in the MCP subprocess** — injected by opencode.json. Always call tools via MCP, never by importing handlers directly.
3. **Only mono theme exists** — don't reference ink, wire, cloudflare, reactor, or other themes.
4. **Workers edit mode** uses `createEditHandler()` for CF Pages Functions — not a separate system.
