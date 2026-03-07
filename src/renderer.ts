import { HTMLNode, RenderOptions } from "./types.js";

/**
 * Render an HTML node tree to string
 */
export function renderHTML(node: HTMLNode | string, options: RenderOptions = {}): string {
  const indent = options.indentSize || 2;
  const includeComments = options.includeComments !== false;
  
  function render(node: HTMLNode | string, depth: number = 0): string {
    if (typeof node === "string") {
      return node;
    }

    const indentation = " ".repeat(depth * indent);
    const attrs = renderAttributes(node.attrs);
    const openTag = `${indentation}<${node.tag}${attrs}>`;

    if (node.selfClosing) {
      return openTag.replace(">", " />");
    }

    if (!node.children || node.children.length === 0) {
      return `${openTag}</${node.tag}>`;
    }

    // Check if all children are text (inline rendering)
    const allText = node.children.every(child => typeof child === "string");
    
    if (allText) {
      const content = node.children.join("");
      return `${openTag}${content}</${node.tag}>`;
    }

    // Multi-line rendering
    const childrenHTML = node.children
      .map(child => render(child, depth + 1))
      .join("\n");
    
    return `${openTag}\n${childrenHTML}\n${indentation}</${node.tag}>`;
  }

  let html = render(node);
  
  if (options.minify) {
    html = minifyHTML(html);
  }

  return html;
}

/**
 * Render HTML attributes
 */
function renderAttributes(attrs?: Record<string, string>): string {
  if (!attrs || Object.keys(attrs).length === 0) {
    return "";
  }

  return " " + Object.entries(attrs)
    .map(([key, value]) => {
      // Boolean attributes
      if (value === "true" || value === "") {
        return key;
      }
      // Escape quotes in attribute values
      const escaped = value.replace(/"/g, "&quot;");
      return `${key}="${escaped}"`;
    })
    .join(" ");
}

/**
 * Minify HTML by removing extra whitespace
 */
function minifyHTML(html: string): string {
  return html
    .replace(/\n\s+/g, "\n") // Remove leading spaces
    .replace(/\n{2,}/g, "\n") // Remove extra newlines
    .replace(/>\s+</g, "><") // Remove whitespace between tags
    .trim();
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Create a class string from array or object
 */
export function classNames(...classes: (string | Record<string, boolean> | undefined | false)[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === "string") {
      result.push(cls);
    } else if (typeof cls === "object") {
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }

  return result.join(" ");
}

/**
 * Helper to create HTML nodes
 */
export function h(
  tag: string,
  attrs?: Record<string, string> | null,
  ...children: (HTMLNode | string | (HTMLNode | string)[])[]
): HTMLNode {
  const flatChildren = children.flat().filter(Boolean) as (HTMLNode | string)[];
  
  return {
    tag,
    attrs: attrs || undefined,
    children: flatChildren.length > 0 ? flatChildren : undefined,
  };
}

/**
 * Create a self-closing HTML node
 */
export function selfClosing(tag: string, attrs?: Record<string, string>): HTMLNode {
  return {
    tag,
    attrs,
    selfClosing: true,
  };
}
