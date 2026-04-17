import { promises as fs } from "fs";
import { basename } from "path";
import { scaffold } from "../../src/pipeline/index.js";
import { getArtifactPath } from "../../src/project.js";
import type { PageSchema } from "../../src/types.js";

export async function handler(input: Record<string, unknown>) {
  const spec_path = input.spec_path as string;

  if (!spec_path) {
    throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
  }

  // Get artifact paths using convention
  const lint_path = await getArtifactPath(spec_path, "lint");
  const scaffold_path = await getArtifactPath(spec_path, "scaffold");

  // Read the lint artifact
  const lintContent = await fs.readFile(lint_path, "utf8");
  const lintData = JSON.parse(lintContent);
  const schema = lintData.schema as PageSchema;

  // Run SCAFFOLD stage
  const renderNodes = scaffold(schema);

  // Write scaffold artifact to disk
  const specName = basename(spec_path, ".yaml");
  await fs.writeFile(
    scaffold_path,
    JSON.stringify({
      spec_name: specName,
      nodes: renderNodes,
    }, null, 2),
    "utf8"
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          scaffold_path,
          section_count: renderNodes.length,
        }),
      },
    ],
  };
}
