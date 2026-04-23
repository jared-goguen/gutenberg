/**
 * MONO_THEME — Visual CSS for the Mono dark theme.
 *
 * Disciplined brutalism on strict 8px grid. Near-black surfaces,
 * red/vermillion accent (Swiss poster reference). Helvetica Neue at
 * normal weights 400–700. Zero radius, zero shadows. One vertical
 * line — consistent horizontal containment throughout.
 *
 * Key differences from ink:
 *   - Accent: vermillion/red instead of gold
 *   - Weights: 400–700 (not ink's fragile 200–400)
 *   - Spacing: strict 8px grid (8/16/24/32/48/64/96px)
 *   - Containment: ALL blocks use same 24px left-edge padding
 *   - Block gap: 32px, card gap: 16px, table cells: 8×16px
 *   - No negative margins, no 6-different-left-edge chaos
 *
 * Standalone theme — loaded after BASE_STYLES. No !important anywhere.
 */
export const MONO_THEME = `/* ============================================================
   MONO THEME
   Disciplined brutalism on strict 8px grid.
   Red/vermillion accent on near-black. Helvetica Neue.
   ============================================================ */

/* ── Token Overrides ─────────────────────────────────────────── */

:root {
  /* Surfaces — near-black, neutral */
  --gb-surface-page: rgb(14, 14, 16);
  --gb-surface-base: rgb(14, 14, 16);
  --gb-surface-deep: rgb(9, 9, 11);
  --gb-surface-mid: rgb(22, 22, 26);
  --gb-surface-raised: rgb(28, 28, 32);

  /* Text — clean white, not warm cream */
  --gb-text-primary: rgb(240, 240, 242);
  --gb-text-body: rgb(196, 196, 200);
  --gb-text-muted: rgb(120, 120, 126);
  --gb-text-caption: rgb(88, 88, 94);
  --gb-text-label: rgb(152, 152, 158);
  --gb-text-link: var(--gb-accent);

  /* Chrome — cool gray, precise */
  --gb-chrome-border: rgb(44, 44, 50);
  --gb-chrome-divider: rgb(32, 32, 38);
  --gb-chrome-stripe: rgba(240, 240, 242, 0.02);
  --gb-chrome-gap: rgb(14, 14, 16);
  --gb-chrome-label-bg: rgb(22, 22, 26);

  /* Accent — vermillion red (Swiss poster) */
  --gb-accent: rgb(210, 48, 32);

  /* Typography — Helvetica Neue for everything */
  --gb-font-heading: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  --gb-font-body: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;

  /* Shape — zero radius, brutalist */
  --gb-radius-sm: 0px;
  --gb-radius-md: 0px;
  --gb-radius-lg: 0px;

  /* 8px grid spacing */
  --gb-space-1: 0.5rem;   /* 8px */
  --gb-space-2: 1rem;     /* 16px */
  --gb-space-3: 1.5rem;   /* 24px */
  --gb-space-4: 2rem;     /* 32px */
  --gb-space-5: 2.5rem;   /* 40px */
  --gb-space-6: 3rem;     /* 48px */
  --gb-space-8: 4rem;     /* 64px */
  --gb-space-12: 6rem;    /* 96px */

  /* Type Scale — clean, functional */
  --gb-text-2xs: 0.65rem;
  --gb-text-xs: 0.75rem;
  --gb-text-sm: 0.875rem;
  --gb-text-base: 1rem;
  --gb-text-md: 1.125rem;
  --gb-text-lg: 1.25rem;
  --gb-text-xl: 1.5rem;

  /* Animations — crisp, fast */
  --gb-duration-normal: 0.2s;
  --gb-duration-slow: 0.35s;
  --gb-duration-slower: 0.5s;

  /* Opacity */
  --gb-opacity-ghost: 0.06;
  --gb-opacity-subtle: 0.2;
}

/* === Base === */
body {
  font-family: var(--gb-font-body);
  background: var(--gb-surface-page);
  color: var(--gb-text-body);
  line-height: 1.7;
  padding: 3rem 1.5rem;
  max-width: 880px;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--gb-text-link); text-decoration: none; }
a:hover { text-decoration: underline; }
code {
  font-family: var(--gb-font-mono);
  font-size: 0.88em;
  background: var(--gb-surface-mid);
  padding: 0.1em 0.35em;
  border-radius: 0px;
  border: 1px solid var(--gb-chrome-divider);
  color: var(--gb-text-primary);
}

/* === Headings === */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--gb-font-heading);
  font-weight: 700;
  color: var(--gb-text-primary);
  letter-spacing: -0.02em;
}
h1 { font-size: 2.5rem; line-height: 1.1; font-weight: 700; }
h2 { font-size: 1.5rem; line-height: 1.25; }
h3 { font-size: 1.125rem; line-height: 1.4; }

/* === Hero — no container, text IS the hero === */
.gb-hero {
  background: transparent;
  padding: 2rem 0 2rem;
  border-radius: 0px;
}
.gb-hero::before {
  background: none;
}
.gb-hero-eyebrow {
  font-family: var(--gb-font-heading);
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--gb-text-label);
  margin-bottom: 1rem;
}
.gb-eyebrow-tag { color: var(--gb-accent); }
.gb-eyebrow-sep { color: var(--gb-text-primary); opacity: var(--gb-opacity-soft); font-size: 0.6em; vertical-align: 0.1em; }
.gb-hero-title {
  font-family: var(--gb-font-heading);
  font-size: 3rem;
  font-weight: 700;
  color: var(--gb-text-primary);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
  /* No gradient fill — plain text */
  background: none;
  -webkit-background-clip: unset;
  background-clip: unset;
  -webkit-text-fill-color: unset;
}
.gb-hero-subtitle {
  font-family: var(--gb-font-heading);
  font-size: clamp(1.125rem, 2.5vw, 1.375rem);
  font-weight: 400;
  font-style: normal;
  color: var(--gb-text-muted);
  margin-top: 1rem;
  max-width: 38rem;
}
.gb-hero-body {
  font-size: var(--gb-text-lg);
  color: var(--gb-text-muted);
  line-height: 1.65;
  max-width: 48rem;
}
.gb-hero-body p { margin-bottom: 1rem; }
.gb-hero-body p:last-child { margin-bottom: 0; }
.gb-hero-accent {
  height: 2px;
  margin-top: 2rem;
  border-radius: 0px;
  background: var(--gb-accent);
  opacity: 1;
}

/* === Section Label === */
.gb-section-label {
  background: transparent;
  padding: 2rem 0 0.5rem;
  font-family: var(--gb-font-heading);
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--gb-text-primary);
  border-radius: 0;
  text-align: center;
}

/* Section rhythm — hairline rules */
.gb-heading {
  font-family: var(--gb-font-heading);
  color: var(--gb-text-primary);
  font-weight: 700;
  letter-spacing: -0.02em;
  border-top: 1px solid var(--gb-chrome-divider);
  padding-top: 2rem;
  margin-top: 2rem;
}
h2.gb-heading { font-size: 1.5rem; }
h3.gb-heading { font-size: var(--gb-text-lg); }

/* === Cards — red left hairline, no background === */
.gb-cards {
  gap: 1rem;
  overflow: visible;
}
.gb-card {
  background: transparent;
  border: none;
  border-left: 3px solid var(--gb-card-border, var(--gb-accent));
  border-radius: 0;
  padding: 1rem 1.5rem;
  box-shadow: none;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.15s ease;
  will-change: transform;
}
.gb-card:hover {
  transform: translateY(-2px);
  box-shadow: none;
}
.gb-card:focus-within {
  box-shadow: 0 0 0 2px var(--gb-text-link);
}
.gb-card-title {
  font-family: var(--gb-font-heading);
  font-size: 1rem;
  font-weight: 700;
  color: var(--gb-text-primary);
  letter-spacing: -0.01em;
  margin-bottom: 0.5rem;
}
.gb-card-title a { color: inherit; }
.gb-card-linked .gb-card-title { color: var(--gb-card-accent-color, var(--gb-text-primary)); }
.gb-card-subtitle {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-muted);
  margin-bottom: 0.5rem;
}
.gb-card-body {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-body);
  line-height: 1.65;
}
.gb-card-body p { margin-bottom: 0.5rem; }
.gb-card-body p:last-child { margin-bottom: 0; }
.gb-card-footer {
  font-size: var(--gb-text-xs);
  color: var(--gb-text-caption);
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--gb-chrome-divider);
}

/* Title highlight on hover */
.gb-card-linked:hover .gb-card-title a {
  color: var(--gb-text-link);
  transition: color 0.15s ease;
}
/* External link indicator */
.gb-card-linked .gb-card-title::after {
  font-size: var(--gb-text-base);
  line-height: 1;
  color: var(--gb-text-muted);
  opacity: 0;
  transition: opacity var(--gb-duration-fast) ease;
}
.gb-card-linked:hover .gb-card-title::after {
  opacity: var(--gb-opacity-subtle);
}

/* Card badges — ghost outline */
.gb-card-badges {
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.gb-card-badge {
  font-size: var(--gb-text-2xs);
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 0px;
  border: 1px solid var(--gb-card-badge-border, var(--gb-chrome-border));
  color: var(--gb-text-label);
  background: transparent;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.08em;
}

/* Wide/Large cards — same transparent treatment */
.gb-card[data-size="wide"],
.gb-card[data-size="large"] {
  background: transparent;
  border-width: 0 0 0 3px;
  box-shadow: none;
}
.gb-card[data-size="wide"] .gb-card-title,
.gb-card[data-size="large"] .gb-card-title {
  font-size: var(--gb-text-lg);
}
.gb-card[data-size="wide"] .gb-card-body,
.gb-card[data-size="large"] .gb-card-body {
  font-size: var(--gb-text-base);
  line-height: 1.6;
}

/* === Prose === */
.gb-prose {
  color: var(--gb-text-body);
  line-height: 1.7;
}
.gb-prose p { margin-bottom: 1rem; max-width: 62ch; }
.gb-prose p:last-child { margin-bottom: 0; }
.gb-prose strong { font-weight: 700; color: var(--gb-text-primary); }
.gb-prose em { font-style: italic; }
.gb-prose-intro { font-size: var(--gb-text-lg); color: var(--gb-text-primary); }
.gb-prose-body { font-size: var(--gb-text-base); }
.gb-prose-caption { font-size: var(--gb-text-sm); color: var(--gb-text-caption); }
.gb-prose-thesis {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gb-text-primary);
  letter-spacing: -0.02em;
}
.gb-prose-highlighted {
  background: var(--gb-surface-mid);
  padding: 1rem 1.5rem;
  border-radius: 0px;
}
.gb-prose code {
  font-size: 0.88em;
  background: var(--gb-surface-mid);
  border: 1px solid var(--gb-chrome-divider);
  padding: 0.1em 0.35em;
  color: var(--gb-text-primary);
}

/* === Flow Chain — transparent container, ghost pills === */
.gb-flow-chain {
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: 0px;
  background: transparent;
}
.gb-pill {
  display: inline-flex;
  align-items: center;
  font-size: var(--gb-text-sm);
  font-weight: 700;
  padding: 0.375em 1em;
  border-radius: 0px;
  white-space: nowrap;
  letter-spacing: 0.02em;
  background: transparent;
  border: 1px solid var(--gb-flow-pill-bg, var(--gb-accent));
  color: var(--gb-flow-pill-text, var(--gb-text-primary));
  transition: transform var(--gb-duration-fast) var(--gb-ease-out), box-shadow var(--gb-duration-fast) ease;
}
.gb-flow-chain .gb-pill {
  background: transparent;
  border: 1px solid var(--gb-flow-pill-bg);
  color: var(--gb-flow-pill-text);
}
.gb-flow-chain .gb-arrow { color: var(--gb-flow-arrow-color); opacity: 0.4; }
/* Linked pills */
a.gb-pill-linked {
  text-decoration: none;
  outline: 1.5px solid color-mix(in srgb, var(--gb-text-link) 50%, transparent);
  outline-offset: -3px;
}
a.gb-pill-linked:hover {
  text-decoration: none;
  outline-color: var(--gb-text-link);
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  transform: scale(1.06) translateY(-2px);
}
.gb-arrow svg {
  width: 16px;
  height: 16px;
  opacity: var(--gb-opacity-subtle);
  transition: opacity var(--gb-duration-fast) ease;
}
.gb-flow-chain:hover .gb-arrow svg { opacity: var(--gb-opacity-soft); }
.gb-pill:hover {
  transform: scale(1.03) translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}

/* Join operators */
.gb-join {
  font-size: 1rem;
  font-weight: 400;
  opacity: var(--gb-opacity-subtle);
  transition: opacity var(--gb-duration-fast) ease;
}
.gb-join-plus { font-size: var(--gb-text-base); }
.gb-join-equals {
  font-size: var(--gb-text-lg);
  font-weight: 700;
  opacity: var(--gb-opacity-muted);
}
.gb-flow-chain:hover .gb-join { opacity: var(--gb-opacity-soft); }
.gb-flow-chain:hover .gb-join-equals { opacity: var(--gb-opacity-visible); }

/* === Transform — transparent container, ghost pills, red operators === */
.gb-transform {
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0px;
  background: transparent;
}
.gb-transform-row {
  gap: 0 0.5rem;
}
.gb-transform .gb-pill,
.gb-transform .gb-pill-thread {
  background: transparent;
  border: 1px solid var(--gb-pill-bg);
  color: var(--gb-pill-text);
}
.gb-transform-op {
  font-size: var(--gb-text-lg);
  font-weight: 400;
  color: var(--gb-accent);
  opacity: var(--gb-opacity-subtle);
  transition: opacity var(--gb-duration-fast) ease;
}
.gb-transform:hover .gb-transform-op { opacity: var(--gb-opacity-soft); }
/* Threaded input pills */
.gb-pill-thread {
  opacity: var(--gb-opacity-soft);
  transition: opacity var(--gb-duration-fast) ease;
}
.gb-transform:hover .gb-pill-thread { opacity: var(--gb-opacity-visible); }

/* === Timeline — 1px axis line === */
.gb-timeline {
  margin: 2rem 0;
}

/* Axis line — 1px */
.gb-timeline-row::before {
  background: linear-gradient(to right,
    color-mix(in srgb, var(--gb-accent) 50%, transparent) 0%,
    var(--gb-accent) 50%,
    color-mix(in srgb, var(--gb-text-muted) 25%, transparent) 85%,
    transparent 100%
  );
}
/* Traveling glow pulse — subtle */
.gb-timeline-row::after {
  background: linear-gradient(90deg,
    transparent 0%,
    color-mix(in srgb, var(--gb-accent) 40%, transparent) 10%,
    var(--gb-accent) 20%,
    color-mix(in srgb, var(--gb-accent) 40%, transparent) 30%,
    transparent 40%
  );
  border-radius: 0px;
  filter: blur(1px);
}

.gb-timeline-row {
  gap: 0;
}

.gb-timeline-date {
  font-size: var(--gb-text-2xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--tl-accent, var(--gb-text-muted));
  margin-bottom: 0.5rem;
  line-height: 1;
}
.gb-timeline-dot {
  border-radius: 50%;
  background: var(--tl-accent, var(--gb-text-muted));
  margin-bottom: 0.5rem;
  border: 2px solid var(--gb-surface-page);
}
.gb-timeline-label {
  font-size: var(--gb-text-sm);
  font-weight: 500;
  color: var(--gb-text-body);
  line-height: 1.3;
  padding: 0 0.5rem;
}

/* Status treatments */
.gb-timeline-item[data-status="shipped"] .gb-timeline-dot { opacity: var(--gb-opacity-muted); }
.gb-timeline-item[data-status="shipped"] .gb-timeline-label { opacity: var(--gb-opacity-muted); }
.gb-timeline-item[data-status="shipped"] .gb-timeline-date { opacity: var(--gb-opacity-muted); }
.gb-timeline-item[data-status="active"] .gb-timeline-dot {
  box-shadow: 0 0 8px color-mix(in srgb, var(--tl-accent) 40%, transparent);
  border-color: var(--tl-accent);
  margin-bottom: calc(0.5rem - 1px);
}
.gb-timeline-item[data-status="active"] .gb-timeline-label {
  color: var(--tl-accent);
}
.gb-timeline-item[data-status="planned"] .gb-timeline-dot {
  background: transparent;
  border: 2px dashed var(--tl-accent, var(--gb-text-muted));
}
.gb-timeline-item[data-status="planned"] .gb-timeline-label { opacity: var(--gb-opacity-muted); }
.gb-timeline-item[data-status="planned"] .gb-timeline-date { opacity: var(--gb-opacity-muted); }

/* Directional markers */
.gb-timeline-arrow::after {
  font-size: var(--gb-text-lg);
  font-weight: 700;
  letter-spacing: -3px;
  color: var(--gb-accent);
  opacity: var(--gb-opacity-muted);
  line-height: 1;
}

/* Terminus */
.gb-timeline-terminus .gb-timeline-dot {
  background: transparent;
  border: 2px dashed var(--gb-text-muted);
}
.gb-timeline-terminus .gb-timeline-label {
  color: var(--gb-text-muted);
  font-style: italic;
  font-weight: 400;
}

/* Linked items */
a.gb-timeline-item {
  text-decoration: none;
  transition: transform 0.15s ease;
}
a.gb-timeline-item:hover .gb-timeline-dot {
  box-shadow: 0 0 10px color-mix(in srgb, var(--tl-accent) 50%, transparent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
a.gb-timeline-item:hover .gb-timeline-label {
  color: var(--tl-accent);
  transition: color 0.15s ease;
}

/* Multi-track */
.gb-timeline[data-mode="multi"] .gb-timeline-header,
.gb-timeline[data-mode="multi"] .gb-timeline-track {
  gap: 4px;
}
.gb-timeline[data-mode="multi"] .gb-timeline-header {
  margin-bottom: 2px;
}
.gb-timeline-phase {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-text-muted);
  text-align: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gb-chrome-divider);
}
.gb-timeline-track {
  margin-bottom: 2px;
}
.gb-timeline-track::before {
  background: color-mix(in srgb, var(--tl-track-accent) 25%, transparent);
}
.gb-timeline-track-label {
  padding: 0.5rem 0.5rem;
  border-right: 1px solid var(--tl-track-accent);
}
.gb-timeline-track-name {
  font-size: var(--gb-text-sm);
  font-weight: 700;
  color: var(--gb-text-body);
}
.gb-timeline-track-sublabel {
  font-size: var(--gb-text-2xs);
  color: var(--gb-text-muted);
  margin-top: 0.125rem;
}

/* Track cells */
.gb-timeline-cell {
  padding: 0.25rem 0.25rem;
}
.gb-timeline-cell .gb-timeline-dot {
  border-radius: 50%;
  background: var(--tl-track-accent);
  border: 2px solid var(--gb-surface-page);
  margin-bottom: 0.25rem;
}
.gb-timeline-cell .gb-timeline-label {
  font-size: var(--gb-text-xs);
  font-weight: 500;
  color: var(--gb-text-body);
  line-height: 1.2;
  padding: 0 0.125rem;
}
.gb-timeline-cell[data-status="shipped"] .gb-timeline-dot { opacity: var(--gb-opacity-muted); }
.gb-timeline-cell[data-status="shipped"] .gb-timeline-label { opacity: var(--gb-opacity-muted); }
.gb-timeline-cell[data-status="active"] .gb-timeline-dot {
  box-shadow: 0 0 6px color-mix(in srgb, var(--tl-track-accent) 40%, transparent);
  border-color: var(--tl-track-accent);
}
.gb-timeline-cell[data-status="active"] .gb-timeline-label {
  color: var(--tl-track-accent);
}
.gb-timeline-cell[data-status="planned"] .gb-timeline-dot {
  background: transparent;
  border: 2px dashed var(--tl-track-accent);
}
.gb-timeline-cell[data-status="planned"] .gb-timeline-label { opacity: var(--gb-opacity-muted); }

/* Linked cells */
a.gb-timeline-cell {
  text-decoration: none;
  transition: transform 0.15s ease;
}
a.gb-timeline-cell:hover .gb-timeline-dot {
  box-shadow: 0 0 8px color-mix(in srgb, var(--tl-track-accent) 50%, transparent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
a.gb-timeline-cell:hover .gb-timeline-label {
  color: var(--tl-track-accent);
  transition: color 0.15s ease;
}

/* Hover: highlight track row */
.gb-timeline[data-mode="multi"]:hover .gb-timeline-track {
  opacity: var(--gb-opacity-muted);
  transition: opacity var(--gb-duration-fast) ease;
}
.gb-timeline[data-mode="multi"]:hover .gb-timeline-track:hover {
  opacity: 1;
}

/* Caption */
.gb-timeline-caption {
  margin-top: 1rem;
  font-size: var(--gb-text-xs);
  color: var(--gb-text-muted);
  line-height: 1.5;
  text-align: center;
}
.gb-timeline-caption p { margin: 0; }

/* === Recent === */
.gb-recent {
  gap: 0;
}
.gb-recent-item {
  gap: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gb-chrome-divider);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s;
}
.gb-recent-item:first-child {
  border-top: 1px solid var(--gb-chrome-divider);
}
.gb-recent-item:hover {
  background-color: rgba(240, 240, 242, 0.02);
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  border-radius: 0px;
}
.gb-recent-title {
  font-weight: 700;
  color: var(--gb-text-primary);
}
.gb-recent-item:hover .gb-recent-title {
  color: var(--gb-accent);
}
.gb-recent-meta {
  gap: var(--gb-gap-normal);
  font-size: var(--gb-text-sm);
  opacity: var(--gb-opacity-muted);
}
.gb-recent-section {
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  font-size: var(--gb-text-xs);
}

/* === Badges — ghost outline === */
.gb-badges {
  gap: 0.5rem;
}
.gb-badges-md .gb-badge-pill { font-size: var(--gb-text-sm); padding: 0.25rem 0.5rem; }
.gb-badge-pill {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  padding: 0.25em 0.625em;
  border-radius: 0px;
  background: transparent;
  border: 1px solid var(--gb-badge-bg, var(--gb-accent));
  color: var(--gb-badge-text, var(--gb-text-primary));
  letter-spacing: 0.04em;
}
.gb-badges .gb-badge-pill {
  background: transparent;
  border: 1px solid var(--gb-badge-bg);
  color: var(--gb-badge-text);
}

/* === Table — horizontal rules only, no striping, no outer border === */
.gb-table {
  font-size: var(--gb-text-sm);
  border: none;
  border-radius: 0px;
  border-collapse: collapse;
}
.gb-table th {
  padding: 0.5rem 1rem;
  font-weight: 700;
  font-size: var(--gb-text-xs);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-text-label);
  border-bottom: 2px solid var(--gb-chrome-border);
}
.gb-table td {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--gb-chrome-divider);
  color: var(--gb-text-body);
}
.gb-table[data-striped] tbody tr:nth-child(even) { background: transparent; }
.gb-table[data-compact] th,
.gb-table[data-compact] td { padding: 0.25rem 0.5rem; }
.gb-table thead { background: transparent; color: var(--gb-text-label); }
.gb-table-caption {
  caption-side: top;
  text-align: left;
  font-size: var(--gb-text-sm);
  font-weight: 700;
  color: var(--gb-text-primary);
  padding: 0.5rem 0;
}

/* === Matrix === */
.gb-matrix {
  font-size: var(--gb-text-sm);
  border: none;
  border-radius: 0px;
}
.gb-matrix thead {
  background: transparent;
}
.gb-matrix-col-header {
  padding: 0.5rem 0.5rem;
  font-weight: 700;
  font-size: var(--gb-text-xs);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-text-muted);
  border-bottom: 1px solid var(--gb-chrome-border);
}
.gb-matrix-label-col {
  border-bottom: 1px solid var(--gb-chrome-border);
}
.gb-matrix-group-header {
  padding: 0.5rem 1rem;
  font-weight: 700;
  font-size: var(--gb-text-xs);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-matrix-group-text, var(--gb-text-primary));
  background: color-mix(in srgb, var(--gb-matrix-group-color) 10%, transparent);
  border-top: 1px solid var(--gb-chrome-divider);
}
.gb-matrix-group-row:first-child .gb-matrix-group-header { border-top: none; }
.gb-matrix-data-row {
  border-bottom: 1px solid var(--gb-chrome-divider);
}
.gb-matrix-row-label {
  padding: 0.5rem 0.5rem 0.5rem 1.5rem;
  font-size: var(--gb-text-sm);
  color: var(--gb-text-body);
  border-bottom: 1px solid var(--gb-chrome-divider);
  white-space: nowrap;
}
.gb-matrix-cell {
  padding: 0.5rem 0.5rem;
  border-bottom: 1px solid var(--gb-chrome-divider);
}
.gb-matrix-cell-filled .gb-matrix-cell-label {
  padding: 0.25rem 0.5rem;
  border-radius: 0px;
  background: color-mix(in srgb, var(--gb-matrix-cell-bg) 40%, transparent);
  color: var(--gb-matrix-cell-text, var(--gb-text-primary));
  font-size: var(--gb-text-xs);
  font-weight: 700;
}
.gb-matrix-cell-plain .gb-matrix-cell-label {
  font-size: var(--gb-text-xs);
  color: var(--gb-text-muted);
  font-style: italic;
}
.gb-matrix-caption {
  caption-side: top;
  text-align: left;
  font-size: var(--gb-text-sm);
  font-weight: 700;
  color: var(--gb-text-primary);
  padding: 0.5rem 0;
}

/* === TOC === */
.gb-toc {
  background: transparent;
  border: none;
  border-left: 1px solid var(--gb-chrome-divider);
  border-radius: 0px;
  padding: 1rem 1.5rem;
}
.gb-toc-title {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--gb-text-label);
  margin-bottom: 1rem;
}
.gb-toc-entry {
  display: block;
  font-size: var(--gb-text-sm);
  color: var(--gb-text-link);
  text-decoration: none;
  padding: 0.25rem 0;
}
.gb-toc-entry:hover { text-decoration: underline; }

/* TOC right rail */
.gb-toc a {
  color: var(--gb-text-muted);
  font-size: var(--gb-text-xs);
  letter-spacing: 0.02em;
}
.gb-toc a.active {
  color: var(--gb-accent);
}

/* === Info Box — transparent bg, 2px left border === */
.gb-info-box {
  border-radius: 0px;
  padding: 1rem 1.5rem;
  font-size: var(--gb-text-base);
  line-height: 1.6;
  border-left: 2px solid;
  background: transparent;
}
.gb-info-box p { margin-bottom: 0.5rem; }
.gb-info-box p:last-child { margin-bottom: 0; }
.gb-info-box[data-box-type="note"],
.gb-info-box[data-box-type="info"] {
  border-left-color: var(--gb-accent);
  background: transparent;
}
.gb-info-box[data-box-type="warning"] {
  border-left-color: var(--gb-warning, rgb(245,158,11));
  background: transparent;
}
.gb-info-box[data-box-type="tip"] {
  border-left-color: var(--gb-success, rgb(16,185,129));
  background: transparent;
}
.gb-info-box-label {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
}

/* === Todo === */
.gb-todo {
  border-radius: 0px;
  padding: 1rem 1.5rem;
  font-size: var(--gb-text-base);
  line-height: 1.6;
  border-left: 2px dashed var(--gb-warning, rgb(245,158,11));
  background: transparent;
}
.gb-todo p { margin-bottom: 0.5rem; }
.gb-todo p:last-child { margin-bottom: 0; }
.gb-todo-label {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
  color: var(--gb-warning, rgb(245,158,11));
}
.gb-todo-blocked {
  font-size: var(--gb-text-sm);
  margin-top: var(--gb-space-1);
  opacity: var(--gb-opacity-soft);
  font-style: italic;
}

/* === Pullquote === */
.gb-pullquote {
  border-left: 2px solid color-mix(in srgb, var(--gb-pullquote-color, var(--gb-accent)) 60%, transparent);
  padding: 1rem 0 1rem 1.5rem;
  margin: 0.5rem 0;
}
.gb-pullquote-text {
  font-size: var(--gb-text-lg);
  line-height: 1.5;
  color: var(--gb-text-primary);
  letter-spacing: -0.02em;
  font-weight: 400;
}
.gb-pullquote-text p { margin-bottom: 0.5rem; }
.gb-pullquote-text p:last-child { margin-bottom: 0; }
.gb-pullquote-attribution {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-muted);
  margin-top: 0.5rem;
}

/* === Callout — transparent bg, 2px left border === */
.gb-callout {
  background: transparent;
  border-radius: 0px;
  padding: 1rem 1.5rem;
  color: var(--gb-text-body);
  border: none;
  border-left: 2px solid var(--gb-callout-border, var(--gb-callout-bg, var(--gb-accent)));
}
.gb-callout--compact {
  display: inline-block;
  padding: 1rem 1.5rem;
}
.gb-callout-title {
  font-family: var(--gb-font-heading);
  font-size: var(--gb-text-md);
  font-weight: 700;
  color: var(--gb-text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}
.gb-callout--compact .gb-callout-title {
  margin-bottom: 0;
}
.gb-callout-title a {
  color: var(--gb-callout-text, var(--gb-text-primary));
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: color-mix(in srgb, var(--gb-callout-text, var(--gb-text-primary)) 35%, transparent);
}
.gb-callout-title a:hover {
  text-decoration-color: var(--gb-callout-text, var(--gb-text-primary));
}
.gb-callout-body {
  font-size: var(--gb-text-base);
  line-height: 1.55;
  color: var(--gb-text-body);
}
.gb-callout-body p { margin-bottom: 0.5rem; }
.gb-callout-body p:last-child { margin-bottom: 0; }
.gb-callout-cta {
  margin-top: 1rem;
}
.gb-callout-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--gb-callout-text, var(--gb-accent));
  font-size: var(--gb-text-sm);
  font-weight: 700;
  border-radius: 0px;
  text-decoration: none;
  border: 1px solid var(--gb-callout-text, var(--gb-accent));
  transition: background 0.15s, border-color 0.15s;
}
.gb-callout-btn:hover {
  background: color-mix(in srgb, var(--gb-callout-text, var(--gb-accent)) 10%, transparent);
}

/* === Install === */
.gb-install {
  background: color-mix(in srgb, var(--gb-install-bg, rgb(210,48,32)) 15%, var(--gb-surface-base));
  border-radius: 0px;
  padding: 1.5rem;
  color: color-mix(in srgb, var(--gb-install-text) 95%, transparent);
  border-left: 2px solid var(--gb-install-bg, rgb(210,48,32));
}
.gb-install-title {
  font-size: var(--gb-text-lg);
  font-weight: 700;
  color: var(--gb-install-text);
  margin-bottom: 0.5rem;
}
.gb-install-title a {
  color: var(--gb-install-text);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: color-mix(in srgb, var(--gb-install-text) 40%, transparent);
}
.gb-install-title a:hover {
  text-decoration-color: color-mix(in srgb, var(--gb-install-text) 90%, transparent);
}
.gb-install-body {
  font-size: var(--gb-text-base);
  line-height: 1.55;
  color: color-mix(in srgb, var(--gb-install-text) 88%, transparent);
}
.gb-install-body p { margin-bottom: 0.5rem; }
.gb-install-body p:last-child { margin-bottom: 0; }
.gb-install-action {
  margin-top: 1rem;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: color-mix(in srgb, var(--gb-surface-deep, black) 30%, transparent);
  border-radius: 0px;
  padding: 0.5rem 1rem;
}
.gb-install-action pre {
  margin: 0;
  flex: 1;
  overflow-x: auto;
}
.gb-install-action code {
  font-family: var(--gb-font-mono);
  font-size: var(--gb-text-sm);
  color: var(--gb-install-text);
}
.gb-install-copy {
  color: color-mix(in srgb, var(--gb-install-text) 70%, transparent);
  border-color: color-mix(in srgb, var(--gb-install-text) 25%, transparent);
  flex-shrink: 0;
}
.gb-install-copy:hover {
  color: var(--gb-install-text);
  border-color: color-mix(in srgb, var(--gb-install-text) 50%, transparent);
  background: color-mix(in srgb, var(--gb-install-text) 10%, transparent);
}

/* === Divider === */
.gb-divider {
  border: none;
  border-top: 1px solid var(--gb-chrome-divider);
}

/* === Spacer === */
.gb-spacer { flex-shrink: 0; }

/* === Closing === */
.gb-closing {
  border-top: 1px solid var(--gb-chrome-divider);
  padding-top: 2rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-text-base);
  line-height: 1.7;
}
.gb-closing::before {
  background: linear-gradient(90deg, transparent, var(--gb-chrome-divider), transparent);
}
.gb-closing p { margin-bottom: 0.5rem; }
.gb-closing p:last-child { margin-bottom: 0; }
.gb-closing[data-align="center"] { text-align: center; }

/* === Diagram === */
.gb-diagram-caption {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-caption);
  margin-top: 0.5rem;
}

/* === Code Block === */
.gb-code {
  background: var(--gb-surface-deep);
  border: 1px solid var(--gb-chrome-border);
  border-radius: 0px;
}
.gb-code-title {
  gap: 0.5rem;
  font-size: var(--gb-text-xs);
  font-weight: 700;
  color: var(--gb-text-caption);
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--gb-chrome-border);
  background: var(--gb-surface-mid);
  letter-spacing: 0.02em;
  font-family: var(--gb-font-mono);
}
.gb-code-lang {
  display: inline-block;
  font-size: var(--gb-text-2xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-text-muted);
  background: transparent;
  padding: 0.125rem 0.5rem;
  border-radius: 0px;
}
.gb-code-title-text { color: var(--gb-text-muted); }
.gb-code-copy {
  font-family: inherit;
  font-size: var(--gb-text-2xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-text-muted);
  background: transparent;
  border: 1px solid var(--gb-chrome-border);
  border-radius: 0px;
  padding: 0.125rem 0.5rem;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.gb-code-copy:hover {
  color: var(--gb-text-primary);
  border-color: var(--gb-text-muted);
  background: var(--gb-surface-raised);
}
.gb-code pre {
  padding: 1rem 1.5rem;
  scrollbar-color: var(--gb-chrome-border) transparent;
}
.gb-code code {
  font-family: var(--gb-font-mono);
  font-size: var(--gb-text-sm);
  line-height: 1.65;
  color: var(--gb-text-body);
}
.gb-code-caption {
  font-size: var(--gb-text-xs);
  color: var(--gb-text-caption);
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--gb-chrome-border);
}
/* Syntax highlighting tokens */
.gb-hl-keyword { color: color-mix(in srgb, var(--gb-accent) 85%, white); }
.gb-hl-string { color: var(--gb-hl-string); }
.gb-hl-comment { color: var(--gb-text-muted); font-style: italic; }
.gb-hl-number { color: var(--gb-hl-number); }
.gb-hl-property { color: var(--gb-hl-property); }
.gb-hl-punctuation { color: var(--gb-text-caption); }
.gb-hl-type { color: var(--gb-hl-type); }
.gb-hl-builtin { color: var(--gb-hl-builtin); }
.gb-hl-constant { color: var(--gb-hl-constant); }

/* Line numbers */
.gb-code-pre[data-line-numbers] {
  padding-left: 3.5rem;
}
.gb-code-pre[data-line-numbers] .gb-code-line::before {
  padding-right: var(--gb-space-3);
  color: var(--gb-text-caption);
  opacity: var(--gb-opacity-muted);
  font-size: 0.8em;
}

/* Line highlighting */
.gb-code-line[data-highlighted] {
  background: color-mix(in srgb, var(--gb-accent) 8%, transparent);
  margin: 0 -1rem;
  padding: 0 1rem;
  border-left: 2px solid var(--gb-accent);
}

/* Collapsible code blocks */
.gb-code-details {
  border-top: 1px solid var(--gb-chrome-border);
}
.gb-code-summary {
  padding: 0.5rem 1rem;
  font-size: var(--gb-text-sm);
  color: var(--gb-text-caption);
}
.gb-code-summary:hover {
  color: var(--gb-text-body);
}

/* === Code Pair === */
.gb-code-pair {
  gap: 1rem;
}
.gb-code-pair-caption {
  font-size: var(--gb-text-xs);
  color: var(--gb-text-caption);
  margin-top: 0.5rem;
  text-align: center;
}

/* === Inline SVG Interactivity === */
.gb-diagram-inline .svg-node {
  transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease;
}
.gb-diagram-inline .svg-node:hover {
  filter: drop-shadow(0 0 6px rgba(240,240,242,0.12));
}
.gb-diagram-inline .gb-diagram-svg:hover .svg-node {
  opacity: var(--gb-opacity-visible);
}
.gb-diagram-inline .gb-diagram-svg:hover .svg-node:hover {
  opacity: 1;
}
.gb-diagram-inline .svg-edge {
  transition: opacity var(--gb-duration-normal) ease, filter var(--gb-duration-normal) ease;
}
.gb-diagram-inline .gb-diagram-svg:hover .svg-edge {
  opacity: var(--gb-opacity-soft);
}
.gb-diagram-inline .gb-diagram-svg:hover .svg-edge:hover {
  opacity: 1;
  filter: brightness(1.2);
}
.gb-diagram-inline .svg-group {
  transition: filter var(--gb-duration-fast) ease;
}
.gb-diagram-inline .svg-group:hover {
  filter: brightness(1.1);
}
.gb-diagram-inline .svg-node:active {
  transition: transform var(--gb-duration-instant) ease;
}
.gb-diagram-inline .gb-diagram-has-selection .svg-node {
  opacity: var(--gb-opacity-subtle);
  transition: opacity var(--gb-duration-normal) ease, filter var(--gb-duration-normal) ease, transform var(--gb-duration-normal) ease;
}
.gb-diagram-inline .svg-node-selected {
  filter: drop-shadow(0 0 12px rgba(240,240,242,0.2));
}
.gb-diagram-inline .gb-diagram-has-selection .svg-edge {
  opacity: 0.12;
  transition: opacity 0.35s ease;
}
.gb-diagram-inline .svg-edge-active {
  opacity: 1;
  filter: brightness(1.3);
}

/* === Cohesion Divider === */
.gb-cohesion-divider {
  border-top-style: solid;
  border-top-color: var(--gb-chrome-divider);
}

/* === Emphasis variants === */
[data-emphasis="subtle"] .gb-card { --gb-card-accent: 2px; }
[data-emphasis="bold"] .gb-card { --gb-card-accent: 4px; }
[data-shadow="subtle"] .gb-card,
[data-shadow="subtle"] .gb-stat,
[data-shadow="subtle"] .gb-info-box {
  box-shadow: none;
}
[data-shadow="deep"] .gb-card,
[data-shadow="deep"] .gb-stat,
[data-shadow="deep"] .gb-info-box {
  box-shadow: none;
}

/* === Featured Card === */
.gb-cards[data-has-featured] .gb-card:not([data-featured]) {
  opacity: var(--gb-opacity-subtle);
  transition: opacity var(--gb-duration-normal) ease;
}
.gb-cards[data-has-featured] .gb-card:not([data-featured]):hover {
  opacity: var(--gb-opacity-soft);
}
.gb-card[data-featured] {
  --gb-card-accent: 4px;
}

/* === Section Label Anchors === */
.gb-section-label {
  transition: color var(--gb-duration-fast) ease;
}
.gb-section-anchor {
  color: inherit;
  text-decoration: none;
}
.gb-section-anchor::before {
  color: var(--gb-accent);
  opacity: 0;
  font-weight: 700;
  transition: opacity var(--gb-duration-fast) ease;
}
.gb-section-label:hover {
  color: var(--gb-text-primary);
}
.gb-section-label:hover .gb-section-anchor::before {
  opacity: var(--gb-opacity-soft);
}

/* === Stats — numerals float, no container === */
.gb-stats {
  gap: 1rem;
}
.gb-stat {
  background: transparent;
  border: none;
  border-radius: 0px;
  box-shadow: none;
  padding: 1rem 0.5rem;
  text-align: center;
  border-top: 1px solid var(--gb-chrome-divider);
  transition: none;
}
.gb-stat:hover {
  transform: none;
  box-shadow: none;
}
.gb-stat-value {
  font-family: var(--gb-font-heading);
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
  font-variant-numeric: lining-nums;
  margin-bottom: 0.5rem;
  color: var(--gb-stat-accent);
}
.gb-stat-label {
  font-variant-caps: all-small-caps;
  font-size: var(--gb-text-sm);
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--gb-text-muted);
  margin-top: 0.5rem;
}
.gb-stat-detail {
  font-size: var(--gb-text-xs);
  color: var(--gb-text-caption);
  margin-top: 0.5rem;
  line-height: 1.4;
}
.gb-stat-unit {
  font-size: 0.5em;
  font-weight: 400;
  opacity: var(--gb-opacity-soft);
  vertical-align: baseline;
}
.gb-stat-prefix { margin-right: 0.1em; }
.gb-stat-suffix { margin-left: 0.15em; }
.gb-stat-trend {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  margin-left: 0.5rem;
  vertical-align: super;
}
.gb-stat-trend-up { color: var(--gb-success, rgb(16,185,129)); }
.gb-stat-trend-down { color: var(--gb-danger, rgb(239,68,68)); }
.gb-stat-trend-flat { color: var(--gb-text-caption); }

/* === Page Navigation (Sticky) === */
.gb-page-nav {
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: var(--gb-surface-mid);
  border: 1px solid var(--gb-chrome-border);
  border-radius: 0px;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
}
.gb-page-nav-link {
  font-size: var(--gb-text-2xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-text-muted);
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0px;
  transition: color 0.15s ease, background 0.15s ease;
}
.gb-page-nav-link:hover {
  color: var(--gb-text-primary);
  background: var(--gb-surface-raised);
  text-decoration: none;
}
.gb-page-nav-link.gb-nav-active {
  color: var(--gb-accent);
  background: color-mix(in srgb, var(--gb-accent) 8%, transparent);
}
.gb-page-nav-link.gb-nav-section-active {
  color: var(--gb-text-primary);
  background: color-mix(in srgb, var(--gb-accent) 4%, transparent);
}
.gb-page-nav-sub {
  text-transform: none;
  font-weight: 400;
  font-size: var(--gb-text-2xs);
  letter-spacing: 0.02em;
  color: var(--gb-text-caption);
}
.gb-page-nav-sub:hover {
  color: var(--gb-text-primary);
}
.gb-page-nav-sep {
  background: var(--gb-chrome-border);
  margin: 0 0.125rem;
}

/* === Hero Accent Bar Animation === */
body[data-animate] .gb-hero-accent {
  transform-origin: left;
  transform: scaleX(0);
  animation: gb-accent-grow 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
}
@keyframes gb-accent-grow {
  to { transform: scaleX(1); }
}

/* === Entrance animations — visible by default === */
[data-entrance],
.gb-hero,
.gb-hero-title,
.gb-hero-subtitle,
.gb-hero-body,
.gb-hero-accent {
  opacity: 1;
  transform: none;
  filter: none;
}

/* ============================================================
   SHOWCASE
   ============================================================ */

/* === Full-Viewport Hero (superhero) === */
.gb-hero[data-size="full"] {
  border-radius: 0;
  padding: 4rem 1.5rem;
  background: var(--gb-surface-page);
}
.gb-hero[data-size="full"] .gb-hero-title {
  font-size: clamp(3rem, 8vw, 5rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
  font-weight: 700;
  max-width: 16ch;
}
.gb-hero[data-size="full"] .gb-hero-eyebrow {
  font-size: var(--gb-text-base);
  letter-spacing: 0.15em;
}
.gb-hero[data-size="full"] .gb-hero-body {
  font-size: clamp(1.125rem, 3vw, 1.5rem);
  max-width: 38rem;
  margin-left: auto;
  margin-right: auto;
}
.gb-hero[data-size="full"] .gb-hero-accent {
  width: min(200px, 40%);
  height: 2px;
}

/* Scroll indicator */
.gb-hero-scroll {
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--gb-text-muted) var(--gb-mix-medium, 50%), transparent);
  color: var(--gb-text-muted);
  text-decoration: none;
  opacity: var(--gb-opacity-soft);
  transition: opacity var(--gb-duration-fast) ease, border-color var(--gb-duration-fast) ease, color var(--gb-duration-fast) ease;
}
.gb-hero-scroll:hover {
  opacity: 1;
  color: var(--gb-text-primary);
  border-color: color-mix(in srgb, var(--gb-text-primary) var(--gb-mix-medium, 50%), transparent);
  text-decoration: none;
}

/* === Hero Mesh Effect === */
.gb-hero[data-effect~="mesh"] .gb-hero-mesh {
  background:
    radial-gradient(ellipse 60% 50% at 15% 25%, color-mix(in srgb, var(--gb-accent) 4%, transparent) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 85% 70%, color-mix(in srgb, var(--gb-accent) 3%, transparent) 0%, transparent 70%);
}

/* === Superhero → Content Transition === */
.gb-hero-transition {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--gb-surface-page) 100%
  );
}

/* === Brutalist Superhero Enhancements === */
.gb-hero-grid {
  background-image:
    linear-gradient(rgba(240,240,242,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(240,240,242,0.015) 1px, transparent 1px);
  background-size: 96px 96px;
}

.gb-hero-tagline-row {
  gap: 2rem;
  padding: 2rem 4vw;
}

.gb-hero-tagline-line {
  background: rgba(240, 240, 242, 0.08);
}

.gb-hero-tagline-text {
  font-family: var(--gb-font-body);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(240, 240, 242, 0.4);
  white-space: nowrap;
}

/* Brutalist title container */
.gb-hero[data-size="full"] .gb-hero-title-container,
.gb-hero-title-container {
  padding: 0 4vw 0.3em;
}

/* Override the base title when inside a title-container (brutalist mode) */
.gb-hero[data-size="full"] .gb-hero-title-container {
  overflow: visible;
}

.gb-hero[data-size="full"] .gb-hero-title-container .gb-hero-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: clamp(6rem, 22vw, 24rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 0.9;
  color: transparent;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1.5px rgba(240, 240, 242, 0.1);
  padding-bottom: 0.2em;
  position: relative;
  z-index: 2;
}

.gb-hero[data-size="full"] .gb-hero-title-fill {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: clamp(6rem, 22vw, 24rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 0.9;
  color: var(--gb-text-primary);
  -webkit-text-fill-color: var(--gb-text-primary);
  -webkit-text-stroke: 0;
  background: none;
  -webkit-background-clip: unset;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Title-length tiers */
.gb-hero[data-title-len="medium"] .gb-hero-title-container .gb-hero-title {
  font-size: clamp(4rem, 14vw, 14rem);
  -webkit-text-stroke: 1.5px rgba(240, 240, 242, 0.1);
}
.gb-hero[data-title-len="medium"] .gb-hero-title-fill {
  font-size: clamp(4rem, 14vw, 14rem);
}
.gb-hero[data-title-len="long"] .gb-hero-title-container .gb-hero-title {
  font-size: clamp(3rem, 9vw, 9rem);
  -webkit-text-stroke: 1.5px rgba(240, 240, 242, 0.12);
}
.gb-hero[data-title-len="long"] .gb-hero-title-fill {
  font-size: clamp(3rem, 9vw, 9rem);
}

.gb-hero-descriptors {
  gap: 3rem;
}

.gb-hero-descriptor {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.gb-hero:hover .gb-hero-descriptor:nth-child(2) { transition-delay: 0.1s; }
.gb-hero:hover .gb-hero-descriptor:nth-child(3) { transition-delay: 0.2s; }

.gb-hero-descriptor-title {
  font-family: var(--gb-font-body);
  font-size: 0.875rem;
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.15em;
  color: var(--gb-accent);
  margin-bottom: 0.5rem;
}

.gb-hero-descriptor-body {
  font-size: 1rem;
  font-weight: 400;
  color: rgba(240, 240, 242, 0.55);
  line-height: 1.6;
}
.gb-hero-descriptor-body p { margin: 0; }

/* Override the base .gb-hero-scroll when we have the brutalist scroll label */
.gb-hero[data-size="full"] .gb-hero-scroll:has(.gb-hero-scroll-label) {
  text-decoration: none;
  color: var(--gb-text-primary);
  transition: all 0.3s;
  gap: 1rem;
}

.gb-hero[data-size="full"] .gb-hero-scroll:has(.gb-hero-scroll-label):hover {
  color: var(--gb-accent);
}

.gb-hero-scroll-label {
  font-family: var(--gb-font-body);
  font-size: var(--gb-text-xs);
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.9;
}

.gb-hero-scroll-ring {
  border: 1px solid rgba(240,240,242,0.2);
  border-radius: 50%;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.gb-hero-scroll:hover .gb-hero-scroll-ring {
  border-color: var(--gb-accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--gb-accent) 30%, transparent);
}

.gb-hero-scroll-ring::before {
  border: 1px solid color-mix(in srgb, var(--gb-accent) 15%, transparent);
  border-radius: 50%;
}

/* Override accent bar in full superhero */
.gb-hero[data-size="full"] .gb-hero-accent {
  height: 2px;
  background: var(--gb-accent);
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  margin-top: 0;
  border-radius: 0;
  opacity: 1;
}

/* === Navigation Cards === */
.gb-nav-cards {
  gap: 1rem;
  margin: 2rem 0;
}

.gb-nav-card {
  gap: 0.5rem;
  padding: 1.5rem;
  background: transparent;
  border: 1px solid var(--gb-chrome-border);
  border-radius: 0px;
  text-decoration: none;
  transition: border-color var(--gb-duration-fast), transform var(--gb-duration-fast);
}

.gb-nav-card:hover {
  border-color: var(--gb-accent);
  background: transparent;
  transform: translateY(-2px);
}

.gb-nav-card-title {
  font-family: var(--gb-font-body);
  font-size: 1rem;
  font-weight: 700;
  color: var(--gb-text-primary);
}

.gb-nav-card-desc {
  font-size: var(--gb-text-base);
  color: var(--gb-text-muted);
  line-height: 1.5;
}

.gb-nav-card-arrow {
  font-size: 1.25rem;
  color: var(--gb-text-muted);
  transition: color var(--gb-duration-fast), transform var(--gb-duration-fast);
}

.gb-nav-card:hover .gb-nav-card-arrow {
  color: var(--gb-accent);
  transform: translateX(4px);
}

/* === Gradient Border Glow — subtle for mono === */
.gb-cards[data-border="glow"] .gb-card::before {
  background: conic-gradient(
    from 135deg,
    color-mix(in srgb, var(--gb-accent) 30%, transparent),
    transparent 25%,
    transparent 50%,
    color-mix(in srgb, var(--gb-accent) 20%, transparent) 75%,
    color-mix(in srgb, var(--gb-accent) 30%, transparent)
  );
  opacity: var(--gb-opacity-subtle);
  transition: opacity var(--gb-duration-slow) ease;
}
.gb-cards[data-border="glow"] .gb-card:hover::before {
  opacity: var(--gb-opacity-soft);
}
.gb-cards[data-border="glow"] .gb-card::after {
  background: var(--gb-surface-page);
}

/* Glass + glow combo — minimal for mono */
.gb-cards[data-border="glow"][data-surface="glass"] .gb-card::after {
  background: color-mix(in srgb, var(--gb-surface-page) 90%, transparent);
}

/* === Glassmorphism Cards — toned down for mono === */
.gb-cards[data-surface="glass"] .gb-card {
  background: color-mix(in srgb, var(--gb-surface-raised) 60%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid color-mix(in srgb, var(--gb-chrome-border) 30%, transparent);
  border-left: 3px solid var(--gb-card-border, var(--gb-accent));
}
.gb-cards[data-surface="glass"] .gb-card:hover {
  background: color-mix(in srgb, var(--gb-surface-raised) 70%, transparent);
  box-shadow: none;
}

/* === Noise Texture Overlay === */
.gb-texture-defs {
  opacity: 0.02;
  mix-blend-mode: overlay;
}

/* === Word/Line Reveal Animation === */
[data-reveal] .gb-reveal-unit {
  filter: blur(3px);
}

/* === Narrative === */
.gb-narrative {
  gap: 2rem;
}
.gb-narrative-pinned {
  padding: 2rem 0;
}
.gb-narrative-pinned-text {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--gb-text-primary);
  line-height: 1.3;
  letter-spacing: -0.02em;
}
.gb-narrative-pinned-text p { margin-bottom: 1rem; }
.gb-narrative-pinned[data-role="thesis"] .gb-narrative-pinned-text {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gb-accent);
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
}
.gb-narrative-pinned[data-role="question"] .gb-narrative-pinned-text {
  font-style: italic;
  color: var(--gb-text-muted);
}
.gb-narrative-pinned[data-role="summary"] .gb-narrative-pinned-text {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--gb-text-primary);
}
.gb-narrative-pinned[data-role="definition"] .gb-narrative-pinned-text {
  font-size: 1.125rem;
  font-style: italic;
  color: var(--gb-text-body);
  border-left: 2px solid var(--gb-accent);
  padding-left: 1.5rem;
}
.gb-narrative-pinned-img {
  border-radius: 0px;
  margin-bottom: 1rem;
}
.gb-narrative-indicator {
  width: 2rem;
  height: 2px;
  background: var(--gb-accent);
  border-radius: 0px;
  margin-top: 2rem;
  transition: background 0.3s ease, width 0.3s ease;
}
.gb-narrative-steps {
  gap: 0;
  padding: 2rem 0;
}
.gb-narrative-step {
  gap: var(--gb-space-3);
  padding: var(--gb-space-4) 0;
  border-top: 1px solid var(--gb-chrome-divider);
  opacity: var(--gb-opacity-subtle);
  transition: opacity var(--gb-duration-slow) ease;
}
.gb-narrative-step:first-child { border-top: none; }
.gb-narrative-step.gb-narrative-active {
  opacity: 1;
}
.gb-narrative-step-marker {
  border-radius: 0px;
  background: var(--step-accent, var(--gb-chrome-border));
  transition: background 0.3s ease;
}
.gb-narrative-step.gb-narrative-active .gb-narrative-step-marker {
  background: var(--step-accent, var(--gb-accent));
}
.gb-narrative-step-title {
  font-size: var(--gb-text-md);
  font-weight: 700;
  color: var(--gb-text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}
.gb-narrative-step-subtitle {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-muted);
  margin-bottom: 0.5rem;
  font-weight: 400;
}
.gb-narrative-step-body {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-body);
  line-height: 1.65;
}
.gb-narrative-step-body p { margin-bottom: 0.5rem; }
.gb-narrative-step-body p:last-child { margin-bottom: 0; }
.gb-narrative-step-img {
  border-radius: 0px;
  margin-top: 1rem;
}
.gb-narrative-step-code {
  font-family: var(--gb-font-mono);
  font-size: var(--gb-text-sm);
  background: var(--gb-surface-deep);
  border: 1px solid var(--gb-chrome-border);
  border-radius: 0px;
  padding: 1rem 1.5rem;
  margin-top: 1rem;
  color: var(--gb-text-body);
}

/* Responsive: single column on mobile */
@media (max-width: 768px) {
  .gb-narrative-pinned {
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--gb-chrome-divider);
  }
}

/* === Print Stylesheet === */
@media print {
  body {
    background: white;
    color: black;
    padding: 0.5in;
    font-size: 10pt;
  }
  .gb-breadcrumbs { margin-bottom: 0.5rem; }
  .gb-page-footer { border-top-color: #ccc; }
  .gb-page-footer-link:hover { background: none; }
  .gb-hero {
    background: none;
    border: 1px solid #ccc;
  }
  .gb-hero-title {
    background: none;
    -webkit-text-fill-color: black;
    color: black;
  }
  .gb-card {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  .gb-stat {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  a { color: black; text-decoration: underline; }
  a::after { content: " (" attr(href) ")"; font-size: 8pt; color: #666; }
  .gb-card-title a::after { content: none; }
  .gb-pill {
    border: 1px solid #999;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .gb-code pre {
    background: #f5f5f5;
    color: #000;
    border: 1px solid #ccc;
  }
  .gb-code-title {
    background: #e5e5e5;
    color: #000;
  }
}

/* ============================================================
   SITE LAYOUT
   ============================================================ */

.gb-content {
  padding: 3rem 1.5rem;
}

/* === Reading Progress Bar === */
.gb-progress-bar {
  background: var(--gb-accent);
}

/* === Breadcrumbs === */
.gb-breadcrumbs {
  margin-bottom: 1rem;
}
.gb-breadcrumbs ol {
  gap: 0;
  font-size: var(--gb-text-xs);
  color: var(--gb-text-muted);
}
.gb-crumb:not(:last-child)::after {
  margin: 0 var(--gb-space-1);
  opacity: var(--gb-opacity-subtle);
}
.gb-crumb-link {
  color: var(--gb-text-muted);
  text-decoration: none;
  transition: color var(--gb-duration-fast) ease;
}
.gb-crumb-link:hover {
  color: var(--gb-accent);
  text-decoration: none;
}
.gb-crumb[aria-current="page"] {
  color: var(--gb-text-body);
  font-weight: 700;
}

/* === Eyebrow categories === */
.gb-eyebrow {
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-accent);
}

/* === Page Footer === */
.gb-page-footer {
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--gb-chrome-divider);
}
.gb-page-footer-link {
  gap: 0.25rem;
  padding: 1rem;
  border-radius: 0px;
  text-decoration: none;
  transition: background 0.15s ease;
}
.gb-page-footer-link:hover {
  background: var(--gb-surface-raised);
  text-decoration: none;
}
.gb-page-footer-label {
  font-size: var(--gb-text-2xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--gb-text-muted);
}
.gb-page-footer-title {
  font-size: var(--gb-text-base);
  font-weight: 700;
  color: var(--gb-accent);
}

/* === Right Rail === */
.gb-right-rail {
  border-left: 1px solid var(--gb-chrome-border);
  background: var(--gb-surface-deep);
}

/* Right-rail TOC */
.gb-rail-toc {
  gap: 0.125rem;
  padding: 2rem 1rem 2rem 1rem;
}
.gb-rail-meta {
  font-size: var(--gb-text-xs);
  font-weight: 400;
  color: var(--gb-text-muted);
  letter-spacing: 0.02em;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}
.gb-rail-title {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--gb-text-muted);
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
}
.gb-rail-track {
  background: var(--gb-chrome-border);
  border-radius: 0px;
}
.gb-rail-indicator {
  background: var(--gb-accent);
  border-radius: 0px;
  opacity: 0;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), height 0.2s ease, opacity 0.2s ease;
}
.gb-rail-link {
  font-size: var(--gb-text-sm);
  line-height: 1.5;
  color: var(--gb-text-muted);
  text-decoration: none;
  padding: 0.25rem 0.5rem 0.25rem 0.5rem;
  border-radius: 0px;
  transition: color 0.15s ease;
}
.gb-rail-link:hover {
  color: var(--gb-text-primary);
  text-decoration: none;
}
.gb-rail-link.gb-rail-active {
  color: var(--gb-accent);
  font-weight: 700;
}
.gb-rail-sub {
  padding-left: 1rem;
  font-size: var(--gb-text-xs);
}

/* === Sidebar === */
.gb-sidebar {
  padding: 1.5rem 1rem 2rem 1.5rem;
  border-right: 1px solid var(--gb-chrome-border);
  background: var(--gb-surface-deep);
  scrollbar-color: var(--gb-chrome-border) transparent;
}
.gb-sidebar::-webkit-scrollbar-thumb { background: var(--gb-chrome-border); border-radius: 0px; }

.gb-sidebar-nav {
  gap: 0.125rem;
}

/* Home link */
.gb-sidebar-home {
  display: block;
  font-size: var(--gb-text-base);
  font-weight: 700;
  color: var(--gb-text-primary);
  text-decoration: none;
  padding: 0.5rem 0.5rem;
  border-radius: 0px;
  margin-bottom: 1rem;
  transition: color 0.15s ease, background 0.15s ease;
}
.gb-sidebar-home:hover {
  color: var(--gb-accent);
  background: color-mix(in srgb, var(--gb-accent) 5%, transparent);
  text-decoration: none;
}
.gb-sidebar-home.gb-sidebar-active {
  color: var(--gb-accent);
  background: color-mix(in srgb, var(--gb-accent) 8%, transparent);
}

/* Section separator */
.gb-sidebar-sep {
  height: 1px;
  background: var(--gb-chrome-divider);
  margin: 0.5rem 0.5rem;
}

.gb-sidebar-section {
  display: block;
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--gb-text-caption);
  text-decoration: none;
  padding: 0.375rem 0.5rem;
  border-radius: 0px;
  transition: color 0.15s ease;
}
.gb-sidebar-section:hover {
  color: var(--gb-text-primary);
  text-decoration: none;
}
.gb-sidebar-section.gb-sidebar-active {
  color: var(--gb-accent);
}

/* Child links container */
.gb-sidebar-pages {
  padding-left: 0.5rem;
  margin-top: 0.125rem;
  border-left: 1px solid var(--gb-chrome-divider);
  margin-left: 1rem;
}

/* Individual page link */
.gb-sidebar-link {
  display: block;
  font-size: var(--gb-text-sm);
  font-weight: 400;
  color: var(--gb-text-muted);
  text-decoration: none;
  padding: 0.375rem 0.5rem;
  margin-top: 0.25rem;
  border-radius: 0px;
  transition: color 0.15s ease, background 0.15s ease;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
}
.gb-sidebar-link:hover {
  color: var(--gb-text-primary);
  background: var(--gb-surface-mid);
  text-decoration: none;
}
.gb-sidebar-link.gb-sidebar-active {
  color: var(--gb-accent);
  background: color-mix(in srgb, var(--gb-accent) 8%, transparent);
  font-weight: 700;
}

/* Subsection heading */
.gb-sidebar-subsection {
  display: block;
  font-size: var(--gb-text-sm);
  font-weight: 700;
  color: var(--gb-text-muted);
  text-decoration: none;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  padding: 0.375rem 0.5rem;
  margin-top: 0.25rem;
  border-radius: 0px;
  transition: color 0.15s ease;
}
.gb-sidebar-subsection:hover {
  color: var(--gb-text-primary);
  text-decoration: none;
}
.gb-sidebar-subsection.gb-sidebar-active {
  color: var(--gb-accent);
}

/* Subsection child link */
.gb-sidebar-sublink {
  display: block;
  font-size: var(--gb-text-sm);
  color: var(--gb-text-muted);
  text-decoration: none;
  padding: 0.25rem 0.5rem 0.25rem 1.5rem;
  border-radius: 0px;
  transition: color 0.15s ease, background 0.15s ease;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
}
.gb-sidebar-sublink:hover {
  color: var(--gb-text-primary);
  background: var(--gb-surface-mid);
  text-decoration: none;
}
.gb-sidebar-sublink.gb-sidebar-active {
  color: var(--gb-accent);
  background: color-mix(in srgb, var(--gb-accent) 8%, transparent);
  font-weight: 700;
}

/* Sub-subsection group header */
.gb-sidebar-subgroup {
  display: block;
  font-size: var(--gb-text-xs);
  font-weight: 700;
  color: var(--gb-text-caption);
  text-decoration: none;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  padding: 0.25rem 0.5rem 0.25rem 1.5rem;
  margin-top: 0.25rem;
  border-radius: 0px;
  transition: color 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gb-sidebar-subgroup:hover {
  color: var(--gb-text-primary);
  text-decoration: none;
}
.gb-sidebar-subgroup.gb-sidebar-active {
  color: var(--gb-accent);
}

/* Category sub-headers */
.gb-sidebar-category {
  display: block;
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  color: var(--gb-text-caption);
  padding: var(--gb-space-1) var(--gb-space-1) var(--gb-space-1) var(--gb-space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: var(--gb-opacity-soft);
}
.gb-sidebar-category:first-of-type {
  padding-top: 0.25rem;
}

/* === Gantt Chart === */
.gb-gantt {
  font-size: var(--gb-text-xs);
  border: 1px solid var(--gb-chrome-border);
  border-radius: 0;
  background: var(--gb-surface-deep);
}
.gb-gantt-header {
  border-bottom: 1px solid var(--gb-chrome-border);
  background: var(--gb-surface-deep);
}
.gb-gantt-corner {
  padding: 0.5rem 1rem;
  font-weight: 700;
  color: var(--gb-text-muted);
}
.gb-gantt-week-header {
  padding: 0.5rem 0.25rem;
  text-align: center;
  font-weight: 700;
  color: var(--gb-text-muted);
  letter-spacing: 0.04em;
  border-left: 1px solid var(--gb-chrome-border);
}
.gb-gantt-group-row {
  background: color-mix(in srgb, var(--gb-surface-mid) 30%, transparent);
  border-top: 1px solid var(--gb-chrome-border);
}
.gb-gantt-group-label {
  padding: 0.5rem 1rem;
  font-weight: 700;
  font-size: var(--gb-text-xs);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--gb-gantt-color, var(--gb-text-primary));
}
.gb-gantt-item-row {
  border-top: 1px solid color-mix(in srgb, var(--gb-chrome-border) 40%, transparent);
}
.gb-gantt-item-row:hover {
  background: color-mix(in srgb, var(--gb-surface-mid) 20%, transparent);
}
.gb-gantt-item-label {
  padding: 0.25rem 1rem 0.25rem 1.5rem;
  color: var(--gb-text-body);
  font-size: var(--gb-text-xs);
}
.gb-gantt-owner {
  color: var(--gb-text-muted);
  font-size: var(--gb-text-2xs);
  margin-left: 0.25rem;
}
.gb-gantt-cell {
  min-height: 1.5rem;
  border-left: 1px solid color-mix(in srgb, var(--gb-chrome-border) 30%, transparent);
}
.gb-gantt-group-cell {
  border-left-color: color-mix(in srgb, var(--gb-chrome-border) 20%, transparent);
}
.gb-gantt-bar {
  background: var(--gb-gantt-color, var(--gb-accent));
  min-height: 1.25rem;
  margin: 0.125rem 0;
  border-left: none;
  border-radius: 0;
}
.gb-gantt-bar-start {
  margin-left: 2px;
}
.gb-gantt-bar-end {
  margin-right: 2px;
}
.gb-gantt-bar-active {
  box-shadow: 0 0 6px color-mix(in srgb, var(--gb-gantt-color) 40%, transparent);
}
.gb-gantt-bar-rollout {
  background: var(--gb-gantt-color);
  box-shadow: 0 0 6px color-mix(in srgb, var(--gb-gantt-color) 50%, transparent);
  border-right: 2px solid color-mix(in srgb, var(--gb-gantt-color) 100%, white 40%);
}
.gb-gantt-milestone {
  text-align: center;
  color: var(--gb-gantt-color, var(--gb-accent));
  font-size: var(--gb-text-sm);
  border-left: none;
}
.gb-gantt-milestone-label {
  padding: 0.125rem 1rem 0.125rem 1rem;
  color: var(--gb-gantt-color, var(--gb-text-muted));
  font-size: var(--gb-text-xs);
  font-weight: 700;
  font-style: italic;
}
.gb-gantt-milestone-marker .gb-gantt-diamond {
  width: 0.5rem;
  height: 0.5rem;
}
.gb-gantt-diamond {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--gb-gantt-color, var(--gb-accent));
  border-radius: 0;
  margin: 0 0.5rem 0 0.125rem;
}
.gb-gantt-milestones {
  gap: 1rem 1.5rem;
  padding: 1rem;
  border-top: 1px solid var(--gb-chrome-border);
  background: color-mix(in srgb, var(--gb-surface-mid) 20%, transparent);
}
.gb-gantt-milestone-tag {
  color: var(--gb-gantt-color, var(--gb-text-muted));
  font-size: var(--gb-text-sm);
  font-weight: 700;
}
.gb-gantt-milestone-tag .gb-gantt-diamond {
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.5rem;
}
.gb-gantt-milestone-tag small {
  color: var(--gb-text-muted);
  font-weight: 400;
  margin-left: 0.25rem;
}

/* === Domain Grid === */
.gb-domain-grid {
  gap: 1rem;
}
.gb-domain-cell {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--domain-accent) 25%, transparent);
  border-radius: 0px;
  padding: 1rem 1rem 1rem;
  gap: 0.5rem;
  transition: border-color 0.15s ease;
}
.gb-domain-cell:hover {
  border-color: color-mix(in srgb, var(--domain-accent) 45%, transparent);
  box-shadow: none;
}
.gb-domain-cell[data-empty] {
  border-style: dashed;
  min-height: 5rem;
}
.gb-domain-header {
  gap: 0.5rem;
}
.gb-domain-label {
  font-size: var(--gb-text-base);
  font-weight: 700;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  color: var(--domain-accent);
}
.gb-domain-orbit {
  font-size: var(--gb-text-xs);
  color: var(--gb-text-muted);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--domain-accent) 20%, transparent);
  padding: 0.125rem 0.5rem;
  border-radius: 0px;
  font-family: var(--gb-font-mono);
  word-break: break-all;
}
.gb-domain-atoms {
  gap: 0.5rem;
}
.gb-atom-pill {
  gap: 0.125rem;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--domain-accent) 25%, transparent);
  border-radius: 0px;
  padding: 0.5rem 0.5rem;
  transition: border-color 0.15s ease;
}
.gb-atom-pill:hover {
  border-color: color-mix(in srgb, var(--domain-accent) 40%, transparent);
}
.gb-atom-name {
  font-size: var(--gb-text-sm);
  font-weight: 700;
  color: var(--gb-text-primary);
  margin-bottom: 0.125rem;
}
.gb-atom-desc {
  font-size: var(--gb-text-xs);
  color: var(--gb-text-muted);
  line-height: 1.4;
}

/* === Responsive Breakpoints === */
@media (max-width: 1024px) {
  body[data-layout="sidebar"] {
    padding: 2rem 1.5rem;
  }
}
@media (max-width: 768px) {
  body, body[data-layout="sidebar"] {
    padding: 2rem 1rem;
    max-width: 100%;
  }
  .gb-hero {
    padding: 2rem 0;
    border-radius: 0px;
  }
  .gb-table { font-size: var(--gb-text-sm); }
  .gb-table th, .gb-table td { padding: 0.5rem 0.5rem; }
  .gb-matrix { font-size: var(--gb-text-xs); }
  .gb-matrix-col-header { font-size: var(--gb-text-2xs); padding: 0.25rem 0.25rem; }
  .gb-matrix-row-label { padding: 0.25rem 0.5rem 0.25rem 0.5rem; font-size: var(--gb-text-xs); }
  .gb-matrix-cell { padding: 0.25rem 0.25rem; }
  .gb-matrix-cell-filled .gb-matrix-cell-label { font-size: var(--gb-text-2xs); padding: 0.125rem 0.25rem; }
  .gb-page-nav { top: 0; border-radius: 0; margin: 0 -1rem; width: calc(100% + 2rem); }
  .gb-timeline-row::before {
    background: linear-gradient(to bottom,
      var(--gb-accent) 0%,
      var(--gb-accent) 75%,
      color-mix(in srgb, var(--gb-text-muted) 30%, transparent) 100%
    );
  }
  .gb-timeline-arrow {
    padding-top: 0;
  }
  .gb-timeline[data-mode="multi"] .gb-timeline-track {
    gap: 4px;
  }
  .gb-timeline-track-label {
    border-bottom: 1px solid var(--tl-track-accent);
    padding: 0.5rem 0;
  }
  .gb-hero-descriptors {
    gap: 1.5rem;
  }
}
@media (max-width: 480px) {
  body, body[data-layout="sidebar"] { padding: 1.5rem 1rem; }
  .gb-hero {
    padding: 1.5rem 0;
  }
  .gb-transform-row {
    gap: 0.25rem 0.5rem;
  }
  .gb-page-nav { margin: 0 -1rem; width: calc(100% + 2rem); }
}

/* === Wired Diagram === */
.gb-wired-diagram {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.gb-wd-zone {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--zone-accent) 40%, transparent);
  border-radius: 0px;
  box-shadow: none;
  transition: border-color 0.15s ease;
}

.gb-wd-zone:hover {
  border-color: color-mix(in srgb, var(--zone-accent) 65%, transparent);
  box-shadow: none;
}

.gb-wd-zone-label {
  font-size: var(--gb-text-xs);
  font-weight: 700;
  color: var(--zone-accent);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
}

.gb-wd-atom {
  font-size: var(--gb-text-2xs);
  font-weight: 400;
  color: var(--gb-text-primary);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--zone-accent) 30%, transparent);
  border-radius: 0px;
}

.gb-wd-annotation {
  font-size: var(--gb-text-2xs);
  font-style: italic;
  opacity: var(--gb-opacity-soft);
}

.gb-wd-wire-label {
  font-size: 9px;
  font-family: var(--gb-font-mono);
}

/* === Action bar — ghost outline buttons === */
.gb-action-bar {
  gap: var(--gb-gap-normal);
  padding: var(--gb-space-2) 0;
}

.gb-ab-btn {
  padding: var(--gb-space-1) var(--gb-space-3);
  border: 1px solid var(--gb-action-border, var(--gb-chrome-border));
  border-radius: 0px;
  font-family: var(--gb-font-body);
  font-size: var(--gb-text-sm);
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: filter var(--gb-duration-fast) ease, transform var(--gb-duration-instant) ease;
  line-height: 1;
  background: transparent;
  color: var(--gb-action-text, var(--gb-text-primary));
}

.gb-ab-btn:first-child {
  border-color: var(--gb-accent);
  color: var(--gb-accent);
}

.gb-ab-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.gb-ab-btn:active {
  filter: brightness(0.95);
  transform: translateY(0);
}

.gb-ab-danger {
  font-weight: 700;
}

.gb-ab-muted {
  opacity: var(--gb-opacity-soft);
}

.gb-ab-empty {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-caption);
  font-style: italic;
}

/* === Outcome log === */
.gb-outcome-log {
  padding: var(--gb-space-1) 0;
}

.gb-ol-list {
  gap: var(--gb-space-1);
}

.gb-ol-entry {
  gap: var(--gb-space-1);
  font-size: var(--gb-text-sm);
  font-family: var(--gb-font-mono);
  color: color-mix(in srgb, var(--gb-text-body) 85%, transparent);
  padding: var(--gb-space-1) var(--gb-space-2);
  border-radius: 0px;
  background: color-mix(in srgb, var(--gb-text-body) var(--gb-mix-ghost, 5%), transparent);
}

.gb-ol-dot {
  border-radius: 50%;
}

/* Settled: solid green dot */
.gb-ol-settled .gb-ol-dot {
  background: var(--gb-success);
}

/* Reactive: amber ring */
.gb-ol-reactive .gb-ol-dot {
  background: transparent;
  border: 2px solid var(--gb-warning);
}

/* Suspended: dashed red ring */
.gb-ol-suspended .gb-ol-dot {
  background: transparent;
  border: 2px dashed var(--gb-danger);
}

.gb-ol-outcome {
  color: var(--gb-text-primary);
  font-weight: 700;
}

.gb-ol-arrow {
  color: var(--gb-text-caption);
}

.gb-ol-state {
  color: var(--gb-text-muted);
}

.gb-ol-kind {
  font-size: var(--gb-text-2xs);
  color: var(--gb-text-caption);
}

.gb-ol-detail {
  font-size: var(--gb-text-2xs);
  color: var(--gb-text-caption);
}

.gb-ol-empty {
  font-size: var(--gb-text-sm);
  color: var(--gb-text-caption);
  font-style: italic;
  padding: var(--gb-space-1) var(--gb-space-2);
}

/* Newest entry highlight */
.gb-ol-entry:last-child {
  background: rgba(240, 240, 242, 0.03);
}
`;
