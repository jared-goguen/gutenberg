/**
 * Visual lint: check PageSpec for visual rhythm and polish.
 *
 * Runs on the PageSpec (YAML-level) — before compilation.
 *
 * ── Rhythm ──
 * V1: Prose density     — 4+ consecutive prose blocks without visual break
 * V2: Section variety   — text-only sections with 3+ blocks
 * V3: Block variety     — page has zero visual block types
 *
 * ── Color ──
 * V4: Color intent      — cards with no scheme or per-item colors
 *
 * ── Content ──
 * V5: Thin cards        — card items with title but no body
 * V6: Stubby flow chain — flow_chain with <3 steps
 *
 * ── Structure ──
 * V7: Missing opening   — no prose before first section_label
 * V8: Frame gaps        — hero without body, or no closing frame
 * V9: Anemic section    — non-final section with ≤1 content block
 * V10: Section balance  — largest section 10x+ bigger than smallest
 *
 * ── Repetition ──
 * V11: Layout monotony  — all card rows have identical column count
 *
 * ── Density ──
 * V15: Caption stacking  — section where >60% of prose uses role:caption
 * V16: Section density   — 6+ consecutive sections each with ≤4 content blocks
 * V17: Scheme fragmentation — section has 5+ blocks with different scheme overrides
 * V18: Identical consecutive — 3+ same block type back-to-back
 *
 * ── Hygiene ──
 * V20: No title          — specs should not include a title field
 *
 * ── Color monotony ──
 * V22: Color reset monotony — 2+ colored blocks with no explicit tone/progression
 *
 * ── Markup hygiene ──
 * V23: Presentational markup — markdown bold/italic, <strong>/<b>, inline style=
 *
 * ── Escape hygiene ──
 * V24: Escape artifacts — backslash-quote from YAML authoring errors
 *
 * ── Card hygiene ──
 * V25: Card link coverage — >50% of card items have no link
 * V26: Card body density  — card item body exceeds 30 words
 * V27: Card block density — total word count across all items exceeds budget
 */

import type { PageSpec, SpecBlock, CardsSpec, CardItemSpec, FlowChainSpec, ProseSpec, TableSpec, Cohesion } from "./types.js";
import { blockType, blockValue, normalizeBlock } from "./types.js";

function getBlockCohesion(block: SpecBlock): Cohesion | undefined {
  const val = blockValue(block);
  if (val && typeof val === "object" && "cohesion" in (val as Record<string, unknown>)) {
    return (val as Record<string, unknown>).cohesion as Cohesion;
  }
  return undefined;
}

// ── Types ────────────────────────────────────────────────────

export interface VisualLintIssue {
  check: string;
  severity: "error" | "warning" | "info";
  message: string;
  block?: number;
}

// ── Block classification ─────────────────────────────────────

const VISUAL_TYPES = new Set([
  "cards", "table", "flow_chain", "swatch_strip",
  "badge", "info_box", "callout", "install", "toc", "raw", "macro",
  "transform", "stat",
]);

const VARIETY_TYPES = new Set([
  "cards", "table", "flow_chain", "swatch_strip",
  "badge", "info_box", "callout", "install",
]);

const PROSE_TYPES = new Set(["prose"]);

// ── Public API ───────────────────────────────────────────────

export function visualLint(
  spec: PageSpec,
  enabled?: Set<string>,
): VisualLintIssue[] {
  const issues: VisualLintIssue[] = [];
  const blocks = spec.blocks.map(normalizeBlock);

  const checks: [string, (b: SpecBlock[], s: PageSpec, i: VisualLintIssue[]) => void][] = [
    ["V1", checkProseDensity],
    ["V2", checkSectionVariety],
    ["V3", checkBlockVariety],
    ["V4", checkColorIntent],
    ["V5", checkThinCards],
    ["V6", checkStubbyFlowChain],
    ["V7", checkMissingOpening],
    ["V8", checkFrameGaps],
    ["V9", checkAnemicSection],
    ["V10", checkSectionBalance],
    ["V11", checkLayoutMonotony],
    ["V15", checkCaptionStacking],
    ["V16", checkSectionDensity],
    ["V17", checkSchemeFragmentation],
    ["V18", checkIdenticalConsecutive],
    ["V20", checkNoTitle],
    ["V22", checkColorResetMonotony],
    ["V23", checkPresentationalMarkup],
    ["V24", checkEscapeArtifacts],
    ["V25", checkCardLinkCoverage],
    ["V26", checkCardBodyDensity],
    ["V27", checkCardBlockDensity],
  ];

  for (const [id, fn] of checks) {
    if (!enabled || enabled.has(id)) {
      fn(blocks, spec, issues);
    }
  }

  return issues;
}

// ── V1: Prose density ────────────────────────────────────────

function isProseBlock(block: SpecBlock): boolean {
  return blockType(block) === "prose";
}

function checkProseDensity(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  let runStart = -1;
  let runEnd = -1;
  let runLength = 0;

  const flush = () => {
    if (runLength >= 4) {
      issues.push({
        check: "V1-prose-density",
        severity: "warning",
        message: `${runLength} consecutive prose blocks (blocks ${runStart}–${runEnd}) without visual break`,
        block: runStart,
      });
    }
    runLength = 0;
  };

  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);

    if (isProseBlock(blocks[i])) {
      if (runLength > 0 && getBlockCohesion(blocks[i])) {
        flush();
      }
      if (runLength === 0) runStart = i;
      runEnd = i;
      runLength++;
    } else if (type === "section_label" || type === "heading" || VISUAL_TYPES.has(type)) {
      flush();
    }
  }
  flush();
}

// ── V2: Section variety ──────────────────────────────────────

function checkSectionVariety(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  let sectionStart = 0;
  let sectionLabel = "(opening)";

  const checkSection = (start: number, end: number, label: string) => {
    let contentCount = 0;
    let hasVisual = false;
    let hasCohesion = false;
    for (let i = start; i < end; i++) {
      const type = blockType(blocks[i]);
      contentCount++;
      if (VISUAL_TYPES.has(type)) hasVisual = true;
      if (getBlockCohesion(blocks[i])) hasCohesion = true;
    }

    if (contentCount >= 3 && !hasVisual && !hasCohesion) {
      issues.push({
        check: "V2-section-variety",
        severity: "warning",
        message: `Section "${label}" has ${contentCount} content blocks with no visual element`,
        block: start,
      });
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) === "section_label") {
      checkSection(sectionStart, i, sectionLabel);
      sectionStart = i + 1;
      const val = blockValue(blocks[i]);
      sectionLabel = typeof val === "string" ? val : (val as { text: string }).text;
    }
  }
  checkSection(sectionStart, blocks.length, sectionLabel);
}

// ── V3: Block variety ────────────────────────────────────────

function checkBlockVariety(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  const found = new Set<string>();
  for (const block of blocks) {
    const type = blockType(block);
    if (VARIETY_TYPES.has(type)) found.add(type);
  }
  if (found.size === 0) {
    issues.push({
      check: "V3-block-variety",
      severity: "warning",
      message: "Page has no visual elements — all content is prose",
    });
  }
}

// ── V4: Color intent ─────────────────────────────────────────

function checkColorIntent(blocks: SpecBlock[], spec: PageSpec, issues: VisualLintIssue[]): void {
  const hasPageScheme = !!spec.theme;
  const hasCohesionSignal = !!(spec.pace || spec.weight) ||
    blocks.some(b => blockType(b) === "cards" && getBlockCohesion(b));

  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);
    if (type !== "cards") continue;

    const val = blockValue(blocks[i]) as CardsSpec;
    if (hasPageScheme) continue;
    if ("scheme" in val && val.scheme) continue;
    if (hasCohesionSignal) continue;

    const hasTonal = ("tone" in val && val.tone) || ("progression" in val && val.progression);
    if (!hasTonal) {
      issues.push({
        check: "V4-color-intent",
        severity: "warning",
        message: `cards at block ${i} has no scheme and no per-item colors — cards will be gray`,
        block: i,
      });
    }
  }
}

// ── V5: Thin cards ───────────────────────────────────────────

function checkThinCards(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);
    if (type !== "cards") continue;

    const val = blockValue(blocks[i]) as CardsSpec;
    const items = val.items as CardItemSpec[];
    if (items.length === 0) continue;

    const thin = items.filter((item) => item.title && !item.body);
    if (thin.length > items.length / 2) {
      issues.push({
        check: "V5-thin-cards",
        severity: "warning",
        message: `cards at block ${i}: ${thin.length}/${items.length} cards have no body — add content or use badges/flow_chain instead`,
        block: i,
      });
    }
  }
}

// ── V6: Stubby flow chain ────────────────────────────────────

function checkStubbyFlowChain(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) !== "flow_chain") continue;
    const val = blockValue(blocks[i]) as FlowChainSpec;
    if (val.steps.length < 3) {
      issues.push({
        check: "V6-stubby-flow",
        severity: "info",
        message: `flow_chain at block ${i} has ${val.steps.length} step${val.steps.length !== 1 ? "s" : ""} — consider a cards block for before/after or add intermediate steps`,
        block: i,
      });
    }
  }
}

// ── V7: Missing opening ─────────────────────────────────────

function checkMissingOpening(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);
    if (type === "section_label") {
      if (_spec.hero?.body) return;
      issues.push({
        check: "V7-missing-opening",
        severity: "info",
        message: "Page starts with a section label — no intro prose to orient the reader. Add a hero body or an opening paragraph before the first section.",
      });
    }
    return;
  }
}

// ── V8: Frame gaps ───────────────────────────────────────────

function checkFrameGaps(blocks: SpecBlock[], spec: PageSpec, issues: VisualLintIssue[]): void {
  if (spec.hero && !spec.hero.body) {
    issues.push({
      check: "V8-frame-gaps",
      severity: "info",
      message: "Hero has no body text — add a sentence to set context for the page",
    });
  }

  const hasClosing = spec.closing || blocks.some(b => blockType(b) === "closing");
  if (!hasClosing) {
    let proseCount = 0;
    let visualCount = 0;
    for (const block of blocks) {
      if (isProseBlock(block)) proseCount++;
      if (VISUAL_TYPES.has(blockType(block))) visualCount++;
    }
    const isIndexLike = blocks.length > 0 && visualCount > blocks.length * 0.6 && proseCount < 3;

    if (!isIndexLike) {
      issues.push({
        check: "V8-frame-gaps",
        severity: "warning",
        message: "Page has no closing — add a closing to land the reader",
      });
    }
  }
}

// ── V9: Anemic section ───────────────────────────────────────

function checkAnemicSection(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  let sectionStart = 0;
  let sectionLabel = "(opening)";

  const check = (start: number, end: number, label: string, labelIdx: number) => {
    let contentCount = 0;
    let hasVisual = false;
    let hasCohesion = false;
    for (let i = start; i < end; i++) {
      const type = blockType(blocks[i]);
      contentCount++;
      if (VISUAL_TYPES.has(type)) hasVisual = true;
      if (getBlockCohesion(blocks[i])) hasCohesion = true;
    }

    const isFinalSection = end === blocks.length;
    if (label !== "(opening)" && !isFinalSection && contentCount <= 1 && !hasVisual && !hasCohesion) {
      issues.push({
        check: "V9-anemic-section",
        severity: "info",
        message: `Section "${label}" has ${contentCount === 0 ? "no" : "only 1 prose"} block — merge into adjacent section or expand`,
        block: labelIdx,
      });
    }
  };

  let lastLabelIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) === "section_label") {
      check(sectionStart, i, sectionLabel, lastLabelIdx);
      sectionStart = i + 1;
      lastLabelIdx = i;
      const val = blockValue(blocks[i]);
      sectionLabel = typeof val === "string" ? val : (val as { text: string }).text;
    }
  }
  check(sectionStart, blocks.length, sectionLabel, lastLabelIdx);
}

// ── V10: Section balance ─────────────────────────────────────

function checkSectionBalance(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  const sections: { label: string; count: number }[] = [];
  let sectionLabel = "(opening)";
  let contentCount = 0;

  const flush = (label: string) => {
    if (label !== "(opening)" && contentCount > 0) {
      sections.push({ label, count: contentCount });
    }
    contentCount = 0;
  };

  for (const block of blocks) {
    const type = blockType(block);
    if (type === "section_label") {
      flush(sectionLabel);
      const val = blockValue(block);
      sectionLabel = typeof val === "string" ? val : (val as { text: string }).text;
    } else {
      contentCount++;
    }
  }
  flush(sectionLabel);

  if (sections.length < 2) return;

  const sizes = sections.map((s) => s.count);
  const max = Math.max(...sizes);
  const min = Math.min(...sizes);
  const ratio = max / min;

  if (ratio >= 10) {
    const largest = sections.find((s) => s.count === max)!;
    const smallest = sections.find((s) => s.count === min)!;
    issues.push({
      check: "V10-section-balance",
      severity: "info",
      message: `Section "${largest.label}" (${max} blocks) is ${ratio.toFixed(0)}x larger than "${smallest.label}" (${min} blocks) — consider splitting the large section or merging the small one`,
    });
  }
}

// ── V11: Layout monotony ─────────────────────────────────────

function checkLayoutMonotony(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  const cardBlocks: { count: number; cohesion?: Cohesion }[] = [];

  for (const block of blocks) {
    if (blockType(block) !== "cards") continue;
    const val = blockValue(block) as CardsSpec;
    cardBlocks.push({ count: val.items.length, cohesion: getBlockCohesion(block) });
  }

  if (cardBlocks.length < 3) return;

  const allSame = cardBlocks.every((c) => c.count === cardBlocks[0].count);
  if (!allSame) return;

  const cohesions = new Set(cardBlocks.map(c => c.cohesion).filter(Boolean));
  if (cohesions.size >= 2) return;

  issues.push({
    check: "V11-layout-monotony",
    severity: "info",
    message: `All ${cardBlocks.length} card rows use ${cardBlocks[0].count}-column layout — vary column counts for visual rhythm`,
  });
}

// ── V15: Caption stacking ────────────────────────────────────

function isCaptionBlock(block: SpecBlock): boolean {
  if (blockType(block) !== "prose") return false;
  const val = blockValue(block) as ProseSpec;
  return val.role === "caption";
}

function checkCaptionStacking(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  let sectionStart = 0;
  let sectionLabel = "(opening)";

  const check = (start: number, end: number, label: string, labelIdx: number) => {
    let proseCount = 0;
    let captionCount = 0;
    for (let i = start; i < end; i++) {
      if (isProseBlock(blocks[i])) {
        proseCount++;
        if (isCaptionBlock(blocks[i])) {
          const nextIdx = i + 1;
          const nextType = nextIdx < end ? blockType(blocks[nextIdx]) : null;
          const isLabeling = nextType !== null && VISUAL_TYPES.has(nextType);
          if (!isLabeling) captionCount++;
        }
      }
    }

    if (proseCount >= 3 && captionCount / proseCount > 0.6) {
      issues.push({
        check: "V15-caption-stacking",
        severity: "info",
        message: `Section "${label}" has ${captionCount}/${proseCount} caption-role prose blocks — mix in intro or body role for narrative flow`,
        block: labelIdx >= 0 ? labelIdx : start,
      });
    }
  };

  let lastLabelIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) === "section_label") {
      check(sectionStart, i, sectionLabel, lastLabelIdx);
      sectionStart = i + 1;
      lastLabelIdx = i;
      const val = blockValue(blocks[i]);
      sectionLabel = typeof val === "string" ? val : (val as { text: string }).text;
    }
  }
  check(sectionStart, blocks.length, sectionLabel, lastLabelIdx);
}

// ── V16: Section density ─────────────────────────────────────

function checkSectionDensity(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  const sections: { label: string; count: number; labelIdx: number }[] = [];
  let sectionLabel = "(opening)";
  let contentCount = 0;
  let lastLabelIdx = -1;

  const flush = (label: string, idx: number) => {
    if (label !== "(opening)") {
      sections.push({ label, count: contentCount, labelIdx: idx });
    }
    contentCount = 0;
  };

  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) === "section_label") {
      flush(sectionLabel, lastLabelIdx);
      lastLabelIdx = i;
      const val = blockValue(blocks[i]);
      sectionLabel = typeof val === "string" ? val : (val as { text: string }).text;
    } else {
      contentCount++;
    }
  }
  flush(sectionLabel, lastLabelIdx);

  let runStart = -1;
  let runLength = 0;

  const flushRun = () => {
    if (runLength >= 6) {
      const labels = sections.slice(runStart, runStart + runLength).map(s => `"${s.label}"`).join(", ");
      issues.push({
        check: "V16-section-density",
        severity: "info",
        message: `${runLength} consecutive small sections (${labels}) — consider grouping under one section_label with heading subdivisions`,
        block: sections[runStart].labelIdx,
      });
    }
    runLength = 0;
  };

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].count <= 4) {
      if (runLength === 0) runStart = i;
      runLength++;
    } else {
      flushRun();
    }
  }
  flushRun();
}

// ── V17: Scheme fragmentation ────────────────────────────────

function checkSchemeFragmentation(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  let sectionStart = 0;
  let sectionLabel = "(opening)";

  const check = (start: number, end: number, label: string, labelIdx: number) => {
    const schemes = new Set<string>();
    for (let i = start; i < end; i++) {
      const val = blockValue(blocks[i]) as Record<string, unknown>;
      if (typeof val?.scheme === "string") {
        schemes.add(val.scheme);
      }
    }

    if (schemes.size >= 5) {
      issues.push({
        check: "V17-scheme-fragmentation",
        severity: "info",
        message: `Section "${label}" uses ${schemes.size} different scheme overrides (${[...schemes].join(", ")}) — consolidate to one scheme or use per-item colors instead`,
        block: labelIdx >= 0 ? labelIdx : start,
      });
    }
  };

  let lastLabelIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) === "section_label") {
      check(sectionStart, i, sectionLabel, lastLabelIdx);
      sectionStart = i + 1;
      lastLabelIdx = i;
      const val = blockValue(blocks[i]);
      sectionLabel = typeof val === "string" ? val : (val as { text: string }).text;
    }
  }
  check(sectionStart, blocks.length, sectionLabel, lastLabelIdx);
}

// ── V18: Identical consecutive ───────────────────────────────

const CONSECUTIVE_CHECK_TYPES = new Set([
  "flow_chain", "table", "badge", "info_box",
]);

function checkIdenticalConsecutive(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  let prevType: string | null = null;
  let prevSignature: string | null = null;
  let runStart = -1;
  let runLength = 0;

  const flush = () => {
    if (runLength >= 3 && prevType && CONSECUTIVE_CHECK_TYPES.has(prevType)) {
      issues.push({
        check: "V18-identical-consecutive",
        severity: "info",
        message: `${runLength} consecutive ${prevType} blocks (blocks ${runStart}–${runStart + runLength - 1}) — add a caption between them or merge into one`,
        block: runStart,
      });
    }
    runLength = 0;
  };

  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);

    if (getBlockCohesion(blocks[i])) {
      flush();
      prevType = type;
      prevSignature = type;
      runStart = i;
      runLength = 1;
      continue;
    }

    const subtype = type === "info_box"
      ? (blockValue(blocks[i]) as { boxType?: string }).boxType || "info"
      : null;
    const signature = subtype ? `${type}:${subtype}` : type;

    if (signature === prevSignature && CONSECUTIVE_CHECK_TYPES.has(type)) {
      runLength++;
    } else {
      flush();
      prevType = type;
      prevSignature = signature;
      runStart = i;
      runLength = 1;
    }
  }
  flush();
}

// ── V20: No title field ──────────────────────────────────────

function checkNoTitle(_blocks: SpecBlock[], spec: PageSpec, issues: VisualLintIssue[]) {
  if (spec.title) {
    issues.push({
      check: "V20-no-title",
      severity: "error",
      message: `spec has a title field ("${spec.title}") — remove it. Page title lives in the wiki page, not the spec. The hero block handles the display title.`,
    });
  }
}

// ── V22: Color reset monotony ────────────────────────────────

const TONAL_BLOCK_TYPES = new Set(["cards", "flow_chain"]);

function checkColorResetMonotony(blocks: SpecBlock[], spec: PageSpec, issues: VisualLintIssue[]): void {
  if (!spec.theme) return;
  if (spec.pace || spec.weight) return;

  const hasAnyCohesion = blocks.some(b => {
    const type = blockType(b);
    return (type === "cards" || type === "flow_chain" || type === "badge") && getBlockCohesion(b);
  });
  if (hasAnyCohesion) return;

  const defaultBlocks: { index: number; type: string }[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);
    if (!TONAL_BLOCK_TYPES.has(type)) continue;

    const val = blockValue(blocks[i]) as Record<string, unknown>;
    if (val.tone || val.progression) continue;
    if (val.palette && val.palette !== spec.theme) continue;

    if (type === "cards") {
      const items = (val as unknown as CardsSpec).items as unknown as Record<string, unknown>[];
      if (items.some(item => "color" in item && item.color)) continue;
    }
    if (type === "flow_chain") {
      const steps = (val as unknown as FlowChainSpec).steps as unknown as Record<string, unknown>[];
      if (steps.some(step => "color" in step && step.color)) continue;
    }

    defaultBlocks.push({ index: i, type });
  }

  if (defaultBlocks.length < 2) return;

  const cardBlocks = defaultBlocks.filter(b => b.type === "cards");
  const flowBlocks = defaultBlocks.filter(b => b.type === "flow_chain");

  if (cardBlocks.length >= 2) {
    const indices = cardBlocks.map(b => b.index).join(", ");
    issues.push({
      check: "V22-color-reset",
      severity: "warning",
      message: `${cardBlocks.length} card blocks (at ${indices}) use default colors — auto-cycle resets per block, producing identical starting colors. Add explicit tone (e.g. tone: warm) or progression to differentiate.`,
      block: cardBlocks[0].index,
    });
  }

  if (flowBlocks.length >= 2) {
    const indices = flowBlocks.map(b => b.index).join(", ");
    issues.push({
      check: "V22-color-reset",
      severity: "warning",
      message: `${flowBlocks.length} flow_chain blocks (at ${indices}) use default colors — auto-cycle resets per block, producing identical color progressions. Add explicit tone or progression to differentiate.`,
      block: flowBlocks[0].index,
    });
  }
}

// ── V23: Presentational markup ───────────────────────────────

const MD_BOLD_RE = /\*\*[^*]+\*\*/;
const MD_ITALIC_RE = /(?<!\*)\*[^*]+\*(?!\*)/;
const MD_UNDERSCORE_BOLD_RE = /__[^_]+__/;
const STRONG_TAG_RE = /<\/?(?:strong|b)\b/i;
const INLINE_STYLE_RE = /\bstyle\s*=/i;

function checkPresentationalMarkup(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);
    const val = blockValue(blocks[i]);
    if (!val || typeof val !== "object") continue;

    if (type === "table") {
      const table = val as TableSpec;
      for (let ri = 0; ri < table.rows.length; ri++) {
        for (let ci = 0; ci < table.rows[ri].length; ci++) {
          const cell = table.rows[ri][ci];
          if (typeof cell !== "string") continue;

          if (MD_BOLD_RE.test(cell) || MD_UNDERSCORE_BOLD_RE.test(cell)) {
            issues.push({
              check: "V23-markdown-bold",
              severity: "error",
              message: `table at block ${i}, row ${ri}, col ${ci}: markdown bold (**text**) does not render — use headerColumn: true for row headers, or remove the formatting.`,
              block: i,
            });
          }

          if (ci === 0 && !table.headerColumn && STRONG_TAG_RE.test(cell)) {
            issues.push({
              check: "V23-table-strong",
              severity: "warning",
              message: `table at block ${i}: first column uses <strong> tags — use headerColumn: true instead for semantic row headers.`,
              block: i,
            });
            break;
          }

          if (ci > 0 && STRONG_TAG_RE.test(cell)) {
            issues.push({
              check: "V23-cell-strong",
              severity: "warning",
              message: `table at block ${i}, row ${ri}, col ${ci}: <strong> in table cell. Consider whether a semantic knob (stat block, badge) better expresses the emphasis.`,
              block: i,
            });
          }

          if (INLINE_STYLE_RE.test(cell)) {
            issues.push({
              check: "V23-inline-style",
              severity: "error",
              message: `table at block ${i}, row ${ri}, col ${ci}: inline style= attribute. Presentation belongs in the compiler, not the spec.`,
              block: i,
            });
          }
        }
      }
    }

    const textFields = collectTextFields(type, val as Record<string, unknown>);
    for (const { field, text } of textFields) {
      if (MD_BOLD_RE.test(text) || MD_UNDERSCORE_BOLD_RE.test(text)) {
        issues.push({
          check: "V23-markdown-bold",
          severity: "error",
          message: `${type} at block ${i} (${field}): markdown bold (**text**) does not render. Remove the formatting or use a semantic knob.`,
          block: i,
        });
      }
      if (MD_ITALIC_RE.test(text)) {
        issues.push({
          check: "V23-markdown-italic",
          severity: "error",
          message: `${type} at block ${i} (${field}): markdown italic (*text*) does not render. Use <em> for inline emphasis if needed.`,
          block: i,
        });
      }
      if (INLINE_STYLE_RE.test(text)) {
        issues.push({
          check: "V23-inline-style",
          severity: "error",
          message: `${type} at block ${i} (${field}): inline style= attribute. Presentation belongs in the compiler, not the spec.`,
          block: i,
        });
      }
    }
  }
}

function collectTextFields(type: string, val: Record<string, unknown>): { field: string; text: string }[] {
  const fields: { field: string; text: string }[] = [];
  if (type === "raw") return fields;

  for (const key of ["text", "body", "title", "subtitle", "footer", "content", "caption"]) {
    const v = val[key];
    if (typeof v === "string") fields.push({ field: key, text: v });
  }

  if (type === "cards" && Array.isArray(val.items)) {
    for (const item of val.items as Record<string, unknown>[]) {
      for (const key of ["title", "subtitle", "body", "footer"]) {
        const v = item[key];
        if (typeof v === "string") fields.push({ field: `items[].${key}`, text: v });
      }
    }
  }

  return fields;
}

// ── V24: Escape artifacts ────────────────────────────────────

const ESCAPE_ARTIFACT_RE = /\\"/;

function checkEscapeArtifacts(blocks: SpecBlock[], spec: PageSpec, issues: VisualLintIssue[]): void {
  if (spec.hero) {
    const h = spec.hero as Record<string, unknown>;
    for (const key of ["title", "body"]) {
      if (typeof h[key] === "string" && ESCAPE_ARTIFACT_RE.test(h[key] as string)) {
        issues.push({
          check: "V24-escape-artifact",
          severity: "error",
          message: `hero.${key}: backslash-quote (\") is a YAML authoring error — use proper quoting`,
        });
      }
    }
  }

  if (spec.closing) {
    const text = (spec.closing as { text?: string }).text;
    if (typeof text === "string" && ESCAPE_ARTIFACT_RE.test(text)) {
      issues.push({
        check: "V24-escape-artifact",
        severity: "error",
        message: `closing: backslash-quote (\") is a YAML authoring error — use proper quoting`,
      });
    }
  }

  for (let i = 0; i < blocks.length; i++) {
    const type = blockType(blocks[i]);
    const val = blockValue(blocks[i]);
    if (!val || typeof val !== "object") continue;

    if (type === "table") {
      const table = val as TableSpec;
      for (let ri = 0; ri < table.rows.length; ri++) {
        for (let ci = 0; ci < table.rows[ri].length; ci++) {
          const cell = table.rows[ri][ci];
          if (typeof cell === "string" && ESCAPE_ARTIFACT_RE.test(cell)) {
            issues.push({
              check: "V24-escape-artifact",
              severity: "error",
              message: `table at block ${i}, row ${ri}, col ${ci}: backslash-quote (\") — use single-quoted YAML for literal quotes`,
              block: i,
            });
          }
        }
      }
    }

    const textFields = collectTextFields(type, val as Record<string, unknown>);
    for (const { field, text } of textFields) {
      if (ESCAPE_ARTIFACT_RE.test(text)) {
        issues.push({
          check: "V24-escape-artifact",
          severity: "error",
          message: `${type} at block ${i} (${field}): backslash-quote (\") — for block scalars remove the backslash; for plain values use single-quoted YAML`,
          block: i,
        });
      }
    }
  }
}

// ── V25: Card link coverage ──────────────────────────────────

function checkCardLinkCoverage(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) !== "cards") continue;

    const val = blockValue(blocks[i]) as CardsSpec;
    const items = val?.items;
    if (!Array.isArray(items) || items.length === 0) continue;

    const noLink = items.filter((item) => !item?.link).length;
    if (noLink > items.length / 2) {
      issues.push({
        check: "V25-card-link-coverage",
        severity: "info",
        message: `cards at block ${i}: ${noLink}/${items.length} items have no link — cards should link into the reference pool`,
        block: i,
      });
    }
  }
}

// ── V26: Card body density ───────────────────────────────────

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function checkCardBodyDensity(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) !== "cards") continue;

    const val = blockValue(blocks[i]) as CardsSpec;
    const items = val?.items;
    if (!Array.isArray(items)) continue;

    for (let j = 0; j < items.length; j++) {
      const item = items[j] as CardItemSpec;
      const bodyWords = wordCount(item.body);
      if (bodyWords > 30) {
        issues.push({
          check: "V26-card-body-density",
          severity: "warning",
          message: `cards at block ${i}, item ${j}: body has ${bodyWords} words (max 30) — move detail to a linked page`,
          block: i,
        });
      }

      const titleWords = wordCount(item.title);
      if (titleWords > 8) {
        issues.push({
          check: "V26-card-title-length",
          severity: "info",
          message: `cards at block ${i}, item ${j}: title has ${titleWords} words — keep titles concise (≤8 words)`,
          block: i,
        });
      }
    }
  }
}

// ── V27: Card block density ──────────────────────────────────

function checkCardBlockDensity(blocks: SpecBlock[], _spec: PageSpec, issues: VisualLintIssue[]): void {
  for (let i = 0; i < blocks.length; i++) {
    if (blockType(blocks[i]) !== "cards") continue;

    const val = blockValue(blocks[i]) as CardsSpec;
    const items = val?.items;
    if (!Array.isArray(items)) continue;

    let totalWords = 0;
    for (const item of items as CardItemSpec[]) {
      totalWords += wordCount(item.title);
      totalWords += wordCount(item.body);
      totalWords += wordCount(item.footer);
      if (typeof item.subtitle === "string") {
        totalWords += wordCount(item.subtitle);
      }
    }

    const budget = items.length * 40;
    if (totalWords > budget) {
      issues.push({
        check: "V27-card-block-density",
        severity: "warning",
        message: `cards at block ${i}: ${totalWords} total words across ${items.length} items (budget: ${budget}) — reduce content or split into multiple card blocks`,
        block: i,
      });
    }
  }
}
