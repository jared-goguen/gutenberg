/**
 * Gutenberg Theme System — ThemeSpec and defaults
 *
 * ThemeSpec defines:
 * 1. Hue bindings: which semantic hue alias maps to which OKLCH hue name
 * 2. Token expressions: semantic token names map to color expressions
 * 3. Radius: Tailwind utility class names for border radii
 */

export interface ThemeSpec {
  name: string;
  hues: {
    primary: string;   // e.g., "sky", "violet", "rose"
    neutral: string;   // e.g., "slate", "neutral"
    [alias: string]: string;  // extensible
  };
  tokens: Record<string, string>;  // token name → color expression
  radius: {
    button: string;    // e.g., "rounded-lg"
    card: string;      // e.g., "rounded-lg"
  };
}

/**
 * Default light theme
 * Uses sky blue as primary, slate (subtle cool tint) as neutral
 */
export const defaultThemeSpec: ThemeSpec = {
  name: "light",
  hues: {
    primary: "sky",
    neutral: "slate",
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

/**
 * Dark theme
 * Same hues, but tokens reference darker steps
 */
export const darkThemeSpec: ThemeSpec = {
  name: "dark",
  hues: {
    primary: "sky",
    neutral: "slate",
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

/**
 * Resolve a theme spec by name
 */
export function resolveTheme(themeSpec?: string | ThemeSpec | null): ThemeSpec {
  if (!themeSpec) {
    return defaultThemeSpec;
  }

  if (typeof themeSpec === "string") {
    switch (themeSpec) {
      case "dark":
        return darkThemeSpec;
      case "light":
      default:
        return defaultThemeSpec;
    }
  }

  return themeSpec;
}

/**
 * Merge theme spec overrides with a base theme spec
 */
export function mergeTheme(base: ThemeSpec, overrides?: Partial<ThemeSpec>): ThemeSpec {
  if (!overrides) {
    return base;
  }

  return {
    name: overrides.name || base.name,
    hues: {
      primary: overrides.hues?.primary || base.hues.primary,
      neutral: overrides.hues?.neutral || base.hues.neutral,
      ...overrides.hues,
    },
    tokens: {
      ...base.tokens,
      ...overrides.tokens,
    },
    radius: {
      button: overrides.radius?.button || base.radius.button,
      card: overrides.radius?.card || base.radius.card,
    },
  };
}
