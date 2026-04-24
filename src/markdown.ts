import { marked } from "marked";

marked.setOptions({ breaks: false, gfm: true });

/**
 * Render markdown text to HTML.
 * Handles bold, links, inline code, paragraphs.
 * Also passes through raw HTML (common in our specs for <a> links).
 */
export function renderMarkdown(text: string): string {
  return (marked.parse(text, { async: false }) as string).trim();
}
