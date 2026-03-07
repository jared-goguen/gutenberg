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
tests/
  helpers/          # server subprocess harness (spawnServer), temp dir helpers
  integration/      # full-stack tests through stdio transport
examples/
  landing-page.yaml # SaaS landing page example
  docs-page.yaml    # Documentation page example
```

## Key Conventions

- Tools import from `../../src/` (two levels up from `tools/<name>/`)
- All logic lives in `src/` — tool handlers are thin wrappers
- `serve.ts` auto-discovers tools by scanning `tools/*/index.ts`
- The first exported function in each `index.ts` becomes the tool handler
- `purpose.md` first line is the MCP tool description shown to clients
- `schema.json` `input` key is passed directly to `tools/list` as `inputSchema`
- No environment variables needed — gutenberg has no external API dependencies

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
