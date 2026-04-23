/**
 * Gutenberg Workers Utilities
 *
 * Utilities and helpers for Cloudflare Pages Functions using Gutenberg.
 * Workers Functions can import from this module to render templates dynamically.
 *
 * Uses the new pipeline: fromYaml → sanitizeSpec → compile → wrapDocument.
 * Edit mode is currently stubbed — see src/pipeline/editify.ts.
 */

// Re-export new pipeline functions for consumers
export { fromYaml, validateSpec } from '../specs/page/yaml.js';
export { sanitizeSpec } from '../specs/page/sanitize.js';
export { compile, compileYaml } from '../compile.js';
export { wrapDocument } from '../document.js';

// Re-export types
export type {
  PageSpec,
  SpecBlock,
} from '../specs/page/index.js';

// Import what we need for handlers
import type { PageSpec } from '../specs/page/index.js';
import { fromYaml, validateSpec } from '../specs/page/yaml.js';
import { sanitizeSpec } from '../specs/page/sanitize.js';
import { compile } from '../compile.js';
import { wrapDocument } from '../document.js';
import { compileEdit, findEditableBlocks } from '../pipeline/editify.js';
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
    spec: PageSpec;
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
    const { request, params } = context;
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
      return handleSave(config, paramValue, request);
    }

    // GET = render (view or edit)
    if (mode === 'edit') {
      return handleEditRender(config, paramValue);
    }

    return handleRender(config, paramValue);
  };
}

/**
 * Handle GET requests — render entry in view mode using the new pipeline.
 *
 * Pipeline: YAML → fromYaml → sanitizeSpec → compile → wrapDocument → HTML
 */
async function handleRender(
  config: EditHandlerConfig,
  paramValue: string,
): Promise<Response> {
  try {
    const bucket = config.bucket;

    // Try to load existing entry
    const entryKey = `entries/${paramValue}.yaml`;
    const existing = await bucket.get(entryKey);

    let yamlContent: string;

    if (existing) {
      yamlContent = await existing.text();
    } else {
      // No entry in view mode: show 404 with create button
      return get404Response(paramValue, config.routeParam);
    }

    // New pipeline: parse → sanitize → compile
    const spec = fromYaml(yamlContent);
    const issues = validateSpec(spec);
    if (issues.length > 0) {
      const errors = issues.filter(i => i.severity === 'error');
      if (errors.length > 0) {
        return new Response(
          `Validation error: ${JSON.stringify(errors, null, 2)}`,
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    sanitizeSpec(spec);
    const result = compile(spec);

    // Wrap in a full HTML document
    const title = spec.title ?? 'Untitled';
    const html = wrapDocument({
      title,
      body: result.html,
      stylesheet: '', // TODO: generate stylesheet from theme
      density: 'standard',
      separation: 'balanced',
      emphasis: 'moderate',
      shadow: 'soft',
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return getErrorResponse(errorMsg);
  }
}

/**
 * Handle GET ?mode=edit — render entry with editable form inputs.
 *
 * Runs the full pipeline (enrichment, tonal colors, etc.) but editable
 * blocks render as form inputs instead of display elements.
 */
async function handleEditRender(
  config: EditHandlerConfig,
  paramValue: string,
): Promise<Response> {
  try {
    const bucket = config.bucket;

    // Load template to determine editable blocks
    const templateObj = await bucket.get(config.templateKey);
    if (!templateObj) {
      return getErrorResponse('Template not found');
    }
    const templateYaml = await templateObj.text();
    const templateRaw = YAML.parse(templateYaml) as Record<string, unknown>;
    const editableBlocks = findEditableBlocks(templateRaw);

    // Load existing entry or use template as starting point
    const entryKey = `entries/${paramValue}.yaml`;
    const existing = await bucket.get(entryKey);
    const yamlContent = existing ? await existing.text() : templateYaml;

    // Parse and compile in edit mode
    const spec = fromYaml(yamlContent);
    sanitizeSpec(spec);
    const result = compileEdit(spec, editableBlocks);

    return new Response(result.html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return getErrorResponse(errorMsg);
  }
}

/**
 * Handle POST requests — save form data.
 * Reconstructs YAML from form fields and stores in R2.
 */
async function handleSave(
  config: EditHandlerConfig,
  paramValue: string,
  request: Request,
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
    const template = YAML.parse(templateYAML) as Record<string, any>;

    // Convert form data to YAML and validate
    const newYAML = formDataToYAML(formData, template, paramValue, config.routeParam);
    const spec = fromYaml(newYAML);
    const issues = validateSpec(spec);
    const errors = issues.filter(i => i.severity === 'error');

    if (errors.length > 0) {
      return new Response(
        `Validation error on save: ${JSON.stringify(errors, null, 2)}`,
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call custom save handler if provided
    if (config.onSave) {
      await config.onSave({ param: paramValue, yaml: newYAML, spec });
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
  template: Record<string, any>,
  paramValue: string,
  routeParam: string
): string {
  const spec = JSON.parse(JSON.stringify(template));

  // Replace {{PARAM}} placeholders in meta (e.g., {{DATE}})
  const paramPlaceholder = `{{${routeParam.toUpperCase()}}}`;
  if (spec.title) {
    spec.title = spec.title.replace(
      new RegExp(paramPlaceholder, 'g'),
      paramValue
    );
  }

  // Update blocks from form data using index-based field names
  const blocks = spec.blocks ?? [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Always replace {{PARAM}} placeholders
    replacePlaceholders(block, paramPlaceholder, paramValue);

    if (!block._editable) continue;

    // Determine block type from the block's key structure
    const blockType = Object.keys(block).find(k => k !== '_editable' && k !== 'layout');

    switch (blockType) {
      case 'hero': {
        const title = formData.get(`section_${i}__title`);
        if (title !== null && block.hero) {
          block.hero.title = title.toString();
        }
        const subtitle = formData.get(`section_${i}__subtitle`);
        if (subtitle !== null && block.hero) {
          block.hero.subtitle = subtitle.toString();
        }
        const body = formData.get(`section_${i}__body`);
        if (body !== null && block.hero) {
          block.hero.body = body.toString();
        }
        break;
      }

      case 'prose': {
        const text = formData.get(`section_${i}__text`);
        if (text !== null && block.prose) {
          block.prose.text = text.toString();
        }
        break;
      }

      case 'table': {
        if (!block.table?.rows) break;
        for (const row of block.table.rows) {
          for (const cell of row.cells ?? []) {
            const fieldName = `section_${i}__${cell.label}`;
            const value = formData.get(fieldName);

            if (cell.type === 'bool') {
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
        }
        break;
      }
    }
  }

  return YAML.stringify(spec);
}

/**
 * Replace {{PARAM}} placeholders in a block's text fields.
 */
function replacePlaceholders(block: any, placeholder: string, value: string): void {
  const re = new RegExp(placeholder, 'g');
  if (block.hero?.title) {
    block.hero.title = block.hero.title.replace(re, value);
  }
  if (block.prose?.body) {
    block.prose.body = block.prose.body.replace(re, value);
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
  <style>
    body {
      font-family: 'Helvetica Neue', system-ui, sans-serif;
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
  <style>
    body {
      font-family: 'Helvetica Neue', system-ui, sans-serif;
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
