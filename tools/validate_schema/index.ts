import { parseSchema } from "../../src/parser.js";
import { validateSchema } from "../../src/validator.js";

export async function validatePageSchema(input: {
  schema: string | Record<string, unknown>;
}) {
  const page = parseSchema(input.schema);
  const result = validateSchema(page);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(result),
    }],
  };
}
