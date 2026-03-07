import { getComponentList } from "../../src/components/index.js";

export async function listComponents(_input: Record<string, unknown>) {
  const components = getComponentList();

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(components),
    }],
  };
}
