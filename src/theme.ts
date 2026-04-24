import type { ThemeTokens } from "./chromata/themes.js";

/**
 * Convert ThemeTokens to CSS custom properties.
 * These are set on :root and consumed by all block styles via var(--gb-*).
 */
export function themeToCSS(t: ThemeTokens): string {
  return `:root {
  /* Surfaces */
  --gb-surface-page: ${t.surface.page};
  --gb-surface-base: ${t.surface.base};
  --gb-surface-deep: ${t.surface.deep};
  --gb-surface-mid: ${t.surface.mid};
  --gb-surface-raised: ${t.surface.raised};

  /* Text */
  --gb-text-primary: ${t.text.primary};
  --gb-text-body: ${t.text.body};
  --gb-text-muted: ${t.text.muted};
  --gb-text-caption: ${t.text.caption};
  --gb-text-label: ${t.text.label};
  --gb-text-link: ${t.text.link};

  /* Chrome */
  --gb-chrome-border: ${t.chrome.border};
  --gb-chrome-divider: ${t.chrome.divider};
  --gb-chrome-stripe: ${t.chrome.stripe};
  --gb-chrome-gap: ${t.chrome.gap};
  --gb-chrome-label-bg: ${t.chrome.labelBg};

  /* Accent */
  --gb-accent: ${t.accent};

  /* Syntax highlighting */
  --gb-hl-string: ${t.syntax.string};
  --gb-hl-number: ${t.syntax.number};
  --gb-hl-property: ${t.syntax.property};
  --gb-hl-type: ${t.syntax.type};
  --gb-hl-builtin: ${t.syntax.builtin};
  --gb-hl-constant: ${t.syntax.constant};

  /* Typography */
  --gb-font-body: ${t.typography.body};
  --gb-font-heading: ${t.typography.heading};
  --gb-font-mono: ${t.typography.mono};

  /* Shape */
  --gb-radius-sm: ${t.radius.sm};
  --gb-radius-md: ${t.radius.md};
  --gb-radius-lg: ${t.radius.lg};

  /* Tracking */
  --gb-tracking-tight: ${t.tracking.tight};
  --gb-tracking-wide: ${t.tracking.wide};
}`;
}
