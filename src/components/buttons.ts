import { escapeHTML } from "../renderer.js";
import type { CTA } from "../types.js";
import type { SemanticStyles } from "../semantic.js";

/**
 * Unified button renderer - supports all variants, sizes, and semantic styles
 * Replaces: renderButton, renderFullBleedButton, renderNavigationButton
 */
export function renderButton(
  cta: CTA,
  styles: SemanticStyles,
  options: {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
  } = {}
): string {
  const variant = cta.variant || options.variant || "primary";
  const size = options.size || "md";
  const fullWidth = options.fullWidth || false;

  // Size classes
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  // Use semantic styles for primary/secondary variants
  // For outline/ghost, build from semantic base + custom styling
  const variantClasses =
    variant === "primary"
      ? styles.interactive.buttonPrimary
      : variant === "secondary"
        ? styles.interactive.buttonSecondary
        : variant === "outline"
          ? `border-2 ${styles.colors.accent} hover:opacity-80 transition-all`
          : variant === "ghost"
            ? `${styles.colors.text} opacity-70 hover:opacity-100 transition-opacity`
            : styles.interactive.buttonPrimary;

  const baseClasses = "rounded-lg font-medium inline-flex items-center justify-center transition-all duration-200";
  const widthClass = fullWidth ? "w-full" : "";

  const classes = `${variantClasses} ${sizeClasses[size]} ${baseClasses} ${widthClass}`.trim();

  return `<a href="${escapeHTML(cta.href)}" class="${classes}">${escapeHTML(cta.text)}</a>`;
}

/**
 * Render a button group (multiple buttons with proper spacing)
 */
export function renderButtonGroup(
  ctas: CTA[],
  styles: SemanticStyles,
  options: {
    layout?: "horizontal" | "vertical";
    primaryVariant?: string;
    size?: "sm" | "md" | "lg";
  } = {}
): string {
  const layout = options.layout || "horizontal";
  const size = options.size || "md";

  const buttons = ctas
    .map((cta, index) => {
      // First button is primary by default, rest are secondary
      const variant = index === 0 ? "primary" : "secondary";
      return renderButton(cta, styles, { variant, size });
    })
    .join("\n");

  const containerClass = layout === "horizontal" ? "flex flex-wrap gap-4" : "flex flex-col gap-3";

  return `<div class="${containerClass}">${buttons}</div>`;
}
