Validate a Gutenberg page schema and return detailed errors and warnings

Accepts a page schema as a YAML string or JavaScript object and validates it against Gutenberg's rules. Returns a result with 'valid' (boolean), 'errors' (array of {path, message} objects for blocking issues), and 'warnings' (array of strings for non-blocking suggestions). Validates section types, required fields per component type, and cross-section rules (e.g. multiple navigation sections).
