/**
 * Ink Theme — Dark mode design system
 *
 * Reference: Cloudflare/Stripe/Linear aesthetic
 * - Near-pure-black background
 * - System font stack (Helvetica/SF)
 * - Vivid crimson accent
 * - Docs: fixed sidebar + scrollable main
 */
export function generateInkCSS() {
    return `
:root {
  --font: 'Inter', sans-serif;

  --bg:           oklch(0.06 0.015 265);
  --surface:      oklch(0.11 0.015 265);
  --surface-alt:  oklch(0.14 0.015 265);
  --border:       oklch(0.20 0.015 265);
  --border-hi:    oklch(0.34 0.015 265);

  --text:         oklch(0.97 0.005 265);
  --text-body:    oklch(0.73 0.008 265);
  --text-muted:   oklch(0.44 0.008 265);

  /* Enhanced vibrant accents */
  --accent:       oklch(0.72 0.28 25);
  --accent-dim:   oklch(0.72 0.28 25 / 0.20);
  --accent-bg:    oklch(0.72 0.28 25 / 0.18);

  --accent-2:     oklch(0.75 0.25 290);
  --accent-2-dim: oklch(0.75 0.25 290 / 0.20);
  --accent-2-bg:  oklch(0.75 0.25 290 / 0.18);
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { line-height: 1.5; scroll-behavior: smooth; }
img  { display: block; max-width: 100%; height: auto; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1,h2,h3,h4,h5,h6 {
  font-family: var(--font);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text);
}

/* ══════════════════════════════════════
   DOCS SHELL — the whole page
   ══════════════════════════════════════ */

.docs-shell {
  display: grid;
  grid-template-columns: 200px 1fr 180px;
  min-height: 100vh;
  background: var(--bg);
}

/* ── Sidebar ── */
.docs-sidebar {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 2rem 0 2rem;
}

.docs-sidebar .nav-root {
  position: static;
  backdrop-filter: none;
  background: transparent;
  border-bottom: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.docs-sidebar .nav-logo {
  font-family: var(--font);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.01em;
  display: block;
  padding: 0 1.5rem 1.5rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.docs-sidebar .nav-link {
  display: block;
  font-family: var(--font);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  border-left: 2px solid transparent;
  transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
  line-height: 1.4;
}

.docs-sidebar .nav-link:hover {
  color: var(--text-body);
  background: oklch(0.14 0.012 265 / 0.6);
}

/* Treat the first nav link as "active" to mirror the reference */
.docs-sidebar .nav-link:first-of-type {
  color: var(--accent);
  border-left-color: var(--accent);
  background: var(--accent-bg);
}

/* Override the nav-scaffold's horizontal flex wrapper divs */
.docs-sidebar .nav-root > div {
  display: block;
  max-width: none;
  margin-inline: 0;
  padding-inline: 0;
}

/* The inner links container — stack vertically */
.docs-sidebar .nav-root > div > div {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0.5rem;
}

/* ── Right sidebar (on-page TOC) ── */
.docs-sidebar-right {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 2.5rem 1.25rem 2rem 1rem;
  border-left: 1px solid var(--border);
  background: var(--bg);
}

.toc-root {
  display: flex;
  flex-direction: column;
}

.toc-heading {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.875rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid var(--border);
}

.toc-link {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.3rem 0;
  line-height: 1.4;
  transition: color 120ms ease;
  border-left: 2px solid transparent;
  padding-left: 0.625rem;
}

.toc-link:hover {
  color: var(--text-body);
}

.toc-link:first-of-type {
  color: var(--accent-2);
  border-left-color: var(--accent-2);
}

/* ── Main content ── */
.docs-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Every section inside docs-main gets consistent left-aligned padding */
/* [class] bumps specificity to 0,2,1 — beats .docs-main .vibe-* at 0,2,0 */
.docs-main > section[class] {
  padding: 0.75rem 2rem;
  background: var(--bg);
}

.docs-main > footer[class] {
  padding: 0.5rem 2rem;
  background: var(--bg);
  border-top: 1px solid var(--border);
  margin-top: auto;
}

/* First section (hero): accent bottom rule, tighter top padding */
/* [class]:first-child = 0,2,2 — beats both vibe and the rule above */
.docs-main > section[class]:first-child {
  padding-top: 3.5rem;
  padding-bottom: 3.5rem;
  border-bottom: 1px solid var(--accent);
}

/* Override width constraints — let content flow naturally */
.docs-main .width-narrow,
.docs-main .width-standard,
.docs-main .width-wide {
  max-width: 740px;
  margin-inline: 0;
  padding-inline: 0;
}

/* Override centering — everything left-aligned in docs */
.docs-main .align-center {
  text-align: left;
}

/* Override vibe padding — sections control their own padding above */
.docs-main .vibe-serene,
.docs-main .vibe-gentle,
.docs-main .vibe-steady,
.docs-main .vibe-vibrant,
.docs-main .vibe-intense,
.docs-main .vibe-urgent {
  padding-block: 0;
}

/* No glow orb in docs hero */
.docs-main .vibe-vibrant::before {
  display: none;
}

/* ── Hero section — glow + gradient rule ── */
.docs-main > section[class]:first-child {
  position: relative;
  overflow: hidden;
}

.docs-main > section[class]:first-child::before {
  content: '';
  position: absolute;
  top: -80px; left: 0; right: 0;
  width: 100%; height: 600px;
  background:
    radial-gradient(ellipse 600px 400px at 25% 0%, oklch(0.68 0.22 25 / 0.18), transparent 70%),
    radial-gradient(ellipse 600px 400px at 75% 0%, oklch(0.70 0.22 290 / 0.14), transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.docs-main > section[class]:first-child > * {
  position: relative;
  z-index: 1;
}

.docs-main > section[class]:first-child {
  border-bottom: none;
}

.docs-main > section[class]:first-child::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--accent) 25%, var(--accent-2) 75%, transparent);
  z-index: 2;
}

/* ── Hero in docs context ── */
.docs-main .hero-heading {
  font-size: clamp(4rem, 7vw, 6.5rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  background: linear-gradient(135deg, var(--text) 30%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
}

.docs-main .hero-body {
  font-size: 1.25rem;
  line-height: 1.55;
  color: var(--text-body);
  max-width: 60ch;
  margin-bottom: 0;
}

/* ── Section overline in docs ── */
.docs-main .section-overline {
  display: inline-flex;
  background: linear-gradient(to right, var(--accent-bg), var(--accent-2-bg));
  border: 1px solid oklch(0.70 0.22 290 / 0.30);
  border-radius: 100px;
  padding: 0.25rem 0.875rem;
  font-size: 0.625rem;
  margin-bottom: 1.25rem;
}

/* ── Section heading — "KEY METRICS" label style ── */
.docs-main .section-heading {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-align: left;
  margin-bottom: 2.5rem;
}

/* ── Subheading under section heading ── */
.docs-main section > div > p:not([class]) {
  font-size: 1.25rem;
  line-height: 1.55;
  color: var(--text-body);
  max-width: 65ch;
  margin-bottom: 3rem;
}

/* ── Feature cards (accent-border) in docs ── */
.docs-main .layout-2col {
  gap: 3rem 4rem;
}

.docs-main .feature-card-accent {
  padding: 0 0 0 1.25rem;
  border-left-width: 2px;
}

/* Alternate card border colors: odd=crimson, even=violet */
.docs-main .layout-2col > .feature-card-accent:nth-child(odd) {
  border-left-color: var(--accent);
}

.docs-main .layout-2col > .feature-card-accent:nth-child(even) {
  border-left-color: var(--accent-2);
}

.docs-main .feature-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.docs-main .feature-body {
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--text-body);
  margin-bottom: 0;
}

/* ── Prose in docs ── */
.docs-main .content-prose {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--text-body);
  max-width: 640px;
}

.docs-main .content-prose h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  letter-spacing: -0.015em;
}

.docs-main .content-prose h2:first-child { margin-top: 0; }

.docs-main .content-prose ol,
.docs-main .content-prose ul {
  padding-left: 1.25em;
  margin: 1rem 0;
}

.docs-main .content-prose li {
  margin-bottom: 0.625rem;
  line-height: 1.65;
}

.docs-main .content-prose li::marker {
  color: var(--text-muted);
}

.docs-main .content-prose strong {
  color: var(--text);
  font-weight: 600;
}

.docs-main .content-prose code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125em;
  background: var(--accent-2-bg);
  color: var(--accent-2);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  border: 1px solid var(--accent-2-dim);
}

/* ── Large numbered pipeline steps ── */
.docs-main .content-prose ol {
  list-style: none;
  padding-left: 0;
  counter-reset: pipeline-counter;
}

.docs-main .content-prose ol li {
  counter-increment: pipeline-counter;
  position: relative;
  padding-left: 3.5rem;
  margin-bottom: 1.25rem;
}

.docs-main .content-prose ol li::before {
  content: counter(pipeline-counter);
  position: absolute;
  left: 0;
  top: -0.1em;
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--accent);
  opacity: 0.7;
}

/* ── Footer in docs ── */
.docs-main .footer-copy {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-align: left;
  padding-top: 0;
  margin-top: 0;
  border-top: none;
}

/* ══════════════════════════════════════
   STANDARD LAYOUT (non-docs)
   ══════════════════════════════════════ */

/* ── Navigation — Glass Morphism ── */
.nav-root {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px) saturate(180%);
  background: oklch(0.07 0.010 265 / 0.85);
  border-bottom: 1px solid var(--border);
  padding: 1.25rem 0;
}

.nav-logo {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: color 200ms ease;
}

.nav-logo:hover { color: var(--accent); }

.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 200ms ease;
}

.nav-link:hover { color: var(--text); }

/* ── Section overline ── */
.section-overline {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
  display: block;
}

/* ── Hero ── */
.hero-heading {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text);
  margin-bottom: 1rem;
}

.hero-body {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--text-body);
  max-width: 42rem;
  margin-bottom: 2rem;
}

.hero-body + .hero-body { margin-top: 1rem; }

/* ── Buttons ── */
.btn-primary, .btn-secondary, .btn-outline, .btn-ghost {
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
  padding: 0.875rem 1.75rem;
  display: inline-block;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 16px var(--accent-dim);
}

.btn-primary:hover {
  background: oklch(0.76 0.28 25);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--accent-bg);
}

.btn-secondary {
  background: var(--surface-alt);
  border: 1.5px solid var(--border-hi);
  color: var(--text-body);
}

.btn-secondary:hover {
  background: var(--surface);
  border-color: var(--accent);
  color: var(--text);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--accent);
  color: var(--accent);
}

.btn-outline:hover { 
  background: var(--accent-bg);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--accent-dim);
}

.btn-ghost {
  background: transparent;
  border: none;
  padding-left: 0;
  padding-right: 0;
  color: var(--accent);
  font-weight: 600;
}

.btn-ghost:hover { 
  opacity: 0.85;
  transform: translateX(2px);
}

/* ── Section heading (standard layout) ── */
.section-heading {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 3rem;
  text-align: center;
}

/* ── Feature card — material (standard) ── */
.feature-card {
  background: var(--surface-alt);
  border: 1.5px solid var(--border-hi);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  transition: border-color 280ms ease, box-shadow 280ms ease, transform 180ms ease, background 280ms ease;
}

.feature-card:hover {
  background: var(--surface);
  border-color: var(--accent);
  box-shadow: 0 12px 48px oklch(0.72 0.28 25 / 0.12);
  transform: translateY(-4px);
}

/* ── Feature card — accent-border ── */
.feature-card-accent {
  background: var(--accent-bg);
  border: 1.5px solid var(--accent);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  padding: 2rem;
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.feature-card-accent:hover {
  background: var(--accent-dim);
  border-color: var(--accent);
  transform: translateY(-3px);
  box-shadow: 0 10px 32px var(--accent-bg);
}

.feature-icon {
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: 1rem;
  display: block;
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.feature-body {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-body);
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.feature-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  transition: opacity 180ms ease;
}

.feature-link:hover { opacity: 0.75; }

/* ── Prose ── */
.content-prose {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-body);
}

.content-prose h2 {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-top: 0.5rem;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  display: none;
}

.content-prose h2:first-child { margin-top: 0; }

.content-prose h3 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.content-prose p { margin-bottom: 0.5rem; }

.content-prose ul,
.content-prose ol {
  margin: 0.3rem 0;
  padding-left: 1.5em;
}

.content-prose li { margin-bottom: 0.2rem; }
.content-prose li::marker { color: var(--accent); }

.content-prose blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 1.5rem;
  margin: 2rem 0;
  font-style: italic;
  color: var(--text-muted);
}

.content-prose code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.875em;
  background: var(--surface);
  color: var(--text);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.content-prose pre {
  background: var(--surface);
  padding: 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.content-prose pre code { background: none; padding: 0; border: none; }

.content-prose a {
  color: var(--accent);
  text-decoration: none;
  transition: opacity 180ms ease;
}

.content-prose a:hover { opacity: 0.75; }
.content-prose strong { font-weight: 700; color: var(--text); }
.content-prose em { font-style: italic; }

.content-prose hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 3rem 0;
}

/* Ultra-compact table styling for single-viewport fit */
.content-prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
  font-size: 0.8rem;
  background: transparent;
}

.content-prose th {
  font-weight: 800;
  color: var(--text-muted);
  text-align: center;
  padding: 0.3rem 0.4rem;
  background: transparent;
  border: none;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}

.content-prose td {
  padding: 0.3rem 0.4rem;
  color: var(--text);
  text-align: center;
  font-weight: 600;
  font-size: 0.8rem;
  border: none;
}

.content-prose tr:not(:last-child) td { border-bottom: 1px solid var(--border-hi); }

/* Remove alternating row backgrounds */
.content-prose tbody tr:nth-child(odd) td { background: transparent; }
.content-prose tbody tr:nth-child(even) td { background: transparent; }

/* Pastel traffic-light cell coloring */
/* Bold, vibrant traffic-light colors for maximum contrast */
.cell-high {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: oklch(0.68 0.28 15);
  color: white;
  font-weight: 800;
}

.cell-mid {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: oklch(0.75 0.25 80);
  color: #000;
  font-weight: 800;
}

.cell-low {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: oklch(0.60 0.22 140);
  color: #000;
  font-weight: 800;
}

.cell-yes {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: oklch(0.60 0.22 140);
  color: #000;
  font-weight: 800;
}

.cell-no {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: oklch(0.68 0.28 15);
  color: white;
  font-weight: 800;
}

/* ── TABLE COMPONENT ── */
.table-container {
  display: grid;
  gap: 0;
  margin: 1.5rem 0;
  padding: 2rem;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  max-width: 1000px;
  /* grid-template-columns is set dynamically via inline style from data-grid-columns attribute */
}

/* Left-align tables in docs context */
.docs-main .table-container {
  margin-left: 0;
  margin-right: 0;
}

/* Base styling for all table cells */
.table-cell {
  padding: 0.35rem 0.3rem;
  text-align: center;
  color: white;
}

/* Row label cell - first column, dark background, white text */
.cell-label {
  grid-column: 1;
  font-weight: 900;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  background: oklch(0.28 0.06 200);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

/* Column header cells - colored background with white text */
.cell-header {
  font-weight: 900;
  color: white;
  text-transform: uppercase;
  font-size: 0.65rem;
  padding: 0.5rem 0.3rem;
  letter-spacing: 0.05em;
  background: oklch(0.35 0.08 200);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Spacer cell (invisible, aligns value row with label column) */
.cell-spacer {
  grid-column: 1;
  border: none;
  padding: 0;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Data value cells */
.cell-value {
  font-weight: 700;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Heat-map gradient colors: cool (low values) → warm (high values) */
.cell-heat-very-low {
  background: oklch(0.88 0.08 200);
  color: oklch(0.28 0.06 200);
}

.cell-heat-low {
  background: oklch(0.82 0.12 190);
  color: oklch(0.28 0.06 200);
}

.cell-heat-mid {
  background: oklch(0.70 0.14 80);
  color: white;
}

.cell-heat-high {
  background: oklch(0.65 0.16 40);
  color: white;
}

.cell-heat-very-high {
  background: oklch(0.52 0.20 15);
  color: white;
}

/* Boolean value colors - muted palette */
.cell-bool-true {
  background: oklch(0.65 0.12 140);
  color: white;
}

.cell-bool-false {
  background: oklch(0.55 0.14 20);
  color: white;
}

/* Plain text cells */
.cell-text {
  background: transparent;
  color: oklch(0.75 0 0);
}

/* ── CTA ── */
.cta-section {
  border-radius: 8px;
  padding: 2rem;
  background: var(--surface-alt);
  border: 1px solid var(--border);
}

.cta-heading {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 1rem;
}

.cta-body {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-body);
  margin-bottom: 1.5rem;
}

/* ── Footer ── */
.footer-root {
  background: var(--bg);
  border-top: none;
  padding: 0.5rem 0;
  margin-top: 0;
}

.footer-logo {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

.footer-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 180ms ease;
}

.footer-link:hover { color: var(--text); }

.footer-copy {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: left;
  padding-top: 0.25rem;
  margin-top: 0.25rem;
  border-top: none;
}

/* ══════════════════════════════════════
   SEMANTIC AXES (standard layout)
   ══════════════════════════════════════ */

.vibe-serene  { padding-block: 1rem; background: var(--bg); }
.vibe-gentle  { padding-block: 1rem; background: var(--bg); }
.vibe-steady  { padding-block: 1rem; background: var(--bg); }
.vibe-urgent  { padding-block: 1rem; background: var(--bg); }
.vibe-vibrant { padding-block: 1rem; background: var(--bg); }
.vibe-intense { padding-block: 1rem; background: var(--bg); }

.intent-engage .btn-primary { box-shadow: 0 6px 24px var(--accent-dim); }
.intent-engage .btn-primary:hover { box-shadow: 0 12px 40px var(--accent-bg); }

.narrative-climax .hero-heading { font-weight: 800; letter-spacing: -0.04em; }
.narrative-climax .cta-heading  { font-weight: 800; }

/* ══════════════════════════════════════
   BASE LAYOUT UTILITIES
   (duplicated here so the stylesheet is self-contained)
   ══════════════════════════════════════ */

.flex             { display: flex; }
.flex-col         { flex-direction: column; }
.flex-wrap        { flex-wrap: wrap; }
.items-center     { align-items: center; }
.items-start      { align-items: flex-start; }
.justify-center   { justify-content: center; }
.justify-between  { justify-content: space-between; }
.gap-sm           { gap: 1rem; }
.gap-md           { gap: 1.5rem; }
.gap-lg           { gap: 2rem; }

.grid { display: grid; }

.layout-2col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
}

@media (min-width: 640px) {
  .layout-2col { grid-template-columns: repeat(2, 1fr); }
}

.layout-3col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .layout-3col { grid-template-columns: repeat(3, 1fr); gap: 2rem; }
}

.layout-4col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .layout-4col { grid-template-columns: repeat(4, 1fr); }
}

.width-full     { max-width: 100%; }
.width-narrow   { max-width: 42rem; margin-inline: 0; padding-inline: 1.5rem; }
.width-standard { max-width: 80rem; margin-inline: 0; padding-inline: 1.5rem; }
.width-wide     { max-width: 100rem; margin-inline: 0; padding-inline: 1.5rem; }

.align-left    { text-align: left; }
.align-center  { text-align: center; }
.align-split   { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }

@media (max-width: 1024px) {
  .docs-shell { grid-template-columns: 200px 1fr; }
  .docs-sidebar-right { display: none; }
}

@media (max-width: 768px) {
  .align-split { grid-template-columns: 1fr; gap: 2rem; }
  .docs-shell  { grid-template-columns: 1fr; }
  .docs-sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .docs-main > section,
  .docs-main > footer { padding: 2.5rem 1.5rem; }
}
`;
}
//# sourceMappingURL=ink.js.map