import { readFileSync } from "fs";
import { parseSchema, normalizeSection } from "./src/parser.js";
import { renderSections } from "./src/components/index.js";
import { applyLayout } from "./src/templates/layouts.js";
import { renderDocument } from "./src/templates/base.js";
import { resolveTheme } from "./src/theme.js";

const yaml = readFileSync("/tmp/test-page.yaml", "utf8");
const page = parseSchema(yaml);
const theme = resolveTheme(page.page.layout?.theme);

const options = {
  minify: false,
  includeComments: false,
  indentSize: 2,
  theme,
};

const normalized = page.page.sections.map(normalizeSection);
const html = renderSections(normalized, options);
const body = applyLayout(html, page.page.layout, theme);
const output = renderDocument(page.page.meta, body, options);

// Check for Tailwind CDN
if (output.includes("cdn.tailwindcss.com")) {
  console.error("❌ ERROR: Tailwind CDN script still present!");
  process.exit(1);
}

// Check for inline CSS utilities
if (output.includes(".flex") && output.includes(".py-12")) {
  console.log("✅ SUCCESS: Inline CSS utilities found!");
} else {
  console.error("❌ ERROR: Inline CSS utilities not found!");
  process.exit(1);
}

// Show a snippet
const styleStart = output.indexOf("<style");
const styleEnd = output.indexOf("</style>") + 8;
const styleSnippet = output.substring(styleStart, Math.min(styleEnd, styleStart + 500));
console.log("\n📋 Style tag preview:");
console.log(styleSnippet);

console.log("\n✨ CSS generation working correctly!");
