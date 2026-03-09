import { PageMeta, RenderOptions } from "../types.js";
import { h, selfClosing, renderHTML } from "../renderer.js";
import type { ThemeSpec } from "chromata";
import { resolveThemeSpec } from "chromata";
import { generateUtilityCSS } from "../css-generator.js";

/**
 * Generate complete HTML document
 */
export function renderDocument(
  meta: PageMeta | undefined,
  body: string,
  options: RenderOptions = {}
): string {
  const title = meta?.title || "Untitled Page";
  const description = meta?.description || "";
  const language = meta?.language || "en";

  // Resolve theme and generate CSS variables + utility classes
  const theme = options.theme;
  let themeCSS = "";
  if (theme) {
    const resolved = resolveThemeSpec(theme.hues, theme.tokens);
    themeCSS = resolved.cssVars + "\n" + resolved.utilityClasses;
  }

  const head = h("head", null,
    selfClosing("meta", { charset: "UTF-8" }),
    selfClosing("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
    h("title", null, title),
    
    // Meta tags
    description ? selfClosing("meta", { name: "description", content: description }) : "",
    meta?.keywords ? selfClosing("meta", { name: "keywords", content: meta.keywords.join(", ") }) : "",
    meta?.author ? selfClosing("meta", { name: "author", content: meta.author }) : "",
    
    // Open Graph
    selfClosing("meta", { property: "og:title", content: title }),
    description ? selfClosing("meta", { property: "og:description", content: description }) : "",
    meta?.ogImage ? selfClosing("meta", { property: "og:image", content: meta.ogImage }) : "",
    selfClosing("meta", { property: "og:type", content: "website" }),
    
    // Twitter Card
    selfClosing("meta", { name: "twitter:card", content: "summary_large_image" }),
    selfClosing("meta", { name: "twitter:title", content: title }),
    description ? selfClosing("meta", { name: "twitter:description", content: description }) : "",
    meta?.ogImage ? selfClosing("meta", { name: "twitter:image", content: meta.ogImage }) : "",
    
    // Custom styles (theme CSS vars + utility classes + default styles)
    h("style", null, `
${themeCSS}

${theme ? generateUtilityCSS(theme) : ""}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}

/* Focus visible */
*:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}
    `)
  );

  const bodyNode = h("body", { class: "antialiased" }, body);

  const html = h("html", { lang: language }, head, bodyNode);

  return "<!DOCTYPE html>\n" + renderHTML(html, options);
}

/**
 * Render a container wrapper
 */
export function renderContainer(content: string, width: "standard" | "wide" | "narrow" | "full" = "standard"): string {
  const widthClasses = {
    standard: "max-w-7xl",
    wide: "max-w-[1400px]",
    narrow: "max-w-4xl",
    full: "max-w-full",
  };

  return `<div class="container mx-auto px-4 sm:px-6 lg:px-8 ${widthClasses[width]}">${content}</div>`;
}

/**
 * Render a section wrapper
 */
export function renderSection(
  content: string,
  options: {
    id?: string;
    theme?: ThemeSpec;
    spacing?: "none" | "sm" | "md" | "lg" | "xl";
    tone?: "light" | "dark" | "brand" | "subtle";
    bgClass?: string;
    comment?: string;
    includeComments?: boolean;
  } = {}
): string {
  const spacingClasses = {
    none: "",
    sm: "py-8",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-24 md:py-32",
  };

  const spacing = spacingClasses[options.spacing || "md"];
  
  // Determine background based on tone using semantic class names
  let bgClass = "";
  if (options.tone === "dark") {
    bgClass = "bg-inverse text-inverse";
  } else if (options.tone === "brand") {
    bgClass = "bg-primary text-inverse";
  } else if (options.tone === "subtle") {
    bgClass = "bg-subtle";
  } else if (options.bgClass) {
    bgClass = options.bgClass;
  }

  const className = [spacing, bgClass].filter(Boolean).join(" ");

  const attrs: Record<string, string> = {};
  if (options.id) attrs.id = options.id;
  if (className) attrs.class = className;

  const section = h("section", Object.keys(attrs).length > 0 ? attrs : null, content);
  const html = renderHTML(section);

  if (options.includeComments !== false) {
    const label = options.id ? `${options.id}` : "section";
    return `<!-- section: ${label} -->\n${html}`;
  }

  return html;
}
