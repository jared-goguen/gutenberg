# Gutenberg MCP Server

> Transform semantic YAML schemas into world-class HTML with Semantic HTML5 and Tailwind CSS

Gutenberg is a Model Context Protocol (MCP) server that generates beautiful, accessible, and production-ready HTML from simple YAML schemas. Built on the Rosetta MCP framework, it provides a declarative way to create landing pages, documentation sites, and marketing pages.

## Features

- **Semantic HTML5**: Proper use of semantic tags, correct heading hierarchy, and accessibility features
- **Tailwind CSS**: Modern utility-first CSS framework with responsive design
- **Component Library**: 11 pre-built components with multiple variants
- **Type-Safe**: Written in TypeScript with comprehensive type definitions
- **YAML-First**: Simple, readable schemas that define page structure
- **Validation**: Built-in schema validation with detailed error messages
- **Extensible**: Convention-based architecture makes it easy to add components

## Quick Start

### Installation

```bash
bun install
```

### Running the Server

```bash
bun run start
```

The server will start and listen for MCP protocol messages over stdio.

### Example Usage

Create a simple landing page:

```yaml
page:
  meta:
    title: "My Awesome Product"
    description: "The best product ever made"
    
  sections:
    - type: hero
      variant: centered
      content:
        heading: "Welcome to the Future"
        subheading: "Building amazing things together"
        cta:
          text: "Get Started"
          href: "#signup"
    
    - type: features
      variant: grid-3
      heading: "Why Choose Us"
      items:
        - icon: "rocket"
          title: "Fast"
          description: "Lightning-fast performance"
        - icon: "shield"
          title: "Secure"
          description: "Bank-grade security"
        - icon: "users"
          title: "Collaborative"
          description: "Built for teams"
```

## Available Tools

Gutenberg provides 5 MCP tools:

### 1. `render_page`

Render a complete HTML page from a schema.

**Input:**
- `schema` (string | object): Page schema in YAML or JSON format
- `options` (optional):
  - `minify` (boolean): Minify HTML output (default: false)
  - `includeComments` (boolean): Include HTML comments (default: true)
  - `tailwindCDN` (boolean): Include Tailwind CSS CDN (default: true)
  - `indentSize` (number): Indentation spaces (default: 2)

**Output:**
- `html` (string): Complete HTML document
- `warnings` (array): Validation warnings

### 2. `validate_schema`

Validate a page schema for correctness.

**Input:**
- `schema` (string | object): Page schema to validate

**Output:**
- `valid` (boolean): Whether the schema is valid
- `errors` (array): Validation errors with paths and messages
- `warnings` (array): Best practice warnings

### 3. `list_components`

List all available component types and their variants.

**Output:**
- `components` (array): List of component definitions

### 4. `preview_component`

Preview a single component in isolation.

**Input:**
- `section` (object): Section object with type and properties
- `options` (optional): Same as render_page

**Output:**
- `html` (string): HTML document with component

### 5. `generate_theme`

Generate a Tailwind CSS theme configuration.

**Input:**
- `primaryColor` (string): Primary brand color (default: "#3b82f6")
- `secondaryColor` (string): Secondary brand color (default: "#1f2937")
- `fontFamily` (string): Font family (default: "system-ui, -apple-system, sans-serif")
- `borderRadius` (string): Border radius (default: "0.5rem")

**Output:**
- `theme` (object): Theme configuration
- `tailwindConfig` (string): Complete tailwind.config.js content

## Component Library

### Hero

Hero sections for landing pages with heading, subheading, CTA buttons, and optional images.

**Variants:** `centered`, `split`, `full-bleed`

**Example:**
```yaml
- type: hero
  variant: centered
  content:
    heading: "Welcome to Our Product"
    subheading: "The best solution for your needs"
    cta:
      - text: "Get Started"
        href: "#signup"
        variant: primary
    image: "https://example.com/hero.jpg"
```

### Features

Feature showcases with icons, titles, and descriptions in various grid layouts.

**Variants:** `grid-2`, `grid-3`, `grid-4`, `list`

**Example:**
```yaml
- type: features
  variant: grid-3
  heading: "Why Choose Us"
  items:
    - icon: "rocket"
      title: "Fast"
      description: "Lightning-fast performance"
```

### Content

Rich text content sections supporting markdown and HTML with typography styles.

**Variants:** `prose`, `narrow`, `wide`

**Example:**
```yaml
- type: content
  variant: prose
  markdown: |
    ## Getting Started
    
    Here's how to use our platform...
```

### CTA

Call-to-action sections to drive user engagement.

**Variants:** `centered`, `split`, `banner`

**Example:**
```yaml
- type: cta
  variant: centered
  heading: "Ready to get started?"
  description: "Join thousands of users today"
  cta:
    text: "Sign Up Free"
    href: "#signup"
```

### Navigation

Header navigation bars with logo, links, and optional CTA button.

**Variants:** `default`, `centered`, `split`

**Example:**
```yaml
- type: navigation
  logo:
    text: "Brand"
    href: "/"
  links:
    - text: "Features"
      href: "#features"
    - text: "Pricing"
      href: "#pricing"
  cta:
    text: "Sign In"
    href: "/login"
```

### Footer

Footer sections with links, social media, copyright, and optional newsletter signup.

**Variants:** `simple`, `detailed`, `newsletter`

**Example:**
```yaml
- type: footer
  variant: simple
  logo:
    text: "Brand"
  social:
    - platform: "twitter"
      href: "https://twitter.com/brand"
    - platform: "github"
      href: "https://github.com/brand"
  copyright: "© 2026 Brand. All rights reserved."
```

### Coming Soon

The following components are planned for future releases:

- **Testimonials**: Customer testimonials and reviews
- **Pricing**: Pricing tables and comparison grids
- **FAQ**: Frequently asked questions sections
- **Contact**: Contact forms with customizable fields
- **Gallery**: Image galleries with lightbox support

## Schema Structure

A complete page schema follows this structure:

```yaml
page:
  meta:                      # Optional metadata
    title: string           # Page title (required)
    description: string     # Meta description
    language: string        # Language code (e.g., "en")
    author: string          # Author name
    keywords: string[]      # SEO keywords
    ogImage: string         # Open Graph image URL
    
  layout:                   # Optional layout config
    type: standard|wide|narrow|docs
    theme: light|dark|auto
    
  sections:                 # Required sections array
    - type: component_type  # Required
      variant: string       # Optional variant
      id: string           # Optional HTML id
      className: string    # Optional CSS classes
      ...                  # Component-specific properties
```

## Examples

See the `examples/` directory for complete examples:

- `landing-page.yaml` - Full-featured SaaS landing page
- `docs-page.yaml` - Documentation page with content

## Architecture

Gutenberg is built with a modular architecture:

```
src/
├── types.ts              # TypeScript type definitions
├── parser.ts             # YAML → AST parser
├── validator.ts          # Schema validation
├── renderer.ts           # HTML rendering engine
├── components/           # Component library
│   ├── hero.ts
│   ├── features.ts
│   ├── content.ts
│   ├── cta.ts
│   ├── navigation.ts
│   ├── footer.ts
│   └── index.ts
└── templates/            # HTML templates
    ├── base.ts           # Document structure
    └── layouts.ts        # Layout wrappers
```

## Development

### Project Structure

```
gutenberg/
├── src/                  # Source code
├── tools/                # MCP tool implementations
├── examples/             # Example schemas
├── tests/                # Test files
├── package.json
├── tsconfig.json
└── README.md
```

### Adding a New Component

1. Create a new file in `src/components/` (e.g., `testimonials.ts`)
2. Implement the render function with variants
3. Add type definitions in `src/types.ts`
4. Register in `src/components/index.ts`
5. Add validation rules in `src/validator.ts`

### Type Checking

```bash
npx tsc --noEmit
```

### Testing

```bash
bun test
```

## Technical Details

### HTML Output Features

**Semantic HTML5:**
- Proper semantic tags (`<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`)
- Correct heading hierarchy (h1 → h2 → h3)
- Semantic lists for navigation
- `<figure>` and `<figcaption>` for images

**Accessibility:**
- ARIA labels where appropriate
- Alt text for images
- Keyboard navigation support
- Focus states for interactive elements
- Proper color contrast

**Tailwind CSS:**
- Utility-first classes
- Responsive breakpoints (sm:, md:, lg:, xl:)
- Dark mode support (`dark:` classes)
- Consistent spacing scale

**Performance:**
- Clean, minimal markup
- Proper meta tags
- Open Graph tags for social sharing
- Lazy loading for images

### Convention-Based Architecture

Gutenberg follows the Rosetta MCP framework conventions:

- **Auto-discovery**: Tools are automatically discovered from the `tools/` directory
- **No registration needed**: Tool names match directory names
- **Schema-driven**: Each tool has `index.ts`, `schema.json`, and `purpose.md`

## Contributing

Contributions are welcome! Here are some areas where you can help:

1. **New Components**: Implement testimonials, pricing, FAQ, contact, gallery
2. **Component Variants**: Add more variants to existing components
3. **Themes**: Build pre-designed color schemes
4. **Templates**: Create complete page templates (SaaS, blog, portfolio)
5. **Documentation**: Improve docs and add more examples

## License

MIT

## Acknowledgments

Built with:
- [Rosetta MCP Framework](https://github.com/example/rosetta)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Bun](https://bun.sh/)

## Support

For issues and questions:
- Open an issue on GitHub
- Check the examples directory
- Read the MCP documentation
