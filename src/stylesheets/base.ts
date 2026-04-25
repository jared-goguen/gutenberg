/**
 * BASE_STYLES — Structural CSS for Gutenberg pages.
 *
 * Contains layout primitives: display, grid, flex, position, overflow,
 * z-index, pointer-events, cursor, content (pseudo-elements), @keyframes,
 * @media responsive breakpoints, @media print, scroll-behavior, accessibility,
 * animation framework orchestration, width/height for layout containers.
 *
 * Loaded before theme CSS — the cascade merges visual properties on top.
 */
export const BASE_STYLES = `/* ============================================================
   DESIGN TOKENS
   Semantic variables for consistent styling across all blocks.
   These extend chromata's theme tokens with Gutenberg-specific
   layout, spacing, and interaction primitives.
   ============================================================ */

:root {
  /* ── Opacity Scale ─────────────────────────────────────────── */
  --gb-opacity-ghost: 0.15;
  --gb-opacity-subtle: 0.35;
  --gb-opacity-muted: 0.5;
  --gb-opacity-soft: 0.65;
  --gb-opacity-visible: 0.8;

  /* ── Timing & Easing ───────────────────────────────────────── */
  --gb-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --gb-ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);

  --gb-duration-instant: 0.1s;
  --gb-duration-fast: 0.15s;
  --gb-duration-normal: 0.25s;
  --gb-duration-slow: 0.4s;
  --gb-duration-slower: 0.6s;

  /* ── Font Size Scale (minor third 1.2×) ────────────────────── */
  --gb-text-2xs: 0.65rem;
  --gb-text-xs: 0.75rem;
  --gb-text-sm: 0.85rem;
  --gb-text-base: 0.95rem;
  --gb-text-md: 1.05rem;
  --gb-text-lg: 1.15rem;
  --gb-text-xl: 1.35rem;

  /* ── Spacing Scale (4px base) ──────────────────────────────── */
  --gb-space-1: 0.25rem;
  --gb-space-2: 0.5rem;
  --gb-space-3: 0.75rem;
  --gb-space-4: 1rem;
  --gb-space-5: 1.25rem;
  --gb-space-6: 1.5rem;
  --gb-space-8: 2rem;
  --gb-space-10: 2.5rem;
  --gb-space-12: 3rem;

  /* ── Gap Aliases ───────────────────────────────────────────── */
  --gb-gap-tight: var(--gb-space-2);
  --gb-gap-normal: var(--gb-space-3);
  --gb-gap-loose: var(--gb-space-4);

  /* ── Letter Spacing Extensions ─────────────────────────────── */
  --gb-tracking-tighter: -0.03em;
  --gb-tracking-normal: 0;
  --gb-tracking-loose: 0.04em;
  --gb-tracking-wider: 0.15em;
  --gb-tracking-widest: 0.2em;

  /* ── Semantic Colors ───────────────────────────────────────── */
  --gb-success: rgb(52, 211, 153);
  --gb-warning: rgb(251, 191, 36);
  --gb-danger: rgb(248, 113, 113);

  /* ── Color Mix Intensities ─────────────────────────────────── */
  --gb-mix-ghost: 5%;
  --gb-mix-subtle: 10%;
  --gb-mix-light: 20%;
  --gb-mix-medium: 35%;
  --gb-mix-strong: 50%;
  --gb-mix-bold: 65%;
}

/* === Reset === */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

/* === Base === */
body {
  max-width: 960px;
  margin: 0 auto;
}

/* === Hero === */
.gb-hero[data-align="center"] { text-align: center; }
.gb-hero[data-align="center"] .gb-hero-body { margin-left: auto; margin-right: auto; }

/* === Section Label === */
/* Section labels introduce the next block — tighten the gap */
.gb-block:has(> .gb-section-label) { margin-bottom: 0.5rem !important; }

/* === Cards === */
.gb-cards {
  display: grid;
}
.gb-cards[data-cols="2"] { grid-template-columns: repeat(2, 1fr); }
.gb-cards[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
.gb-cards[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
.gb-cards[data-cols="5"] { grid-template-columns: repeat(5, 1fr); }
.gb-cards[data-cols="6"] { grid-template-columns: repeat(6, 1fr); }
.gb-cards[data-align="center"] .gb-card { text-align: center; }

/* === Prose === */
.gb-prose[data-align="center"] { text-align: center; }

/* === Flow Chain === */
.gb-flow-chain {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
/* Linked pills */
a.gb-pill-linked {
  cursor: pointer;
}
.gb-arrow {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

/* Join operators (+ and =) */
.gb-join {
  flex-shrink: 0;
}

/* Staggered pill entrance */
body[data-animate] .gb-visible .gb-pill {
  opacity: 0;
  animation: gb-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
body[data-animate] .gb-visible .gb-pill:nth-child(1) { animation-delay: 0.06s; }
body[data-animate] .gb-visible .gb-pill:nth-child(3) { animation-delay: 0.12s; }
body[data-animate] .gb-visible .gb-pill:nth-child(5) { animation-delay: 0.18s; }
body[data-animate] .gb-visible .gb-pill:nth-child(7) { animation-delay: 0.24s; }
body[data-animate] .gb-visible .gb-pill:nth-child(9) { animation-delay: 0.30s; }
body[data-animate] .gb-visible .gb-arrow,
body[data-animate] .gb-visible .gb-join {
  opacity: 0;
  animation: gb-fade-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
body[data-animate] .gb-visible .gb-arrow:nth-child(2),
body[data-animate] .gb-visible .gb-join:nth-child(2) { animation-delay: 0.09s; }
body[data-animate] .gb-visible .gb-arrow:nth-child(4),
body[data-animate] .gb-visible .gb-join:nth-child(4) { animation-delay: 0.15s; }
body[data-animate] .gb-visible .gb-arrow:nth-child(6),
body[data-animate] .gb-visible .gb-join:nth-child(6) { animation-delay: 0.21s; }
body[data-animate] .gb-visible .gb-arrow:nth-child(8),
body[data-animate] .gb-visible .gb-join:nth-child(8) { animation-delay: 0.27s; }
body[data-animate] .gb-visible .gb-join:nth-child(10) { animation-delay: 0.33s; }
body[data-animate] .gb-visible .gb-join:nth-child(12) { animation-delay: 0.39s; }

/* === Transform (stacked equation grid) === */
.gb-transform {
  display: flex;
  flex-direction: column;
}
.gb-transform-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  justify-items: center;
}
.gb-transform-op {
  user-select: none;
}
/* Featured hierarchy: non-featured rows recede, featured row dominates */
.gb-transform[data-has-featured] .gb-transform-row:not([data-featured]) {
  filter: brightness(0.5) saturate(0.6);
  transform: scale(0.88);
  transition: filter 0.25s ease, transform 0.25s ease;
}
.gb-transform[data-has-featured] .gb-transform-row[data-featured] {
  transform: scale(1.06);
}
.gb-transform[data-has-featured]:hover .gb-transform-row:not([data-featured]) {
  filter: brightness(0.7) saturate(0.8);
}
/* Row entrance animation */
body[data-animate] .gb-visible .gb-transform-row {
  opacity: 0;
  animation: gb-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
body[data-animate] .gb-visible .gb-transform-row:nth-child(1) { animation-delay: 0.06s; }
body[data-animate] .gb-visible .gb-transform-row:nth-child(2) { animation-delay: 0.18s; }
body[data-animate] .gb-visible .gb-transform-row:nth-child(3) { animation-delay: 0.30s; }

/* === Timeline === */
.gb-timeline-row {
  display: flex;
  align-items: stretch;
  position: relative;
}
/* Axis line through dot centers */
.gb-timeline-row::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 1.55rem;
  height: 2px;
  z-index: 0;
}
/* Traveling glow pulse */
.gb-timeline-row::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: calc(1.55rem - 2px);
  height: 6px;
  background-size: 300% 100%;
  background-position: 120% 0;
  z-index: 0;
  opacity: 0;
}
body[data-animate] .gb-visible .gb-timeline-row::after {
  opacity: 1;
  animation: gb-axis-pulse 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
}
@keyframes gb-axis-pulse {
  0% { background-position: 120% 0; opacity: 0.8; }
  70% { opacity: 0.6; }
  100% { background-position: -40% 0; opacity: 0; }
}

/* Items — date above dot, label below */
.gb-timeline-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
  min-width: 0;
}
.gb-timeline-dot {
  width: 14px;
  height: 14px;
  position: relative;
  z-index: 2;
  box-sizing: content-box;
}

/* Status treatments */
.gb-timeline-item[data-status="active"] .gb-timeline-dot {
  width: 16px;
  height: 16px;
}

/* Directional markers between items */
.gb-timeline-arrow {
  flex: 0 0 32px;
  position: relative;
  z-index: 4;
}
.gb-timeline-arrow::after {
  content: '››';
  position: absolute;
  top: 1.55rem;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}

/* Terminus */
.gb-timeline-terminus {
  flex: 0 0 60px;
}

/* Linked items: hover effects */
a.gb-timeline-item {
  cursor: pointer;
}
a.gb-timeline-item:hover {
  transform: translateY(-2px);
}
a.gb-timeline-item:hover .gb-timeline-dot {
  transform: scale(1.3);
}

/* ── Multi-track ── */
.gb-timeline[data-mode="multi"] .gb-timeline-header,
.gb-timeline[data-mode="multi"] .gb-timeline-track {
  display: grid;
  grid-template-columns: 110px repeat(var(--tl-phases), 1fr);
  align-items: center;
}
.gb-timeline-track {
  position: relative;
  min-height: 48px;
}
/* Axis line through each track row */
.gb-timeline-track::before {
  content: '';
  position: absolute;
  left: 114px;
  right: 0;
  top: 50%;
  height: 2px;
  z-index: 0;
}
.gb-timeline-track-spacer {
  /* Empty cell above track labels */
}
.gb-timeline-track-label {
  z-index: 1;
}

/* Track cells */
.gb-timeline-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
}
.gb-timeline-cell .gb-timeline-dot {
  width: 12px;
  height: 12px;
  box-sizing: content-box;
}
.gb-timeline-cell[data-status="active"] .gb-timeline-dot {
  width: 14px;
  height: 14px;
}
.gb-timeline-cell[data-status="empty"] { visibility: hidden; }

/* Linked cells */
a.gb-timeline-cell {
  cursor: pointer;
}
a.gb-timeline-cell:hover {
  transform: translateY(-2px);
}
a.gb-timeline-cell:hover .gb-timeline-dot {
  transform: scale(1.3);
}

/* Entrance animation */
body[data-animate] .gb-visible .gb-timeline-item,
body[data-animate] .gb-visible .gb-timeline-track {
  opacity: 0;
  animation: gb-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
body[data-animate] .gb-visible .gb-timeline-item:nth-child(1),
body[data-animate] .gb-visible .gb-timeline-track:nth-child(1) { animation-delay: 0.06s; }
body[data-animate] .gb-visible .gb-timeline-item:nth-child(3),
body[data-animate] .gb-visible .gb-timeline-track:nth-child(2) { animation-delay: 0.12s; }
body[data-animate] .gb-visible .gb-timeline-item:nth-child(5),
body[data-animate] .gb-visible .gb-timeline-track:nth-child(3) { animation-delay: 0.18s; }
body[data-animate] .gb-visible .gb-timeline-item:nth-child(7),
body[data-animate] .gb-visible .gb-timeline-track:nth-child(4) { animation-delay: 0.24s; }

/* === Recent === */
.gb-recent {
  display: flex;
  flex-direction: column;
}
.gb-recent-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.gb-recent-meta {
  display: flex;
  white-space: nowrap;
}

/* === Badges === */
.gb-badges {
  display: flex;
  flex-wrap: wrap;
}
.gb-badge-pill {
  display: inline-flex;
  align-items: center;
}

/* === Table === */
.gb-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
}
.gb-table th {
  text-align: left;
}
.gb-table tbody tr:last-child td { border-bottom: none; }
.gb-table th[data-size='narrow'] { width: 12%; }
.gb-table th[data-size='medium'] { width: 22%; }
.gb-table th[data-size='wide'] { width: 35%; }
.gb-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* === Matrix === */
.gb-matrix {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
}
.gb-matrix-col-header {
  text-align: center;
}
.gb-matrix-label-col {
  width: 1%;
  white-space: nowrap;
}
.gb-matrix-cell {
  text-align: center;
  vertical-align: middle;
}
.gb-matrix-cell-filled .gb-matrix-cell-label {
  display: inline-block;
  white-space: nowrap;
}
.gb-matrix-data-row:last-child .gb-matrix-cell,
.gb-matrix-data-row:last-child .gb-matrix-row-label { border-bottom: none; }

/* === TOC === */

/* === Info Box === */

/* === Diagram === */
.gb-diagram { text-align: center; }
.gb-diagram img { max-width: 100%; height: auto; }

/* === Code Block === */
.gb-code {
  overflow: hidden;
}
.gb-code-title {
  display: flex;
  align-items: center;
}
.gb-code-title-spacer { flex: 1; }
.gb-code-copy {
  cursor: pointer;
}
.gb-code pre {
  margin: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}
.gb-code code {
  background: none;
  padding: 0;
  border-radius: 0;
}

/* Line numbers via CSS counters — not copied to clipboard */
.gb-code-pre[data-line-numbers] {
  counter-reset: line;
}
.gb-code-pre[data-line-numbers] .gb-code-line::before {
  counter-increment: line;
  content: counter(line);
  position: absolute;
  left: 0;
  width: 2.5rem;
  text-align: right;
  user-select: none;
  pointer-events: none;
}
.gb-code-pre[data-line-numbers] .gb-code-line {
  position: relative;
}

/* All code lines are block-level */
.gb-code-line {
  display: block;
}

/* Collapsible code blocks */
.gb-code-summary {
  cursor: pointer;
  user-select: none;
}

/* === Code Pair === */
.gb-code-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
}
.gb-code-pair-pane {
  min-width: 0;
}
.gb-code-pair-pane .gb-code {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.gb-code-pair-pane .gb-code pre {
  flex: 1;
}

/* === Inline SVG Interactivity === */
.gb-diagram-inline .gb-diagram-svg { max-width: 100%; height: auto; }

/* Node hover */
.gb-diagram-inline .svg-node {
  cursor: pointer;
}
.gb-diagram-inline .svg-node:hover {
  transform: scale(1.02);
}

/* Click-to-select */
.gb-diagram-inline .svg-node[data-href] {
  cursor: pointer;
}
.gb-diagram-inline .svg-node:active {
  transform: scale(0.97);
}
.gb-diagram-inline .svg-node-selected {
  opacity: 1 !important;
  transform: scale(1.05);
}

/* Pulse animation for link navigation */
.gb-diagram-inline .svg-node-pulse {
  animation: gb-node-pulse 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes gb-node-pulse {
  0% { transform: scale(1); filter: brightness(1); }
  40% { transform: scale(1.08); filter: brightness(1.4) drop-shadow(0 0 20px rgba(255,255,255,0.35)); }
  100% { transform: scale(1.04); filter: brightness(1.2) drop-shadow(0 0 12px rgba(255,255,255,0.2)); }
}

/* === Scroll-triggered edge drawing animation === */
body[data-animate] .gb-diagram-inline .svg-edge line,
body[data-animate] .gb-diagram-inline .svg-edge path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge path {
  animation: gb-draw-edge 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
/* Stagger edge drawing within a diagram */
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(1) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(1) path { animation-delay: 0.1s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(2) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(2) path { animation-delay: 0.15s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(3) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(3) path { animation-delay: 0.2s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(4) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(4) path { animation-delay: 0.25s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(5) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(5) path { animation-delay: 0.3s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(6) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(6) path { animation-delay: 0.35s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(7) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(7) path { animation-delay: 0.4s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(8) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(8) path { animation-delay: 0.45s; }
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(n+9) line,
body[data-animate] .gb-visible .gb-diagram-inline .svg-edge:nth-child(n+9) path { animation-delay: 0.5s; }

@keyframes gb-draw-edge {
  to { stroke-dashoffset: 0; }
}

/* Node fade-in after edges draw */
body[data-animate] .gb-diagram-inline .svg-node {
  opacity: 0;
  transform: scale(0.9);
}
body[data-animate] .gb-visible .gb-diagram-inline .svg-node {
  animation: gb-node-appear 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards;
}
@keyframes gb-node-appear {
  to { opacity: 1; transform: scale(1); }
}

/* === Cohesion Divider === */
.gb-cohesion-divider {
  border: none;
}

/* === Density variants === */
[data-density="compact"] {
  --gb-card-padding: 0.75rem;
  --gb-card-accent: 2px;
  --gb-stat-pad: 1rem 0.75rem;
  --gb-table-cell-pad: 0.35rem 0.6rem;
  --gb-hero-pad: 2rem 1.5rem 1.5rem;
  /* Type scale: minor third 1.2× */
  --gb-type-sm: 0.833rem;
  --gb-type-base: 1rem;
  --gb-type-md: 1.2rem;
  --gb-type-lg: 1.44rem;
  --gb-type-xl: 1.728rem;
  --gb-type-2xl: 2.074rem;
  --gb-type-3xl: 2.488rem;
  --gb-type-4xl: 2.986rem;
}
[data-density="standard"] {
  --gb-card-padding: 1.25rem;
  --gb-card-accent: 3px;
  --gb-stat-pad: 1.5rem 1.25rem 1.25rem;
  --gb-table-cell-pad: 0.5rem 0.75rem;
  --gb-hero-pad: 3rem 2.5rem 2.5rem;
  /* Type scale: major third 1.25× */
  --gb-type-sm: 0.8rem;
  --gb-type-base: 1rem;
  --gb-type-md: 1.25rem;
  --gb-type-lg: 1.563rem;
  --gb-type-xl: 1.953rem;
  --gb-type-2xl: 2.441rem;
  --gb-type-3xl: 3.052rem;
  --gb-type-4xl: 3.815rem;
}
[data-density="spacious"] {
  --gb-card-padding: 1.75rem;
  --gb-card-accent: 3px;
  --gb-stat-pad: 2rem 1.75rem 1.5rem;
  --gb-table-cell-pad: 0.6rem 1rem;
  --gb-hero-pad: 4rem 3rem 3rem;
  /* Type scale: perfect fourth 1.333× */
  --gb-type-sm: 0.75rem;
  --gb-type-base: 1rem;
  --gb-type-md: 1.333rem;
  --gb-type-lg: 1.777rem;
  --gb-type-xl: 2.369rem;
  --gb-type-2xl: 3.157rem;
  --gb-type-3xl: 4.209rem;
  --gb-type-4xl: 5.612rem;
}

/* === Whole-Card Clickable (Stretched Link) === */
.gb-card-linked { position: relative; cursor: pointer; }
.gb-card-linked .gb-card-title a::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}
/* Keep inner links clickable above the overlay */
.gb-card-linked .gb-card-body a,
.gb-card-linked .gb-card-footer a {
  position: relative;
  z-index: 2;
}
/* External link indicator — appears on hover */
.gb-card-linked .gb-card-title::after {
  content: '\\2197';
  position: absolute;
  top: var(--gb-card-padding, 1.25rem);
  right: var(--gb-card-padding, 1.25rem);
  pointer-events: none;
}

/* ============================================================
   TIER 1: Interactivity, Motion, Responsiveness
   ============================================================ */

/* === Smooth Scrolling + Scroll Offset for Sticky Nav === */
html { scroll-behavior: smooth; scroll-padding-top: 3.5rem; }

/* === Fluid Typography === */
body { font-size: clamp(0.875rem, 1.5vw, 1rem); }
.gb-hero-title { font-size: clamp(1.75rem, 5vw, 2.5rem); }
.gb-hero-body { font-size: clamp(0.95rem, 2vw, 1.1rem); }

/* === Focus Indicators (Accessibility) === */
:focus-visible {
  outline: 2px solid var(--gb-text-link);
  outline-offset: 2px;
  border-radius: var(--gb-radius-sm);
}

/* === Section Label Anchors === */
.gb-section-label {
  position: relative;
  cursor: pointer;
}
.gb-section-anchor {
  display: inline-block;
  position: relative;
}
.gb-section-anchor::before {
  content: '#';
  position: absolute;
  right: calc(100% + 0.35rem);
  top: 0;
}

/* === Scroll-Triggered Entrance Animations === */
@keyframes gb-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes gb-fade-in-hero {
  from { opacity: 0; transform: translateY(12px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes gb-enter-data {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes gb-enter-prose {
  from { opacity: 0; filter: blur(2px); }
  to   { opacity: 1; filter: blur(0); }
}

/* Blocks start hidden when animate is active */
body[data-animate] .gb-block {
  opacity: 0;
}
body[data-animate] .gb-block.gb-visible {
  animation: gb-fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Hero entrance */
body[data-animate] .gb-hero {
  opacity: 0;
  animation: gb-fade-in-hero 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
}

/* Closing entrance */
body[data-animate] .gb-closing {
  opacity: 0;
}
body[data-animate] .gb-closing.gb-visible {
  animation: gb-fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Stat blocks: data personality — fast, mechanical scale */
body[data-animate] .gb-visible .gb-stats {
  animation: gb-enter-data 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
/* Staggered stat item reveal */
body[data-animate] .gb-visible .gb-stat {
  opacity: 0;
  animation: gb-enter-data 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
body[data-animate] .gb-visible .gb-stat:nth-child(1) { animation-delay: 0.04s; }
body[data-animate] .gb-visible .gb-stat:nth-child(2) { animation-delay: 0.08s; }
body[data-animate] .gb-visible .gb-stat:nth-child(3) { animation-delay: 0.12s; }
body[data-animate] .gb-visible .gb-stat:nth-child(4) { animation-delay: 0.16s; }
body[data-animate] .gb-visible .gb-stat:nth-child(5) { animation-delay: 0.20s; }

/* Prose blocks: text personality — gentle blur clear */
body[data-animate] .gb-visible .gb-prose {
  animation: gb-enter-prose 0.6s ease forwards;
}

/* Staggered card reveal within a visible block */
body[data-animate] .gb-visible .gb-card {
  opacity: 0;
  animation: gb-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
body[data-animate] .gb-visible .gb-card:nth-child(1) { animation-delay: 0.04s; }
body[data-animate] .gb-visible .gb-card:nth-child(2) { animation-delay: 0.08s; }
body[data-animate] .gb-visible .gb-card:nth-child(3) { animation-delay: 0.12s; }
body[data-animate] .gb-visible .gb-card:nth-child(4) { animation-delay: 0.16s; }
body[data-animate] .gb-visible .gb-card:nth-child(5) { animation-delay: 0.20s; }
body[data-animate] .gb-visible .gb-card:nth-child(6) { animation-delay: 0.24s; }

/* === Reduced Motion: Disable Everything === */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  body[data-animate] .gb-block,
  body[data-animate] .gb-hero,
  body[data-animate] .gb-closing,
  body[data-animate] .gb-visible .gb-card,
  body[data-animate] .gb-visible .gb-stat,
  body[data-animate] .gb-hero-accent {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }
  .gb-card, .gb-pill, .gb-section-label, .gb-stat, .gb-arrow, .gb-join, .gb-transform-op,
  .gb-diagram-inline .svg-node,
  .gb-diagram-inline .svg-edge,
  .gb-diagram-inline .svg-group {
    transition: none !important;
  }
  body[data-animate] .gb-visible .gb-pill,
  body[data-animate] .gb-visible .gb-arrow,
  body[data-animate] .gb-visible .gb-join,
  body[data-animate] .gb-visible .gb-transform-row,
  body[data-animate] .gb-visible .gb-prose,
  body[data-animate] .gb-visible .gb-stats {
    opacity: 1 !important;
    animation: none !important;
    filter: none !important;
  }
  body[data-animate] .gb-diagram-inline .svg-node,
  body[data-animate] .gb-diagram-inline .svg-edge line,
  body[data-animate] .gb-diagram-inline .svg-edge path {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
    stroke-dasharray: none !important;
    stroke-dashoffset: 0 !important;
  }
  /* Showcase effects */
  .gb-hero-mesh { animation: none !important; opacity: 0.8 !important; }
  .gb-hero-particles { display: none !important; }
  [data-reveal] .gb-reveal-unit {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    animation: none !important;
  }
}

/* === Stat Block === */
.gb-stats {
  display: grid;
}
.gb-stats[data-cols="2"] { grid-template-columns: repeat(2, 1fr); }
.gb-stats[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
.gb-stats[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
.gb-stats[data-cols="5"] { grid-template-columns: repeat(5, 1fr); }

/* === Page Navigation (Sticky) === */
.gb-page-nav {
  display: flex;
  align-items: center;
  position: sticky;
  top: 0.75rem;
  z-index: 50;
  overflow-x: auto;
  scrollbar-width: none;
}
.gb-page-nav::-webkit-scrollbar { display: none; }
.gb-page-nav-link {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

/* Vertical separator between section groups */
.gb-page-nav-sep {
  width: 1px;
  height: 0.85rem;
  flex-shrink: 0;
}

/* === Card Badges === */
.gb-card-badges {
  display: flex;
  flex-wrap: wrap;
}
.gb-card-badge {
  display: inline-flex;
  align-items: center;
}

/* === Wide Cards === */
.gb-card[data-size="wide"] {
  grid-column: span 2;
}

/* === Bento Grid Sizing === */
.gb-card[data-size="tall"] {
  grid-row: span 2;
  display: flex;
  flex-direction: column;
}
.gb-card[data-size="tall"] .gb-card-body { flex: 1; }
.gb-card[data-size="large"] {
  grid-column: span 2;
  grid-row: span 2;
  display: flex;
  flex-direction: column;
}
.gb-card[data-size="large"] .gb-card-body { flex: 1; }

/* ============================================================
   SHOWCASE: Premium visual effects (progressive enhancement)
   ============================================================ */

/* === Full-Viewport Hero (superhero) === */
.gb-hero[data-size="full"] {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* Scroll indicator */
.gb-hero-scroll {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  animation: gb-scroll-hint 2.5s var(--gb-ease-in-out) infinite;
}
@keyframes gb-scroll-hint {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: var(--gb-opacity-subtle); }
  50% { transform: translateX(-50%) translateY(8px); opacity: var(--gb-opacity-visible); }
}
@media (prefers-reduced-motion: reduce) {
  .gb-hero-scroll { animation: none; opacity: var(--gb-opacity-soft); }
}

/* === Hero Title Stomp === */
.gb-hero-letter { display: inline-block; }
.gb-hero-emoji { color: initial; -webkit-text-fill-color: initial; }

/* === Hero Mesh Effect === */
.gb-hero[data-effect~="mesh"] .gb-hero-mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  animation: gb-mesh-drift 12s ease-in-out infinite alternate;
}
@keyframes gb-mesh-drift {
  0%   { transform: translate(0, 0) scale(1); opacity: var(--gb-opacity-muted); }
  25%  { transform: translate(3%, -2%) scale(1.02); opacity: var(--gb-opacity-soft); }
  50%  { transform: translate(-2%, 3%) scale(0.98); opacity: var(--gb-opacity-visible); }
  75%  { transform: translate(1%, 1%) scale(1.01); opacity: var(--gb-opacity-soft); }
  100% { transform: translate(-1%, -1%) scale(1); opacity: var(--gb-opacity-soft); }
}

/* === Hero Particles Effect === */
.gb-hero-particles {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Content above both mesh and particles */
.gb-hero[data-effect] .gb-hero-eyebrow,
.gb-hero[data-effect] .gb-hero-title,
.gb-hero[data-effect] .gb-hero-body,
.gb-hero[data-effect] .gb-hero-accent {
  position: relative;
  z-index: 2;
}

/* === Superhero → Content Transition === */
.gb-hero-transition {
  height: 8rem;
  margin-top: -4rem;
  position: relative;
  z-index: 3;
  pointer-events: none;
}

/* === Brutalist Superhero Enhancements === */
.gb-hero-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.gb-hero-tagline-row {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.gb-hero-tagline-line {
  flex: 1;
  height: 1px;
}

/* Brutalist title container */
.gb-hero[data-size="full"] .gb-hero-title-container,
.gb-hero-title-container {
  position: relative;
  z-index: 1;
}

/* Override the base title when inside a title-container (brutalist mode) */
.gb-hero[data-size="full"] .gb-hero-title-container .gb-hero-title {
  user-select: none;
  max-width: none !important;
  background: none !important;
  -webkit-background-clip: unset !important;
  animation: none !important;
  opacity: 1 !important;
  margin-bottom: 0 !important;
}

/* Suppress theme border/background on full-viewport superhero */
.gb-hero[data-size="full"] {
  border: none !important;
  cursor: crosshair;
}

.gb-hero[data-size="full"] .gb-hero-title-fill {
  position: absolute;
  inset: 0;
  pointer-events: none;
  animation: none !important;
}

.gb-hero[data-size="full"]:hover .gb-hero-title-fill {
  clip-path: inset(0 0% 0 0);
}

/* Title-length tiers */
.gb-hero-descriptors {
  position: absolute;
  bottom: 20vh;
  left: 4vw;
  right: 4vw;
  z-index: 2;
  display: flex;
}

.gb-hero-descriptor {
  flex: 1;
  opacity: 0;
  transform: translateY(20px);
}

.gb-hero:hover .gb-hero-descriptor {
  opacity: 1;
  transform: translateY(0);
}

/* Override the base .gb-hero-scroll when we have the brutalist scroll label */
.gb-hero[data-size="full"] .gb-hero-scroll:has(.gb-hero-scroll-label) {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: auto;
  height: auto;
  border: none;
  border-radius: 0;
  opacity: 1;
  animation: none;
}

.gb-hero[data-size="full"] .gb-hero-scroll:has(.gb-hero-scroll-label):hover {
  transform: translateX(-50%) scale(1.1);
  border: none;
}

.gb-hero-scroll-ring {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gb-hero-scroll-ring::before {
  content: '';
  position: absolute;
  inset: -6px;
  animation: gb-pulse-ring 2s ease-out infinite;
}

.gb-hero-scroll-arrow {
  width: 24px;
  height: 24px;
  animation: gb-bounce-arrow 1.5s ease-in-out infinite;
}

@keyframes gb-pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes gb-bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

/* Override accent bar in full superhero */
.gb-hero[data-size="full"] .gb-hero-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  transform: scaleX(0);
  transform-origin: left;
}

.gb-hero[data-size="full"]:hover .gb-hero-accent {
  transform: scaleX(1);
}

/* === Navigation Cards === */
.gb-nav-cards {
  display: grid;
}

.gb-nav-cards[data-cols="2"] { grid-template-columns: repeat(2, 1fr); }
.gb-nav-cards[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }

.gb-nav-card {
  display: flex;
  flex-direction: column;
  position: relative;
}

.gb-nav-card-arrow {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

/* === Gradient Border Glow === */
.gb-cards[data-border="glow"] .gb-card {
  position: relative;
  border-bottom: none;
  overflow: hidden;
}
.gb-cards[data-border="glow"] .gb-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  z-index: -1;
}
.gb-cards[data-border="glow"] .gb-card::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  z-index: -1;
}

/* === Noise Texture Overlay === */
.gb-texture-defs {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
}
@media (prefers-reduced-motion: reduce) {
  .gb-texture-defs { opacity: 0.02; }
}

/* === Word/Line Reveal Animation === */
[data-reveal] .gb-reveal-unit {
  display: inline-block;
  opacity: 0;
  transform: translateY(8px);
}
[data-reveal].gb-revealing .gb-reveal-unit {
  animation: gb-reveal-word 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
[data-reveal="lines"] .gb-reveal-unit {
  display: block;
  transform: translateY(16px);
}
@keyframes gb-reveal-word {
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

/* === Narrative (Sticky-Scroll Storytelling) === */
.gb-narrative {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  min-height: 60vh;
}
.gb-narrative-pinned {
  position: sticky;
  top: 50%;
  transform: translateY(-50%);
  align-self: start;
}
.gb-narrative-steps {
  display: flex;
  flex-direction: column;
}
.gb-narrative-step {
  display: flex;
}
.gb-narrative-step-marker {
  flex-shrink: 0;
  width: 3px;
  min-height: 2rem;
}
.gb-narrative-step-content { flex: 1; }
.gb-narrative-step-img {
  max-width: 100%;
  height: auto;
}
.gb-narrative-step-code {
  overflow-x: auto;
  white-space: pre;
}
.gb-narrative-pinned-img {
  max-width: 100%;
  height: auto;
}

/* === Diagram reveal=fade disables edge drawing === */
.gb-diagram[data-reveal="fade"] .svg-edge line,
.gb-diagram[data-reveal="fade"] .svg-edge path {
  stroke-dasharray: none !important;
  stroke-dashoffset: 0 !important;
  animation: none !important;
}
.gb-diagram[data-reveal="fade"] .svg-node {
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}

/* === Print Stylesheet === */
@media print {
  body {
    max-width: 100% !important;
  }
  .gb-page-nav, .gb-progress-bar, .gb-rail-toc { display: none !important; }
  .gb-hero, .gb-section-label, .gb-card, .gb-stat,
  .gb-flow-chain, .gb-transform, .gb-info-box, .gb-toc, .gb-timeline {
    break-inside: avoid;
  }
  .gb-hero::before { display: none; }
  .gb-card {
    transform: none !important;
  }
  .gb-card-linked .gb-card-title::after { content: none; }
  .gb-diagram-svg, .gb-diagram img { max-width: 100% !important; }
  .gb-closing::before { display: none; }
  /* Narrative print */
  .gb-narrative {
    display: block !important;
  }
  .gb-narrative-pinned {
    position: relative !important;
  }
  .gb-narrative-step {
    opacity: 1 !important;
  }
  .gb-narrative-indicator {
    display: none !important;
  }
  /* Transform print */
  .gb-transform-row {
    filter: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
  /* Diagram break-inside */
  .gb-diagram {
    break-inside: avoid;
  }
  /* Code print */
  .gb-code {
    break-inside: avoid;
  }
  .gb-code-copy {
    display: none !important;
  }
  /* Disable all animations */
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
  .gb-sidebar, .gb-right-rail { display: none !important; }
  .gb-layout { grid-template-columns: 1fr !important; }
}

/* === Enhanced Hero === */
.gb-hero {
  position: relative;
  overflow: hidden;
}
.gb-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* === Enhanced Closing === */
.gb-closing {
  position: relative;
}
.gb-closing::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 10%;
  right: 10%;
  height: 1px;
}

/* ============================================================
   SITE LAYOUT: Sidebar navigation + content grid
   ============================================================ */

/* Override body styles when sidebar is present */
body[data-layout="sidebar"] {
  max-width: none;
  padding: 0;
}

.gb-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 220px;
  min-height: 100vh;
}

.gb-content {
  max-width: 960px;
  margin: 0 auto;
  min-width: 0;
}

/* === Reading Progress Bar === */
.gb-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  transform-origin: left;
  transform: scaleX(0);
  z-index: 200;
  pointer-events: none;
  animation: gb-progress-grow linear both;
  animation-timeline: scroll();
}
@keyframes gb-progress-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@supports not (animation-timeline: scroll()) {
  .gb-progress-bar { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .gb-progress-bar { display: none; }
}

/* === Breadcrumbs === */
.gb-breadcrumbs ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
}
.gb-crumb {
  display: inline-flex;
  align-items: center;
}
.gb-crumb:not(:last-child)::after {
  content: "/";
}

/* === Page Footer (Prev/Next) === */
.gb-page-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.gb-page-footer-link {
  display: flex;
  flex-direction: column;
}
.gb-page-footer-next {
  text-align: right;
  align-items: flex-end;
}

/* === Right Rail === */
.gb-right-rail {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: none;
}
.gb-right-rail::-webkit-scrollbar { display: none; }

/* Right-rail TOC */
.gb-rail-toc {
  position: relative;
  display: flex;
  flex-direction: column;
}
.gb-rail-track {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
}
.gb-rail-indicator {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 0;
}
.gb-rail-link {
  display: block;
}

/* === View Transitions === */
@view-transition { navigation: auto; }
.gb-sidebar { view-transition-name: sidebar; }
.gb-content { view-transition-name: content; }
.gb-right-rail { view-transition-name: right-rail; }
::view-transition-old(sidebar),
::view-transition-new(sidebar),
::view-transition-old(right-rail),
::view-transition-new(right-rail) {
  animation: none;
}
::view-transition-old(content) {
  animation: gb-vt-fade-out 0.15s ease-in both;
}
::view-transition-new(content) {
  animation: gb-vt-fade-in 0.2s ease-out 0.1s both;
}
@keyframes gb-vt-fade-out { to { opacity: 0; } }
@keyframes gb-vt-fade-in { from { opacity: 0; } }

/* === Sidebar === */
.gb-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: thin;
}
.gb-sidebar::-webkit-scrollbar { width: 4px; }
.gb-sidebar::-webkit-scrollbar-track { background: transparent; }

.gb-sidebar-nav {
  display: flex;
  flex-direction: column;
}

/* Child links container */
.gb-sidebar-pages {
  display: flex;
  flex-direction: column;
}

/* Depth-aware nested containers */
.gb-sidebar-pages[data-depth="1"] {
  padding-left: 0.4rem;
  margin-left: 0.4rem;
  margin-top: 0.05rem;
  border-left: none;
}
.gb-sidebar-pages[data-depth="2"] {
  padding-left: 0.3rem;
  margin-left: 0.2rem;
  margin-top: 0.05rem;
  border-left: none;
}

/* === Domain Grid === */
.gb-domain-grid {
  display: grid;
  align-items: start;
}
.gb-domain-grid[data-cols="1"] { grid-template-columns: 1fr; }
.gb-domain-grid[data-cols="2"] { grid-template-columns: repeat(2, 1fr); }
.gb-domain-grid[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
.gb-domain-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
.gb-domain-cell {
  display: flex;
  flex-direction: column;
}
.gb-domain-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}
.gb-domain-atoms {
  display: flex;
  flex-wrap: wrap;
}
.gb-atom-pill {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.gb-atom-name {
  display: block;
}
.gb-atom-desc {
  display: block;
}
/* Entrance animation */
body[data-animate] .gb-visible .gb-domain-cell {
  animation: gb-fade-up 0.3s ease both;
}
body[data-animate] .gb-visible .gb-domain-cell:nth-child(1) { animation-delay: 0.04s; }
body[data-animate] .gb-visible .gb-domain-cell:nth-child(2) { animation-delay: 0.08s; }
body[data-animate] .gb-visible .gb-domain-cell:nth-child(3) { animation-delay: 0.12s; }
body[data-animate] .gb-visible .gb-domain-cell:nth-child(4) { animation-delay: 0.16s; }
body[data-animate] .gb-visible .gb-domain-cell:nth-child(5) { animation-delay: 0.20s; }
body[data-animate] .gb-visible .gb-domain-cell:nth-child(6) { animation-delay: 0.24s; }

/* === Responsive Breakpoints === */
@media (max-width: 1024px) {
  .gb-layout { grid-template-columns: 1fr; }
  .gb-sidebar, .gb-right-rail { display: none; }
  body[data-layout="sidebar"] {
    max-width: 960px;
    margin: 0 auto;
  }
  .gb-content {
    max-width: none;
    padding: 0;
  }
}
@media (max-width: 768px) {
  .gb-cards[data-cols="3"],
  .gb-cards[data-cols="4"],
  .gb-cards[data-cols="5"],
  .gb-cards[data-cols="6"] {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
  .gb-stats[data-cols="3"],
  .gb-stats[data-cols="4"],
  .gb-stats[data-cols="5"] {
    grid-template-columns: repeat(2, 1fr);
  }
  .gb-card[data-size="wide"],
  .gb-card[data-size="large"] { grid-column: span 1; }
  .gb-card[data-size="tall"],
  .gb-card[data-size="large"] { grid-row: span 1; }
  .gb-domain-grid[data-cols="3"],
  .gb-domain-grid[data-cols="4"] {
    grid-template-columns: repeat(2, 1fr);
  }
  .gb-code-pair {
    grid-template-columns: 1fr;
  }
  /* Timeline: single-track wraps to column */
  .gb-timeline-row {
    flex-direction: column;
    align-items: center;
  }
  .gb-timeline-row::before {
    top: 0;
    bottom: 0;
    left: 50%;
    right: auto;
    width: 2px;
    height: auto;
  }
  .gb-timeline-arrow {
    flex: 0 0 16px;
  }
  /* Timeline: multi-track collapses to stacked rows */
  .gb-timeline[data-mode="multi"] .gb-timeline-header { display: none; }
  .gb-timeline[data-mode="multi"] .gb-timeline-track {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }
  .gb-timeline[data-mode="multi"] .gb-timeline-track::before { display: none; }
  .gb-timeline-track-label {
    border-right: none;
  }
  /* Narrative responsive */
  .gb-narrative {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .gb-narrative-pinned {
    position: relative;
    top: auto;
  }
  .gb-narrative-step { opacity: 1; }
  /* Hero descriptors */
  .gb-hero-descriptors {
    flex-direction: column;
  }
  .gb-nav-cards[data-cols="2"],
  .gb-nav-cards[data-cols="3"] {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .gb-cards[data-cols="2"],
  .gb-cards[data-cols="3"],
  .gb-cards[data-cols="4"],
  .gb-cards[data-cols="5"],
  .gb-cards[data-cols="6"] {
    grid-template-columns: 1fr;
  }
  .gb-stats[data-cols="2"],
  .gb-stats[data-cols="3"],
  .gb-stats[data-cols="4"],
  .gb-stats[data-cols="5"] {
    grid-template-columns: repeat(2, 1fr);
  }
  .gb-domain-grid[data-cols="2"],
  .gb-domain-grid[data-cols="3"],
  .gb-domain-grid[data-cols="4"] {
    grid-template-columns: 1fr;
  }
  .gb-flow-chain {
    flex-direction: column;
    align-items: flex-start;
  }
  .gb-arrow { transform: rotate(90deg); }
  .gb-transform-row {
    grid-template-columns: auto auto auto;
    grid-template-rows: auto auto;
  }
  /* On mobile: input spans full width on its own row */
  .gb-transform-row .gb-pill:first-child {
    grid-column: 1 / -1;
    justify-self: start;
  }
}

/* === Gantt Chart === */
.gb-block:has(> .gb-gantt) { max-width: 80rem; }
.gb-gantt {
  display: grid;
  overflow-x: auto;
}
.gb-gantt-header {
  display: grid;
  position: sticky;
  top: 0;
  z-index: 2;
}
.gb-gantt-body {
  display: flex;
  flex-direction: column;
}
.gb-gantt-group-row,
.gb-gantt-item-row {
  display: grid;
  min-height: 2rem;
  align-items: center;
}
.gb-gantt-label-col {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gb-gantt-milestone-row {
  display: grid;
  align-items: center;
  min-height: 1.6rem;
}
.gb-gantt-milestone-marker {
  display: flex;
  align-items: center;
  justify-content: center;
}
.gb-gantt-diamond {
  display: inline-block;
  transform: rotate(45deg);
  vertical-align: middle;
  flex-shrink: 0;
  z-index: 1;
}
.gb-gantt-milestones {
  display: flex;
  flex-wrap: wrap;
  overflow: visible;
}
.gb-gantt-milestone-tag {
  display: inline-flex;
  align-items: center;
}
.gb-gantt-milestone-tag .gb-gantt-diamond {
  flex-shrink: 0;
}

/* === App Shell === */
.gb-content:has(.gb-app-shell) {
  max-width: none;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.gb-block:has(> .gb-app-shell) {
  max-width: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.gb-app-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.gb-shell-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* === Wired Diagram === */
.gb-wired-diagram {
  max-width: none;
  overflow: visible;
  width: calc(100vw - 440px) !important;
  margin-left: calc(50% - 50vw + 220px);
}

.gb-wd-canvas {
  position: relative;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .gb-wired-diagram {
    width: 100%;
    margin-left: 0;
  }
}

.gb-wd-zone {
  position: absolute;
  box-sizing: border-box;
  z-index: 1;
}

.gb-wd-zone:hover {
  z-index: 2;
}

.gb-wd-zone-label {
  position: absolute;
  top: 10px;
  left: 18px;
}

.gb-wd-atom {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gb-wd-annotation {
  position: absolute;
  bottom: 6px;
  left: 18px;
  right: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gb-wd-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.gb-wd-wire-label {
  text-anchor: middle;
  dominant-baseline: auto;
}

@media (max-width: 768px) {
  .gb-domain-grid {
    grid-template-columns: 1fr !important;
  }
}

/* === Active state ring (state-machine diagram) === */
.svg-sm-active-ring {
  animation: gb-sm-pulse 2s ease-in-out infinite;
}

@keyframes gb-sm-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: var(--gb-opacity-muted); }
}

/* === Action bar === */
.gb-action-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.gb-ab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
}

/* === Outcome log === */
.gb-ol-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.gb-ol-entry {
  display: flex;
  align-items: center;
}

.gb-ol-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}

.gb-ol-kind {
  margin-left: auto;
}

/* ── Tracker ──────────────────────────────────────────────── */

.gb-tracker {
  display: grid;
  grid-template-columns: repeat(var(--tracker-cols, 3), 1fr);
  gap: 1.25rem 1rem;
}

.gb-tracker-caption {
  grid-column: 1 / -1;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, currentColor 45%, transparent);
  margin-bottom: 0.25rem;
}

.gb-tracker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.75rem 0.25rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.gb-tracker-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, currentColor 50%, transparent);
  margin-top: 0.5rem;
}

/* ── Tracker: Rating Scale ─────────────────────────────────── */
/* 5-segment horizontal bar. Selected segment filled with polarity color. */
/* Neutral (3) always has a tick mark as reference point. */

.gb-tracker-rating .gb-tracker-value {
  width: 100%;
}

.gb-tracker-scale {
  display: flex;
  gap: 3px;
  width: 100%;
}

.gb-tracker-seg {
  flex: 1;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: color-mix(in srgb, currentColor 10%, transparent);
  border-radius: 2px;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
}

/* Neutral marker — always visible as the baseline reference */
.gb-tracker-neutral::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 2px;
  background: currentColor;
  opacity: 0.35;
}

/* Active segment: view mode (static) */
.gb-tracker-active {
  background: color-mix(in srgb, var(--scale-color) calc(var(--scale-intensity, 0.3) * 100%), transparent);
  box-shadow: 0 0 calc(var(--scale-intensity, 0) * 16px)
    color-mix(in srgb, var(--scale-color) calc(var(--scale-intensity, 0) * 50%), transparent);
}

/* Override neutral tick color when active */
.gb-tracker-active.gb-tracker-neutral::after {
  background: currentColor;
  opacity: 0.5;
}

/* ── Edit mode: radio-button segments ─────────────────────── */

.gb-tracker-scale input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

/* Edit: selected segment — uses CSS :has() to derive color from polarity */
.gb-tracker-scale-edit input:checked + .gb-tracker-seg {
  background: color-mix(in srgb, var(--scale-color) calc(var(--scale-intensity, 0.3) * 100%), transparent);
  box-shadow: 0 0 calc(var(--scale-intensity, 0) * 16px)
    color-mix(in srgb, var(--scale-color) calc(var(--scale-intensity, 0) * 50%), transparent);
}

/* Live color update: CSS :has() switches --scale-color when user taps a segment */
.gb-tracker-scale-edit:has(input[value="1"]:checked) { --scale-color: var(--scale-low); --scale-intensity: 1; }
.gb-tracker-scale-edit:has(input[value="2"]:checked) { --scale-color: var(--scale-low); --scale-intensity: 0.65; }
.gb-tracker-scale-edit:has(input[value="3"]:checked) { --scale-color: var(--tracker-accent); --scale-intensity: 0.3; }
.gb-tracker-scale-edit:has(input[value="4"]:checked) { --scale-color: var(--scale-high); --scale-intensity: 0.65; }
.gb-tracker-scale-edit:has(input[value="5"]:checked) { --scale-color: var(--scale-high); --scale-intensity: 1; }

/* Edit: hover feedback */
.gb-tracker-scale-edit label.gb-tracker-seg {
  cursor: pointer;
}
.gb-tracker-scale-edit label.gb-tracker-seg:hover {
  background: color-mix(in srgb, var(--scale-color, currentColor) 25%, transparent);
  transform: scale(1.1);
}
.gb-tracker-scale-edit label.gb-tracker-seg:active {
  transform: scale(0.95);
}

/* Edit: keyboard focus */
.gb-tracker-scale-edit input:focus-visible + .gb-tracker-seg {
  outline: 2px solid var(--gb-text-link, rgb(93,143,255));
  outline-offset: 2px;
}

/* Responsive: square segments on mobile */
@media (max-width: 600px) {
  .gb-tracker-seg { aspect-ratio: 1; }
}

/* ── Tracker: Toggle ──────────────────────────────────────── */

.gb-tracker-toggle .gb-tracker-pill {
  display: inline-block;
  padding: 0.375rem 1.125rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}

.gb-tracker-toggle[data-active="true"] .gb-tracker-pill {
  background: color-mix(in srgb, var(--tracker-accent) 18%, transparent);
  color: var(--tracker-accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--tracker-accent) 15%, transparent);
}

.gb-tracker-toggle[data-active="false"] .gb-tracker-pill {
  background: color-mix(in srgb, currentColor 6%, transparent);
  color: color-mix(in srgb, currentColor 30%, transparent);
}

/* ── Tracker: Text ────────────────────────────────────────── */

.gb-tracker-text .gb-tracker-value {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.2;
}

/* ── Tracker: Responsive ──────────────────────────────────── */

@media (max-width: 600px) {
  .gb-tracker {
    grid-template-columns: repeat(2, 1fr);
  }
  .gb-tracker-rating .gb-tracker-value {
    font-size: 2rem;
  }
}
`;
