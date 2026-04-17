# Gutenberg Architecture

## Pipeline Overview

Gutenberg converts YAML page specifications into self-contained HTML documents using a clean **LINT → SCAFFOLD → ENRICH → STYLE → PUBLISH** pipeline.

```
YAML Spec
    ↓
┌───────────────────────────────────────────────────────────┐
│ LINT: src/pipeline/lint.ts                                │
│ - Parse YAML → PageSchema                                 │
│ - Validate structure + semantics                          │
│ OUT: { schema: PageSchema, result: ValidationResult }     │
└───────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│ SCAFFOLD: src/pipeline/scaffold.ts                        │
│ - Extract typed data from sections                        │
│ - Build RenderNode trees (classless HTML structure)       │
│ - Attach semantic axes (vibe, intent, narrative, cohesion)│
│ OUT: RenderNode[]                                         │
└───────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│ ENRICH: src/pipeline/enrich.ts + src/enricher.ts         │
│ - Walk RenderNode trees                                   │
│ - Resolve class names from:                              │
│   • role (hero-heading, btn-primary, feature-card)        │
│   • layout (layout-3col, width-narrow, align-center)      │
│   • axes (vibe-vibrant, intent-engage, etc.)              │
│ OUT: AnnotatedNode[]                                      │
└───────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│ STYLE: src/pipeline/style.ts                              │
│ - Serialize AnnotatedNode to HTML string                  │
│ - Inject theme CSS:                                       │
│   • Chromata OKLCH color variables                        │
│   • Structural utilities (base.ts)                        │
│   • Theme component styles (ink/mono/ocean/light/dark)    │
│ OUT: Complete HTML string                                 │
└───────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│ PUBLISH: src/pipeline/publish.ts                          │
│ - Write HTML to disk                                      │
│ OUT: { html_path: string }                                │
└───────────────────────────────────────────────────────────┘
    ↓
Complete self-contained HTML file
```

## Directory Structure

```
src/
├── pipeline/
│   ├── index.ts          ← Main orchestrator
│   ├── lint.ts           ← Parse + validate YAML
│   ├── scaffold.ts       ← Extract data + build RenderNode tree
│   ├── enrich.ts         ← Resolve class names
│   ├── style.ts          ← Serialize HTML + inject CSS
│   └── publish.ts        ← Write to disk
│
├── scaffold/
│   └── node.ts           ← RenderNode, AnnotatedNode, SemanticAxes types
│
├── components/
│   ├── index.ts          ← Re-exports all data extractors + scaffolders
│   ├── hero.data.ts      ← Extract HeroData from HeroSection
│   ├── hero.scaffold.ts  ← Build RenderNode tree for hero
│   ├── features.{data,scaffold}.ts
│   ├── content.{data,scaffold}.ts
│   ├── cta.{data,scaffold}.ts
│   ├── navigation.{data,scaffold}.ts
│   └── footer.{data,scaffold}.ts
│
├── stylesheets/
│   ├── index.ts          ← Dispatch by theme name
│   ├── base.ts           ← Structural utilities (same for all themes)
│   ├── ink.ts            ← Editorial serif aesthetic
│   ├── mono.ts           ← Terminal monospace aesthetic
│   ├── ocean.ts          ← Blue/teal rounded aesthetic
│   ├── light.ts          ← Clean light theme
│   └── dark.ts           ← Clean dark theme
│
├── enricher.ts           ← Walk RenderNode, resolve classes
├── serializer.ts         ← Serialize AnnotatedNode to HTML
├── parser.ts             ← parseSchema, normalizeSection
├── validator.ts          ← validateSchema
├── theme.ts              ← Theme resolution (chromata re-export)
├── types.ts              ← All TypeScript interfaces
├── index.ts              ← MCP server entry point
└── icons.ts              ← SVG icon library (utility)
```

## Key Data Types

### RenderNode (SCAFFOLD output)
```typescript
interface RenderNode {
  tag: string                         // 'section', 'h1', 'a', 'div'
  role?: string                       // 'hero-heading', 'btn-primary'
  attrs: Record<string, string>       // href, id, src, alt (NOT class)
  layout?: Record<string, string>     // variant, width, columns, gap
  semantic?: SemanticAxes             // vibe, intent, narrative, cohesion
  children: (RenderNode | string)[]
}
```

### AnnotatedNode (ENRICH output)
```typescript
interface AnnotatedNode extends RenderNode {
  classes: string[]                   // Resolved CSS class names
  children: (AnnotatedNode | string)[]
}
```

### SemanticAxes
```typescript
interface SemanticAxes {
  vibe: "serene" | "gentle" | "steady" | "vibrant" | "intense" | "urgent"
  intent: "engage" | "inform" | "persuade" | "direct"
  narrative: "exposition" | "inciting" | "rising" | "climax" | "falling" | "resolution"
  cohesion: "opens" | "continues" | "amplifies" | "supports" | "contrasts" | "pivots" | "echoes" | "resolves" | "closes"
}
```

## Component Pattern

Each component uses a two-file pattern:

### `.data.ts` — Type extraction
```typescript
// Extracts typed, normalized data from raw section
// No HTML generation, pure data transformation
export function extractHeroData(section: HeroSection): HeroData
```

### `.scaffold.ts` — RenderNode building
```typescript
// Converts typed data to RenderNode tree
// No CSS classes, semantic roles only
export function scaffoldHero(data: HeroData): RenderNode
```

## Themes

All themes are CSS generators that define visual personality:

| Theme | Personality | Font | Button Style | Shadows |
|-------|-------------|------|--------------|---------|
| **ink** | Editorial serif | Georgia, serif | Bordered, uppercase | Borders > shadows |
| **mono** | Terminal monospace | JetBrains Mono | Minimal borders | Minimal |
| **ocean** | Modern flowing | System UI | Pill-shaped, filled | Soft glows |
| **light** | Clean bright | System UI | Standard | Standard |
| **dark** | Clean dark | System UI | Standard | Standard |

Switch themes in YAML:
```yaml
page:
  layout:
    theme: ocean  # ink | mono | ocean | light | dark
```

## Class Resolution

Classes are resolved from three independent sources in ENRICH:

1. **Role** (semantic component class)
   ```
   role: "hero-heading" → class: "hero-heading"
   role: "btn-primary" → class: "btn-primary"
   ```

2. **Layout** (structural utilities)
   ```
   layout: { columns: "3" } → class: "layout-3col"
   layout: { width: "narrow" } → class: "width-narrow"
   ```

3. **Semantic Axes** (on section roots only)
   ```
   semantic: { vibe: "vibrant", intent: "engage", ... }
   → classes: ["vibe-vibrant", "intent-engage", ...]
   ```

Theme stylesheets can cascade on these:
```css
.vibe-vibrant { padding-block: 3rem; }
.vibe-vibrant .hero-heading { font-size: clamp(2.5rem, 6vw, 4rem); }
.intent-engage .btn-primary { background: var(--primary-600); }
```

## Testing

```bash
# Run all tests
bun test

# Test results
✅ 11 tests passing
- validate_schema
- render_page (minimal + full schema + all sections)
- Smoke test (full pipeline)
```

Generated files are gitignored:
- `/rendered/` — HTML output from render_page
- `/snapshots/` — PNG screenshots from snapshot_html
- `/test-specs/` — Generated test spec files
