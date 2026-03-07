Render a full HTML page from a Gutenberg page schema

Accepts a page schema as a YAML string or JavaScript object and returns a complete HTML document. The schema describes the page structure as an ordered list of sections (hero, features, content, cta, navigation, footer, etc.), optional page metadata (title, description, og tags), and an optional layout (standard, wide, narrow, docs) with a theme (light, dark, auto). Returns the rendered HTML ready to deploy.
