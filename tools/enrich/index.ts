import { promises as fs } from "fs";
import { basename } from "path";
import { enrich } from "../../src/pipeline/index.js";
import { getArtifactPath } from "../../src/project.js";
import type { RenderNode } from "../../src/scaffold/node.js";

export async function handler(input: Record<string, unknown>) {
  const spec_path = input.spec_path as string;

  if (!spec_path) {
    throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
  }

  // Get artifact paths using convention
  const scaffold_path = await getArtifactPath(spec_path, "scaffold");
  const enrich_path = await getArtifactPath(spec_path, "enrich");

  // Read the scaffold artifact
  const scaffoldContent = await fs.readFile(scaffold_path, "utf8");
  const scaffoldData = JSON.parse(scaffoldContent);
  const renderNodes = scaffoldData.nodes as RenderNode[];

  // Run ENRICH stage
  const annotatedNodes = enrich(renderNodes);

  // Write enrich artifact to disk
  const specName = basename(spec_path, ".yaml");
  await fs.writeFile(
    enrich_path,
    JSON.stringify({
      spec_name: specName,
      nodes: annotatedNodes,
    }, null, 2),
    "utf8"
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          enrich_path,
          section_count: annotatedNodes.length,
        }),
      },
    ],
  };
}
