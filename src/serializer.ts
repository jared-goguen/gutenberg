/**
 * Serializer — converts AnnotatedNode tree to HTML string
 * 
 * Walks the tree and produces indented, self-contained HTML with
 * no external dependencies
 */

import type { AnnotatedNode } from "./scaffold/node.js";

interface SerializeOptions {
  minify?: boolean;
  indentSize?: number;
  includeComments?: boolean;
}

/**
 * Serialize an AnnotatedNode tree to HTML string
 */
export function serializeHTML(
  node: AnnotatedNode | string,
  options: SerializeOptions = {}
): string {
  return serializeNode(node, 0, options);
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build a class attribute from class array
 */
function buildClassAttr(classes: string[]): string {
  return classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
}

/**
 * Build attribute string from attrs Record
 */
function buildAttrs(attrs: Record<string, string>, classes: string[]): string {
  let attrString = "";
  
  // Add non-class attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key !== "class") {
      // Ensure value is a string
      const strValue = String(value ?? "");
      if (strValue === "true" || strValue === "") {
        attrString += ` ${key}`;
      } else {
        attrString += ` ${key}="${escapeHTML(strValue)}"`;
      }
    }
  }
  
  // Add class attribute
  attrString += buildClassAttr(classes);
  
  return attrString;
}

/**
 * Self-closing (void) elements
 */
const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * Serialize a single node
 */
function serializeNode(
  node: AnnotatedNode | string,
  depth: number,
  options: SerializeOptions
): string {
  // Text node
  if (typeof node === "string") {
    return escapeHTML(node);
  }
  
  // Validate node structure
  if (!node || typeof node !== "object") {
    throw new Error(
      `Invalid node: expected AnnotatedNode or string, got ${typeof node}`
    );
  }

  if (!("tag" in node) || typeof node.tag !== "string") {
    throw new Error(
      `Invalid AnnotatedNode: missing or invalid 'tag' property (got ${typeof (node as any).tag})`
    );
  }

  const indent = options.minify ? "" : " ".repeat((options.indentSize || 2) * depth);
  const newline = options.minify ? "" : "\n";
  
  let { tag, attrs = {}, classes = [], children = [], rawHtml } = node;
  
  // Special handling for table-container: convert data-grid-columns to inline style
  if (node.role === "table-container" && attrs["data-grid-columns"]) {
    const gridColumnsValue = attrs["data-grid-columns"];
    attrs = {
      ...attrs,
      style: `grid-template-columns: ${gridColumnsValue}`,
    };
  }

  // Validate property types
  if (attrs !== null && typeof attrs !== "object") {
    throw new Error(
      `Invalid node property 'attrs' on <${tag}>: expected object or null, got ${typeof attrs}`
    );
  }

  if (!Array.isArray(classes)) {
    throw new Error(
      `Invalid node property 'classes' on <${tag}>: expected array, got ${typeof classes}`
    );
  }

  if (!Array.isArray(children)) {
    throw new Error(
      `Invalid node property 'children' on <${tag}>: expected array, got ${typeof children}`
    );
  }

  // Void element
  if (voidElements.has(tag)) {
    return `<${tag}${buildAttrs(attrs || {}, classes)} />`;
  }
  
  // Raw HTML injection (bypass escaping)
  if (rawHtml !== undefined) {
    if (typeof rawHtml !== "string") {
      throw new Error(
        `Invalid node property 'rawHtml' on <${tag}>: expected string, got ${typeof rawHtml}`
      );
    }
    return `<${tag}${buildAttrs(attrs || {}, classes)}>${rawHtml}</${tag}>`;
  }
  
  // No children
  if (children.length === 0) {
    return `<${tag}${buildAttrs(attrs || {}, classes)}></${tag}>`;
  }
  
  // All children are strings (text content)
  const allStrings = children.every((child) => typeof child === "string");
  if (allStrings) {
    const content = children.map((child) => escapeHTML(child as string)).join("");
    return `<${tag}${buildAttrs(attrs || {}, classes)}>${content}</${tag}>`;
  }
  
  // Mixed or element children — multi-line
  const openTag = `<${tag}${buildAttrs(attrs || {}, classes)}>`;
  const closeTag = `</${tag}>`;
  
  const childIndent = options.minify ? "" : " ".repeat((options.indentSize || 2) * (depth + 1));
  const serializedChildren = children
    .map((child) => {
      const serialized = serializeNode(child, depth + 1, options);
      if (options.minify) {
        return serialized;
      }
      // Add indentation to element children, but not text-only children
      if (typeof child === "string") {
        return serialized;
      }
      return childIndent + serialized;
    })
    .join(options.minify ? "" : "\n");
  
  if (options.minify) {
    return `${openTag}${serializedChildren}${closeTag}`;
  }
  
  return `${indent}${openTag}${newline}${serializedChildren}${newline}${indent}${closeTag}`;
}

/**
 * Serialize multiple root nodes
 */
export function serializeHTMLNodes(
  nodes: (AnnotatedNode | string)[],
  options: SerializeOptions = {}
): string {
  return nodes
    .map((node) => serializeHTML(node, options))
    .join(options.minify ? "" : "\n");
}
