/**
 * compile() — public entry point for the gutenberg pipeline.
 *
 * plan() → engine.render(). Defaults to HTML5 engine (Cloudflare Pages).
 */

import type { PageSpec } from "./specs/page/index.js";
import { fromYaml } from "./specs/page/yaml.js";
import { sanitizeSpec } from "./specs/page/sanitize.js";

import { plan } from "./plan.js";
import { html5Engine } from "./engines/html5.js";
import type { RenderEngine } from "./backend.js";

export { plan } from "./plan.js";
export type { CompilePlan, RenderResult, RenderEngine, PlanOptions } from "./backend.js";
export type { CompileResult, CompileOptions } from "./engines/html5.js";
export { html5Engine } from "./engines/html5.js";

import type { CompileResult, CompileOptions } from "./engines/html5.js";

/** Compile a PageSpec to HTML5. Accepts an alternate engine for future targets. */
export function compile(
  spec: PageSpec,
  options?: CompileOptions,
  engine: RenderEngine<CompileOptions> = html5Engine,
): CompileResult {
  return engine.render(plan(spec), options) as CompileResult;
}

/** Parse YAML, sanitize, and compile to HTML5. */
export function compileYaml(
  yaml: string,
  options?: CompileOptions,
  engine: RenderEngine<CompileOptions> = html5Engine,
): CompileResult {
  const spec = fromYaml(yaml);
  sanitizeSpec(spec);
  return compile(spec, options, engine);
}
