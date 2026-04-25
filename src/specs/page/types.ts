/**
 * Page spec types — the shared contract for the publishing pipeline.
 *
 * A page spec is a YAML file describing the semantic structure of a page:
 * metadata (title, scheme, theme) and an ordered list of typed blocks.
 *
 * Blocks use a single-key map where the key is the type name. Scalar
 * shorthand is supported for simple blocks (e.g. `- section_label: "OVERVIEW"`).
 *
 * Every field answers one of four questions:
 *   - What is this? (content: title, text, label, body)
 *   - What kind is it? (classification: role, boxType, type, level)
 *   - How does it relate? (structure: cohesion, tone, scheme, cols)
 *   - How much does it assert? (intensity: emphasis, size)
 *
 * Fields that control pixels, CSS values, or percentages do NOT belong here.
 * Those are compiler concerns, resolved from semantic tokens.
 */

// ── Spec kind (from @jgoguen/meta-spec) ──────────────────────

export type { SpecKind, MetaSpec, SpecTypeDef, MetaFieldDef } from "../meta/index.js";
export { SPEC_KINDS } from "../meta/index.js";

// ── Semantic axes ─────────────────────────────────────────────

/** Pace — the temporal dimension of layout. How quickly the reader moves through. */
export type Pace = "open" | "balanced" | "dense";

/** Weight — the gravitational dimension. How much each element asserts itself. */
export type Weight = "light" | "regular" | "heavy";

/** Cohesion — how a block relates to its predecessor. */
export type Cohesion = "continues" | "supports" | "contrasts" | "pivots" | "resolves";

/** Tone — semantic color family. Enrichment resolves to concrete hues via chroma floor. */
export type Tone = "warm" | "cool" | "accent" | "neutral" | "drama";

// ── Semantic sizing tokens ────────────────────────────────────

/** Column sizing hint for tables. Compiler resolves to percentages. */
export type ColumnSize = "narrow" | "medium" | "wide" | "fill";

// ── Page-level ────────────────────────────────────────────────

export interface PageSpec {
  /** Spec kind discriminator. Defaults to "page" when omitted in YAML. */
  kind?: "page";

  title?: string;
  theme?: string;
  /** @deprecated Use theme instead. */
  scheme?: string;

  /** Cascading accent border weight for card blocks. subtle=2, standard=3, bold=4. */
  emphasis?: "subtle" | "standard" | "bold";
  /** Cascading text alignment for card blocks. */
  align?: "left" | "center";

  // ── Semantic axes ─────────────────────────────────────────
  /** Pace — resolves to density + separation. Explicit density/separation override. */
  pace?: Pace;
  /** Weight — resolves to emphasis + shadow. Explicit emphasis overrides. */
  weight?: Weight;

  // ── Frame ───────────────────────────────────────────────
  /** Canonical URL for OG meta tags. */
  url?: string;
  /** Section slug (e.g. "ai-tooling"). Drives hero category. */
  section?: string;
  /** Page hero — rendered before blocks as an inline header box. */
  hero?: HeroFrame;
  /** Page superhero — rendered before blocks as a full-viewport immersive opening. */
  superhero?: HeroFrame;
  /** Page closing — rendered after blocks. */
  closing?: ClosingFrame;

  /** Navigation siblings — bare names resolved to sibling pages or child sections. */
  nav?: string[];

  blocks: SpecBlock[];
}

// ── Frame types ───────────────────────────────────────────────

export interface HeroFrame {
  /** Display title. Required when spec.title is absent. */
  title?: string;
  /** Category tags — rendered as accent-colored labels with separators. */
  categories?: string[];
  body?: string;
  /** Pass-through for superhero: particle glyph vocabulary. */
  glyphs?: string;
  /** Pass-through for superhero: flanking tagline rows. */
  taglines?: string[];
  /** Pass-through for superhero: feature descriptor boxes. */
  descriptors?: DescriptorSpec[];
  /** Pass-through for superhero: scroll indicator customization. */
  scroll_cta?: ScrollCtaSpec;
  /** Pass-through for superhero: background grid overlay. */
  grid?: boolean;
}

export interface ClosingFrame {
  text: string;
}

// ── Block union ───────────────────────────────────────────────

export type SpecBlock =
  | { hero: HeroSpec }
  | { superhero: SuperheroSpec }
  | { section_label: SectionLabelSpec | string }
  | { cards: CardsSpec }
  | { nav_cards: NavCardsSpec }
  | { stat: StatSpec }
  | { page_nav: PageNavSpec }
  | { prose: ProseSpec | string }
  | { flow_chain: FlowChainSpec }
  | { table: TableSpec }
  | { heading: HeadingSpec | string }
  | { info_box: InfoBoxSpec }
  | { macro: MacroSpec }
  | { swatch_strip: SwatchStripSpec }
  | { badge: BadgeSpec }
  | { transform: TransformSpec }
  | { callout: CalloutSpec }
  | { pullquote: PullquoteSpec }
  | { install: InstallSpec }
  | { timeline: TimelineSpec }
  | { tracker: TrackerSpec }
  | { calendar: CalendarSpec }
  | { closing: ClosingSpec | string }
  | { recent: RecentSpec | number }
  | { todo: TodoSpec | string }
  | { raw: string };

// ── Block specs ───────────────────────────────────────────────

export interface HeroSpec {
  title: string;
  categories?: string[];
  /** Subtitle displayed below the title. */
  subtitle?: string;
  body?: string;
}

/** Feature descriptor box for superhero blocks. */
export interface DescriptorSpec {
  /** Monospace title (e.g. "ARCHITECTURE", "ORCHESTRATION"). */
  title: string;
  /** Body text describing the feature (supports markdown). */
  body: string;
}

/** Scroll-to-content indicator customization. */
export interface ScrollCtaSpec {
  /** Label text (default: "Explore"). */
  label?: string;
  /** Visual style: "ring" (pulsing circle) or "simple" (basic chevron). Default: "ring". */
  style?: "ring" | "simple";
  /** Scroll target selector (default: "#content"). */
  target?: string;
}

/** Full-viewport immersive opening statement. */
export interface SuperheroSpec {
  title: string;
  categories?: string[];
  body?: string;
  /** Explicit particle glyph vocabulary. */
  glyphs?: string;
  /** Flanking tagline rows. */
  taglines?: string[];
  /** Feature descriptor boxes displayed below title in a grid. */
  descriptors?: DescriptorSpec[];
  /** Enhanced scroll indicator. */
  scroll_cta?: ScrollCtaSpec;
  /** Show background grid overlay. Default: true. */
  grid?: boolean;
}

export interface SectionLabelSpec {
  text: string;
  /** Anchor ID for deep-linking. Auto-slugified from text if omitted. */
  anchor?: string;
  /** Tonal context — sets the default tone for subsequent colorable blocks. */
  tone?: Tone;
}

export interface CardItemSpec {
  title: string;
  subtitle?: string | string[];
  body?: string;
  footer?: string;
  /** Confluence page link rendered as footer. String = page title (same space). */
  link?: string;
  /** Palette color name, semantic role, or shade ref. */
  color?: string;
  /** Metadata badges rendered as colored pills in the card header. */
  badge?: string | string[];
  /** Bento grid sizing. */
  size?: "normal" | "wide" | "tall" | "large";
}

export interface CardsSpec {
  cohesion?: Cohesion;
  items: CardItemSpec[];
  /** Number of columns per row. */
  cols?: number;
  /** Semantic border weight. */
  emphasis?: "subtle" | "standard" | "bold";
  /** Block-level palette override. */
  palette?: string;
  /** @deprecated Use palette instead. */
  scheme?: string;
  /** Semantic tone. */
  tone?: Tone;
  /** Tonal progression. */
  progression?: string;
}

export interface NavCardItemSpec {
  /** Page slug. */
  page?: string;
  /** Override resolved title from page slug. */
  title?: string;
  /** Description text displayed in the card. */
  description?: string;
  /** Override resolved link from page slug. */
  link?: string;
}

export interface NavCardsSpec {
  cohesion?: Cohesion;
  items?: NavCardItemSpec[];
  cols?: number;
}

export interface StatItemSpec {
  value: string;
  label: string;
  detail?: string;
  unit?: string;
  trend?: string;
  color?: string;
}

export interface StatSpec {
  cohesion?: Cohesion;
  items: StatItemSpec[];
  palette?: string;
  /** @deprecated Use palette instead. */
  scheme?: string;
  tone?: Tone;
  progression?: string;
}

export interface PageNavEntry {
  text: string;
  anchor: string;
}

export interface PageNavSpec {
  cohesion?: Cohesion;
  entries?: PageNavEntry[];
}

export interface ProseSpec {
  cohesion?: Cohesion;
  text: string;
  role?: "intro" | "body" | "caption";
}

export interface ClosingSpec {
  text: string;
}

export interface FlowChainSpec {
  cohesion?: Cohesion;
  steps: { label: string; color?: string }[];
  palette?: string;
  /** @deprecated Use palette instead. */
  scheme?: string;
  tone?: Tone;
  progression?: string;
}

export interface TableSpec {
  cohesion?: Cohesion;
  headers: { label: string; size?: ColumnSize; align?: "left" | "center" | "right" }[];
  rows: string[][];
  palette?: string;
  /** @deprecated Use palette instead. */
  scheme?: string;
  caption?: string;
  headerColumn?: boolean;
}

export interface HeadingSpec {
  cohesion?: Cohesion;
  text: string;
  level?: 2 | 3;
  anchor?: string;
}

export interface CalloutSpec {
  title: string;
  body?: string;
  link?: string;
  label?: string;
  color?: string;
}

export interface PullquoteSpec {
  text: string;
  attribution?: string;
  color?: string;
}

export interface InstallSpec {
  title: string;
  body?: string;
  link?: string;
  action?: string;
  color?: string;
}

export interface InfoBoxSpec {
  cohesion?: Cohesion;
  boxType: "note" | "info" | "warning" | "tip";
  content: string;
  title?: string;
}

export interface TodoSpec {
  cohesion?: Cohesion;
  content: string;
  blocked_by?: string;
}

export interface MacroSpec {
  cohesion?: Cohesion;
  name: string;
  params?: Record<string, string>;
  body?: string;
}

export interface SwatchStripSpec {
  cohesion?: Cohesion;
  hue: string;
  shades?: number[];
  title?: string;
}

// ── Tracker ───────────────────────────────────────────────────

export interface TrackerItemSpec {
  label: string;
  value: string;
  type: "rating" | "toggle" | "text";
  max?: number;       // rating upper bound, default 5
  color?: string;     // explicit color override
}

export interface TrackerSpec {
  items: TrackerItemSpec[];
  cols?: number;       // grid columns, default min(items.length, 4)
  caption?: string;
  palette?: string;
  cohesion?: Cohesion;
}

export interface BadgeSpec {
  cohesion?: Cohesion;
  items: { label: string; color?: string }[];
  palette?: string;
  /** @deprecated Use palette instead. */
  scheme?: string;
  tone?: Tone;
  progression?: string;
  size?: "sm" | "md";
}

export interface TimelineItemSpec {
  label: string;
  date: string;
  status: "shipped" | "active" | "planned";
  color?: string;
  link?: string;
}

export interface TimelineTrackSpec {
  label: string;
  sublabel?: string;
  color?: string;
  items: TimelineItemSpec[];
}

export interface TimelineSpec {
  cohesion?: Cohesion;
  caption?: string;
  palette?: string;
  /** @deprecated Use palette instead. */
  scheme?: string;
  tone?: Tone;
  progression?: string;
  terminus?: string;
  items?: TimelineItemSpec[];
  tracks?: TimelineTrackSpec[];
}

export interface TransformSpec {
  cohesion?: Cohesion;
  steps: TransformStepSpec[];
  palette?: string;
  /** @deprecated Use palette instead. */
  scheme?: string;
  tone?: Tone;
  progression?: string;
}

export interface TransformStepSpec {
  input?: string;
  tool: string;
  output: string;
  link?: string;
  outputLink?: string;
  color?: string;
  featured?: boolean;
}

export interface RecentSpec {
  path?: string;
  count?: number;
  _entries?: RecentEntry[];
}

export interface RecentEntry {
  title: string;
  link: string;
  modified: string;
  section?: string;
}

// ── Calendar ──────────────────────────────────────────────────

export interface CalendarSpec {
  /** 4-digit year (e.g. 2026). */
  year: number;
  /** 1-indexed month (1 = January, 12 = December). */
  month: number;
  /** YYYY-MM-DD dates that have entries — rendered with filled indicator. */
  entries: string[];
  /** Today's date (YYYY-MM-DD) for highlighting. */
  today?: string;
  /** URL pattern for day links. `{date}` is replaced with YYYY-MM-DD.
   *  Default: `/diary/{date}` */
  linkPattern?: string;
  /** URL pattern for month navigation. `{month}` is replaced with YYYY-MM.
   *  Default: `/?month={month}` */
  monthPattern?: string;
}

// ── Helpers ───────────────────────────────────────────────────

/** Extract the block type key from a SpecBlock. */
export function blockType(block: SpecBlock): string {
  return Object.keys(block)[0];
}

/** Extract the block value from a SpecBlock. */
export function blockValue(block: SpecBlock): unknown {
  return Object.values(block)[0];
}

/**
 * Normalize a block: expand scalar shorthands to their full object form.
 * Idempotent — already-expanded blocks pass through unchanged.
 */
export function normalizeBlock(block: SpecBlock): SpecBlock {
  const type = blockType(block);
  const val = blockValue(block);

  if (type === "section_label" && typeof val === "string") {
    return { section_label: { text: val } };
  }
  if (type === "heading" && typeof val === "string") {
    return { heading: { text: val } };
  }
  if (type === "prose" && typeof val === "string") {
    return { prose: { text: val, role: "body" } };
  }
  if (type === "closing" && typeof val === "string") {
    return { closing: { text: val } };
  }
  if (type === "recent" && typeof val === "number") {
    return { recent: { count: val } };
  }

  // raw: accept both `{ raw: "..." }` and `{ raw: { xhtml: "..." } }`
  if (type === "raw" && typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (typeof obj.xhtml === "string") {
      return { raw: obj.xhtml };
    }
  }

  return block;
}
