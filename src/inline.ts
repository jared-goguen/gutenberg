/**
 * Inline markup enrichment — lightweight markdown-subset rendering for
 * text fields that don't go through full renderMarkdown().
 *
 * Used by: card titles/subtitles, table headers, table cells, stat labels,
 * timeline labels, badge labels, headings, callout titles, info-box labels,
 * pullquote attributions, and more (~70 call sites).
 *
 * Pipeline position: called by block renderers in place of esc() for
 * fields where inline formatting is meaningful. Full-markdown fields
 * (prose.text, callout.body) already handle everything via renderMarkdown()
 * — this is the lightweight equivalent for non-prose fields.
 *
 * Handles:
 *   - Code spans: `code` → <code>code</code> (single + multi-backtick, CommonMark space trimming)
 *   - Bold: **text** → <strong>text</strong>
 *   - Italic: *text* → <em>text</em>
 *   - Links: [text](url) → <a href="url">text</a>
 *
 * Processing order: code spans extracted first (highest priority), then
 * bold, italic, and links applied to the remaining text segments.
 * Text outside markup is HTML-escaped.
 */

/** HTML-escape a string (mirrors esc() in blocks/types.ts). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Apply inline markup (bold, italic, links) to an already HTML-escaped string.
 *
 * Called on text segments that are NOT inside code spans. The input is
 * already escaped, so the regex patterns match on escaped text.
 *
 * Order: bold before italic (so ** is consumed before *), links last
 * (link text may contain bold/italic).
 */
function applyInlineMarkup(escaped: string): string {
  // Bold+italic: ***text*** — must come before bold/italic to consume triple-star first
  escaped = escaped.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");

  // Bold: **text** — non-greedy, content must not be empty
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text* — content must start and end with non-space, non-star
  // The negative lookahead/lookbehind prevents matching inside already-consumed **
  escaped = escaped.replace(/\*([^\s*](?:.*?[^\s*])?)\*/g, "<em>$1</em>");

  // Links: [text](url) — text already escaped, url gets escaped for href safety
  escaped = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label: string, url: string) => `<a href="${url}">${label}</a>`,
  );

  return escaped;
}

/**
 * Render a text field with inline code spans, bold, italic, and links.
 *
 * Code spans are extracted first (highest priority). Remaining text
 * segments are HTML-escaped, then processed for bold/italic/link markup.
 * Safe for direct insertion into HTML.
 */
export function renderInline(text: string): string {
  // Fast path: no special characters at all
  if (!text.includes("`") && !text.includes("*") && !text.includes("[")) {
    return escapeHtml(text);
  }

  // If no backticks, skip the code-span scanner entirely
  if (!text.includes("`")) {
    return applyInlineMarkup(escapeHtml(text));
  }

  const parts: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === "`") {
      // Count opening backticks
      let ticks = 0;
      let j = i;
      while (j < text.length && text[j] === "`") { ticks++; j++; }

      // Find matching closing backtick sequence
      const closer = "`".repeat(ticks);
      const closeIdx = text.indexOf(closer, j);

      if (closeIdx !== -1) {
        // Extract code content
        let code = text.slice(j, closeIdx);

        // CommonMark: strip one leading and one trailing space when both
        // are present and the content isn't all spaces
        if (
          code.length >= 2 &&
          code[0] === " " &&
          code[code.length - 1] === " " &&
          code.trim().length > 0
        ) {
          code = code.slice(1, -1);
        }

        parts.push(`<code>${escapeHtml(code)}</code>`);
        i = closeIdx + ticks;
        continue;
      }
      // No matching closer — emit opening backticks as literal text
      parts.push(applyInlineMarkup(escapeHtml(text.slice(i, j))));
      i = j;
      continue;
    }

    // Regular text — collect until next backtick or end
    let end = text.indexOf("`", i);
    if (end === -1) end = text.length;
    parts.push(applyInlineMarkup(escapeHtml(text.slice(i, end))));
    i = end;
  }

  return parts.join("");
}
