import type { ThemeSpec } from "../../src/theme.js";
import { hues } from "../../src/palettes.js";

export async function generateTheme(input: {
  primaryHue?: string;
  neutralHue?: string;
}) {
  // Validate hue names
  const primaryHue = input.primaryHue || "sky";
  const neutralHue = input.neutralHue || "slate";

  if (!hues[primaryHue]) {
    throw new Error(`Unknown primary hue: ${primaryHue}`);
  }
  if (!hues[neutralHue]) {
    throw new Error(`Unknown neutral hue: ${neutralHue}`);
  }

  // Create light theme spec
  const lightSpec: ThemeSpec = {
    name: "light",
    hues: {
      primary: primaryHue,
      neutral: neutralHue,
    },
    tokens: {
      "primary": "primary.500",
      "primary-hover": "primary.600",
      "bg-page": "white",
      "bg-subtle": "neutral.50",
      "bg-inverse": "neutral.950",
      "text-default": "neutral.900",
      "text-muted": "neutral.500",
      "text-inverse": "white",
      "border": "neutral.200",
      "feature": "primary.100",
    },
    radius: {
      button: "rounded-lg",
      card: "rounded-lg",
    },
  };

  // Create dark theme spec
  const darkSpec: ThemeSpec = {
    name: "dark",
    hues: {
      primary: primaryHue,
      neutral: neutralHue,
    },
    tokens: {
      "primary": "primary.400",
      "primary-hover": "primary.300",
      "bg-page": "neutral.950",
      "bg-subtle": "neutral.900",
      "bg-inverse": "white",
      "text-default": "neutral.50",
      "text-muted": "neutral.400",
      "text-inverse": "neutral.950",
      "border": "neutral.800",
      "feature": "primary.900",
    },
    radius: {
      button: "rounded-lg",
      card: "rounded-lg",
    },
  };

  // List available hues for documentation
  const availableHues = Object.keys(hues);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        light: lightSpec,
        dark: darkSpec,
        availableHues,
      }, null, 2),
    }],
  };
}
