/**
 * Project-level utilities
 * 
 * Shared logic for finding project roots, artifact paths, and auto-discovery
 */

import { promises as fs } from "fs";
import { dirname, join, basename, extname, relative } from "path";
import { parse as parseYaml } from "yaml";
import type { PageSchema } from "./types.js";

export interface ProjectConfig {
  project: {
    name: string;
  };
}

export interface PageInfo {
  spec_path: string;
  title: string;
  href: string;
}

/**
 * Find the project root by walking up from spec_path looking for gutenberg.yaml
 * Falls back to the spec's directory if no project config found
 */
export async function findProjectRoot(specPath: string): Promise<string> {
  let dir = dirname(specPath);
  
  while (dir !== "/") {
    const projectPath = join(dir, "gutenberg.yaml");
    try {
      await fs.access(projectPath);
      return dir;
    } catch {
      // Keep searching up
    }
    
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  
  // No project file found, use spec's directory
  return dirname(specPath);
}

/**
 * Get the rendered directory for a spec (always {projectRoot}/rendered)
 */
export async function getRenderedDir(specPath: string): Promise<string> {
  const projectRoot = await findProjectRoot(specPath);
  return join(projectRoot, "rendered");
}

/**
 * Get the artifact path for a given spec and stage
 */
export async function getArtifactPath(
  specPath: string,
  stage: "lint" | "scaffold" | "enrich" | "html" | "png"
): Promise<string> {
  const projectRoot = await findProjectRoot(specPath);
  const renderedDir = join(projectRoot, "rendered");
  
  // Get the spec's path relative to project root
  const relPath = relative(projectRoot, specPath);
  const relDir = dirname(relPath);
  
  // Get spec name (without .yaml extension)
  const specName = basename(specPath, ".yaml");
  
  // Build artifact path
  const artifactDir = relDir === "." ? renderedDir : join(renderedDir, relDir);
  
  let ext: string;
  switch (stage) {
    case "lint":
      ext = "lint.json";
      break;
    case "scaffold":
      ext = "scaffold.json";
      break;
    case "enrich":
      ext = "enrich.json";
      break;
    case "html":
      ext = "html";
      break;
    case "png":
      ext = "png";
      break;
  }
  
  // Special case: _index.yaml → index.{ext}
  const fileName = specName === "_index" ? `index.${ext}` : `${specName}.${ext}`;
  
  return join(artifactDir, fileName);
}

/**
 * Discover all page specs in a project (recursively)
 * Excludes gutenberg.yaml itself
 */
export async function discoverPages(projectPath: string): Promise<string[]> {
  const projectDir = dirname(projectPath);
  const pages: string[] = [];
  
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip rendered directory and hidden directories
        if (entry.name === "rendered" || entry.name.startsWith(".")) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".yaml")) {
        // Skip gutenberg.yaml itself
        if (entry.name === "gutenberg.yaml") {
          continue;
        }
        pages.push(fullPath);
      }
    }
  }
  
  await walk(projectDir);
  return pages.sort();
}

/**
 * Parse a project config file
 */
export async function parseProjectConfig(projectPath: string): Promise<ProjectConfig> {
  const content = await fs.readFile(projectPath, "utf8");
  return parseYaml(content) as ProjectConfig;
}

/**
 * Build a flat navigation structure from all pages in a project
 * Returns [{text, href}] where text is page title and href is the URL path
 */
export async function buildNavStructure(
  pages: string[],
  projectRoot: string
): Promise<Array<{ text: string; href: string }>> {
  const nav: Array<{ text: string; href: string }> = [];
  
  for (const specPath of pages) {
    try {
      // Read the page's lint artifact to get its title
      const lintPath = await getArtifactPath(specPath, "lint");
      const lintContent = await fs.readFile(lintPath, "utf8");
      const lintData = JSON.parse(lintContent);
      const schema = lintData.schema as PageSchema;
      
      const title = schema.page.meta?.title || basename(specPath, ".yaml");
      
      // Compute href from spec path
      const relPath = relative(projectRoot, specPath);
      const relDir = dirname(relPath);
      const specName = basename(specPath, ".yaml");
      
      let href: string;
      if (specName === "_index") {
        href = relDir === "." ? "/" : `/${relDir}/`;
      } else {
        href = relDir === "." ? `/${specName}` : `/${relDir}/${specName}`;
      }
      
      nav.push({ text: title, href });
    } catch (err) {
      // If lint artifact doesn't exist yet, skip this page
      // (this can happen during the first build pass)
      continue;
    }
  }
  
  return nav;
}
