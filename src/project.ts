/**
 * Project-level utilities (legacy compat)
 *
 * Most project operations are now in project-config.ts and build.ts.
 * This file keeps utilities used by snapshot and other tools.
 */

import { promises as fs } from "fs";
import { dirname, join, basename, relative } from "path";

/**
 * Find the project root by walking up looking for _site.yaml, _project.yaml, or gutenberg.yaml.
 */
export async function findProjectRoot(specPath: string): Promise<string> {
  let dir = dirname(specPath);

  while (dir !== "/") {
    for (const name of ["_site.yaml", "_project.yaml", "gutenberg.yaml"]) {
      try {
        await fs.access(join(dir, name));
        return dir;
      } catch {
        // keep looking
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return dirname(specPath);
}

/**
 * Get the output directory for a project (.site/ for new pipeline).
 */
export async function getSiteDir(specPath: string): Promise<string> {
  const projectRoot = await findProjectRoot(specPath);
  return join(projectRoot, ".site");
}

/**
 * Get the artifact path for a given spec and stage.
 */
export async function getArtifactPath(
  specPath: string,
  stage: "lint" | "html" | "png",
): Promise<string> {
  const projectRoot = await findProjectRoot(specPath);
  const siteDir = join(projectRoot, ".site");
  const relPath = relative(projectRoot, specPath);
  const relDir = dirname(relPath);
  const specName = basename(specPath, ".yaml");
  const artifactDir = relDir === "." ? siteDir : join(siteDir, relDir);

  const ext = stage === "lint" ? "lint.json" : stage;
  const fileName = specName === "_index" ? `index.${ext}` : `${specName}.${ext}`;
  return join(artifactDir, fileName);
}

/**
 * Discover all YAML page specs in a project directory (recursively).
 */
export async function discoverPages(projectDir: string): Promise<string[]> {
  const pages: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".site" || entry.name === "rendered" || entry.name.startsWith(".")) continue;
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".yaml")) {
        if (["_site.yaml", "_project.yaml", "gutenberg.yaml"].includes(entry.name)) continue;
        pages.push(fullPath);
      }
    }
  }

  await walk(projectDir);
  return pages.sort();
}
