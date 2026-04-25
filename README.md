# Gutenberg

Dynamic page builder and edit mode framework for Cloudflare Pages. Renders YAML page specs to semantic HTML with embedded CSS.

## Install

```bash
# In package.json:
"@jared-goguen/gutenberg": "github:jared-goguen/gutenberg"
```

The `prepare` script compiles TypeScript on install. Bun consumers get direct source resolution via the `bun` export condition.

## Page Spec Format

Pages are defined as YAML with `title`, `hero`, and `blocks`:

```yaml
title: "My Page"
theme: mono

hero:
  title: "Welcome"
  subtitle: "A subtitle"
  body: "Description text."

blocks:
  - prose:
      text: "**Markdown** content here."

  - tracker:
      caption: "Rate 1-5"
      cols: 3
      items:
        - {label: Mood, value: "3", type: rating, max: 5}
        - {label: Sleep, value: "", type: text}
        - {label: Exercise, value: "off", type: toggle}

  - table:
      headers: [{label: "Name"}, {label: "Value"}]
      rows: [["alpha", "100"], ["beta", "200"]]
```

## Block Types

| Block | Description |
|---|---|
| `hero` | Page header with title, subtitle, body |
| `superhero` | Full-width dramatic header |
| `prose` | Markdown text content |
| `table` | Data table with headers and rows |
| `tracker` | Rating/toggle/text grid with 1-5 segmented scale |
| `calendar` | Monthly grid with filled/today/future day indicators |
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

Blocks marked with `_editable: true` become interactive form inputs in edit mode. The rendering pipeline runs unchanged — block renderers conditionally emit form elements that inherit visual styling.

```yaml
blocks:
  - tracker:
      _editable: true
      caption: "1 = low · 3 = neutral · 5 = high"
      cols: 4
      items:
        - {label: Mood, value: "3", type: rating, max: 5}
        - {label: Notes, value: "", type: text}
```

For Cloudflare Pages Functions, use `createEditHandler()`:

```typescript
import { createEditHandler } from '@jared-goguen/gutenberg/workers';

export const onRequest = createEditHandler({
  templateKey: 'template.yaml',
  bucket: context.env.MY_BUCKET,
  routeParam: 'date',
  paramValidator: (d) => /^\d{4}-\d{2}-\d{2}$/.test(d),
});
```

Tracker ratings use a 1-5 segmented scale (3 = neutral) with pure CSS interactions — no JavaScript.

## Library API

```typescript
// Core pipeline
import { compile, fromYaml, toYaml, wrapDocument } from '@jared-goguen/gutenberg';

// Edit mode
import { compileEdit, findEditableBlocks } from '@jared-goguen/gutenberg/pipeline/editify';

// Workers integration
import { createEditHandler } from '@jared-goguen/gutenberg/workers';

// Types
import type { PageSpec, SpecBlock } from '@jared-goguen/gutenberg/specs/page/types';
import type { CompileOptions } from '@jared-goguen/gutenberg/engines/html5';
```

## Project Config

Multi-page projects use `_site.yaml`:

```yaml
project: my-project
theme: mono
targets:
  - cloudflare-pages
```

## Development

```bash
bun test              # Run tests
bun build             # Compile to dist/
bun run src/index.ts  # Start MCP server
```

## License

UNLICENSED
