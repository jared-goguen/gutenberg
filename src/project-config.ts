/**
 * Site configuration — reads _site.yaml (or legacy _project.yaml).
 *
 * Thin adapter between the SiteSpec vocabulary (specs/site)
 * and the build/deploy pipeline. Consumers get a SiteSpec with resolved
 * defaults (targets).
 *
 * Migration: _site.yaml takes priority. Falls back to _project.yaml
 * for projects that haven't migrated yet.
 */

import { readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { fromSiteYaml } from "./specs/site/index.js";
import type { SiteSpec, TargetName } from "./specs/site/index.js";

export type { SiteSpec, TargetName } from "./specs/site/index.js";

// Legacy alias — consumers that imported ProjectConfig get SiteSpec
export type ProjectConfig = SiteSpec;

/**
 * Resolve the target list with defaults.
 * SiteSpec.targets is optional; the pipeline needs a concrete list.
 */
export function resolvedTargets(spec: SiteSpec): TargetName[] {
  return spec.targets && spec.targets.length > 0
    ? spec.targets
    : ["cloudflare-pages"];
}

/**
 * Read _site.yaml (or _project.yaml) from a project directory.
 * Returns the SiteSpec, or null if neither file exists.
 */
export async function readProjectConfig(
  projectDir: string,
): Promise<SiteSpec | null> {
  // Prefer _site.yaml
  const siteYaml = await tryReadFile(join(projectDir, "_site.yaml"));
  if (siteYaml !== null) {
    return fromSiteYaml(siteYaml);
  }

  // Fall back to _project.yaml (legacy)
  const projectYaml = await tryReadFile(join(projectDir, "_project.yaml"));
  if (projectYaml !== null) {
    return fromSiteYaml(projectYaml);
  }

  return null;
}

/**
 * Read site config or throw with a clear error.
 */
export async function requireProjectConfig(
  projectDir: string,
): Promise<SiteSpec> {
  const config = await readProjectConfig(projectDir);
  if (!config) {
    throw new Error(
      `No _site.yaml or _project.yaml found in ${projectDir}. Create one with:\n  project: ${basename(projectDir)}`,
    );
  }
  return config;
}

/**
 * Generate _site.yaml content for a new project.
 */
export function projectYaml(projectName: string): string {
  return `# Gutenberg site spec — project identity and governance.
project: ${projectName}
`;
}

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
