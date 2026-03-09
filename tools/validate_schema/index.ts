import { parseSchema } from "../../src/parser.js";
import { validateSchema } from "../../src/validator.js";
import { promises as fs } from "fs";

export async function handler(input: Record<string, unknown>) {
  const spec_path = input.spec_path as string;

  if (!spec_path) {
    throw new Error("'spec_path' is required - provide an absolute path to a page specification YAML file");
  }

  // Read the schema from the file
  const schemaContent = await fs.readFile(spec_path, "utf8");
  const page = parseSchema(schemaContent);
  const result = validateSchema(page);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(result),
    }],
  };
}
