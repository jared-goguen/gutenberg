/**
 * Gutenberg Workers Utilities
 * 
 * Utilities and helpers for Cloudflare Pages Functions using Gutenberg
 * Workers Functions can import from this module to render templates dynamically
 */

// Re-export pipeline functions
export { lint, scaffold, editify, enrich, style } from '../pipeline/index.js';

// Re-export types
export type {
  PageSchema,
  TemplateSchema,
  TemplateConfig,
  PageMeta,
  PageLayout,
  Section,
  RenderOptions,
} from '../types.js';

// Re-export type guards
export { isPageSchema, isTemplateSchema } from '../types.js';

// Import types we need for handlers
import type { PageSchema, TemplateSchema } from '../types.js';
import { lint, scaffold, editify, enrich, style } from '../pipeline/index.js';
import YAML from 'yaml';

/**
 * Configuration for createEditHandler
 */
export interface EditHandlerConfig {
  templateKey: string;      // R2 key where template is stored (e.g., 'template.yaml')
  bucket: R2Bucket;         // R2 bucket binding from wrangler.toml
  routeParam: string;       // Route parameter name (e.g., 'date', 'slug')
  paramValidator?: (value: string) => boolean; // Optional: validate param format
  onSave?: (data: {
    param: string;
    yaml: string;
    schema: PageSchema;
  }) => Promise<void>;      // Optional: custom save handler
}

/**
 * Create a Cloudflare Pages Function handler for edit mode templates
 * 
 * Usage in functions/diary/[date].ts:
 * 
 * import { createEditHandler } from 'gutenberg/workers';
 * 
 * export const onRequest = createEditHandler({
 *   templateKey: 'template.yaml',
 *   bucket: env.DIARY_BUCKET,
 *   routeParam: 'date',
 *   paramValidator: (date) => /^\d{4}-\d{2}-\d{2}$/.test(date),
 * });
 */
export function createEditHandler(config: EditHandlerConfig) {
  return async (context: any): Promise<Response> => {
    const { request, env, params } = context;
    const paramValue = params[config.routeParam];

    // Validate parameter if validator provided
    if (config.paramValidator && !config.paramValidator(paramValue)) {
      return new Response(
        `Invalid ${config.routeParam}: ${paramValue}`,
        { status: 400, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');

    // POST = save
    if (request.method === 'POST') {
      return handleSave(config, paramValue, request, env);
    }

    // GET = render (view or edit)
    const renderMode: 'view' | 'edit' = mode === 'edit' ? 'edit' : 'view';
    return handleRender(config, paramValue, renderMode, env);
  };
}

/**
 * Handle GET requests - render entry in view or edit mode
 */
async function handleRender(
  config: EditHandlerConfig,
  paramValue: string,
  mode: 'view' | 'edit',
  env: any
): Promise<Response> {
  try {
    const bucket = config.bucket;

    // Try to load existing entry
    const entryKey = `entries/${paramValue}.yaml`;
    const existing = await bucket.get(entryKey);

    let yamlContent: string;

    if (existing) {
      // Load existing entry
      yamlContent = await existing.text();
    } else if (mode === 'edit') {
      // New entry in edit mode: use template
      const templateObj = await bucket.get(config.templateKey);
      if (!templateObj) {
        return new Response('Template not found', { status: 500 });
      }
      let template = await templateObj.text();
      // Replace {{PARAM}} placeholders (e.g., {{DATE}})
      const paramPlaceholder = `{{${config.routeParam.toUpperCase()}}}`;
      template = template.replace(new RegExp(paramPlaceholder, 'g'), paramValue);
      yamlContent = template;
    } else {
      // New entry in view mode: show 404 with create button
      return get404Response(paramValue, config.routeParam);
    }

    // Run Gutenberg pipeline
    const { schema, result } = lint(yamlContent);

    if (!result.valid) {
      return new Response(
        `Validation error: ${JSON.stringify(result.errors, null, 2)}`,
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const renderNodes = scaffold(schema);
    const editNodes = mode === 'edit' ? editify(renderNodes, schema) : renderNodes;
    const annotatedNodes = enrich(editNodes);
    const html = style(annotatedNodes, schema.page.meta, { mode });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return getErrorResponse(errorMsg);
  }
}

/**
 * Handle POST requests - save form data
 */
async function handleSave(
  config: EditHandlerConfig,
  paramValue: string,
  request: Request,
  env: any
): Promise<Response> {
  try {
    const bucket = config.bucket;
    const formData = await request.formData();

    // Load template to reconstruct YAML structure
    const templateObj = await bucket.get(config.templateKey);
    if (!templateObj) {
      return new Response('Template not found', { status: 500 });
    }

    const templateYAML = await templateObj.text();
    const template = YAML.parse(templateYAML) as PageSchema;

    // Convert form data to YAML and validate
    const newYAML = formDataToYAML(formData, template, paramValue, config.routeParam);
    const { schema, result: lintResult } = lint(newYAML);

    if (!lintResult.valid) {
      return new Response(
        `Validation error on save: ${JSON.stringify(lintResult.errors, null, 2)}`,
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call custom save handler if provided
    if (config.onSave) {
      await config.onSave({ param: paramValue, yaml: newYAML, schema });
    } else {
      // Default: save to R2
      await bucket.put(`entries/${paramValue}.yaml`, newYAML, {
        httpMetadata: { contentType: 'text/yaml' },
        customMetadata: { updated: new Date().toISOString() },
      });
    }

    // Redirect to view mode
    return new Response(null, {
      status: 303,
      headers: { Location: `?mode=view` },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return getErrorResponse(errorMsg);
  }
}

/**
 * Convert form data back to YAML structure.
 *
 * Field naming convention (matches editify): `section_{index}__{field}`
 * This ensures uniqueness even with multiple sections of the same type.
 *
 * Checkbox handling: editify emits a hidden input with value="off" before each
 * checkbox. When unchecked, the hidden input submits "off"; when checked, the
 * checkbox submits "on" (overriding the hidden input by name order).
 */
function formDataToYAML(
  formData: FormData,
  template: PageSchema,
  paramValue: string,
  routeParam: string
): string {
  const spec = JSON.parse(JSON.stringify(template));

  // Replace {{PARAM}} placeholders in meta (e.g., {{DATE}})
  const paramPlaceholder = `{{${routeParam.toUpperCase()}}}`;
  if (spec.page.meta?.title) {
    spec.page.meta.title = spec.page.meta.title.replace(
      new RegExp(paramPlaceholder, 'g'),
      paramValue
    );
  }
  if (spec.page.meta?.description) {
    spec.page.meta.description = spec.page.meta.description.replace(
      new RegExp(paramPlaceholder, 'g'),
      paramValue
    );
  }

  // Update sections from form data using index-based field names
  const sections = spec.page.sections;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Always replace {{PARAM}} placeholders regardless of _editable
    replacePlaceholders(section, paramPlaceholder, paramValue);

    if (!section._editable) continue;

    switch (section.type) {
      case 'hero': {
        const heading = formData.get(`section_${i}__heading`);
        if (heading !== null) {
          section.content.heading = heading.toString();
        }
        break;
      }

      case 'content': {
        const markdown = formData.get(`section_${i}__markdown`);
        if (markdown !== null) {
          section.markdown = markdown.toString();
        }
        break;
      }

      case 'table': {
        for (const cell of section.cells) {
          const fieldName = `section_${i}__${cell.label}`;
          const value = formData.get(fieldName);

          if (cell.type === 'bool') {
            // Hidden input pattern: "on" = checked, "off" = unchecked
            cell.value = value === 'on';
          } else if (cell.type === 'numeric') {
            if (value !== null) {
              cell.value = parseFloat(value as string) || 0;
            }
          } else {
            if (value !== null) {
              cell.value = value.toString();
            }
          }
        }
        break;
      }
    }
  }

  return YAML.stringify(spec);
}

/**
 * Replace {{PARAM}} placeholders in a section's text fields.
 */
function replacePlaceholders(section: any, placeholder: string, value: string): void {
  const re = new RegExp(placeholder, 'g');
  if (section.type === 'hero' && section.content?.heading) {
    section.content.heading = section.content.heading.replace(re, value);
  }
  if (section.type === 'content' && section.markdown) {
    section.markdown = section.markdown.replace(re, value);
  }
}

/**
 * Generate 404 HTML page with create button
 */
function get404Response(paramValue: string, paramName: string): Response {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not Found</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, sans-serif;
      max-width: 600px;
      margin: 4rem auto;
      padding: 2rem;
      background: #0a0a0a;
      color: #e0e0e0;
      text-align: center;
    }
    h1 { color: white; margin-bottom: 1rem; }
    p { margin: 1rem 0; line-height: 1.6; }
    a {
      display: inline-block;
      margin-top: 2rem;
      padding: 1rem 2rem;
      background: #e63946;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: background 0.2s;
    }
    a:hover { background: #d62828; }
  </style>
</head>
<body>
  <h1>Not Found</h1>
  <p>No entry exists for <strong>${escapeHTML(paramValue)}</strong></p>
  <p>Create a new entry to get started:</p>
  <a href="?mode=edit">Create New Entry</a>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Generate error HTML page
 */
function getErrorResponse(errorMsg: string): Response {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, sans-serif;
      max-width: 600px;
      margin: 4rem auto;
      padding: 2rem;
      background: #0a0a0a;
      color: #e0e0e0;
      text-align: center;
    }
    h1 { color: #e63946; margin-bottom: 1rem; }
    p { margin: 1rem 0; line-height: 1.6; }
    code {
      background: rgba(255,255,255,0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 2px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <h1>Error</h1>
  <p><code>${escapeHTML(errorMsg)}</code></p>
</body>
</html>`;

  return new Response(html, {
    status: 500,
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Escape HTML entities
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
