import { promises as fs } from "fs";
import { dirname } from "path";
import { lint } from "../../src/pipeline/index.js";
import { getArtifactPath } from "../../src/project.js";

export async function handler(input: Record<string, unknown>) {
  const spec_path = input.spec_path as string;

  if (!spec_path) {
    throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
  }

  // Get artifact path using convention
  const lint_path = await getArtifactPath(spec_path, "lint");

  // Create output directory
  await fs.mkdir(dirname(lint_path), { recursive: true });

  // Read the YAML file
  const yamlContent = await fs.readFile(spec_path, "utf8");

  // Run LINT stage
  const lintOutput = lint(yamlContent);

  // Write lint artifact to disk
  await fs.writeFile(
    lint_path,
    JSON.stringify({
      schema: lintOutput.schema,
      result: lintOutput.result,
    }, null, 2),
    "utf8"
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          lint_path,
          valid: lintOutput.result.valid,
          errors: lintOutput.result.errors.length,
          warnings: lintOutput.result.warnings.length,
        }),
      },
    ],
  };
}
