// Core type definitions for Gutenberg

export interface PageSchema {
  page: {
    meta?: PageMeta;
    layout?: PageLayout;
    sections: Section[];
  };
}

export interface PageMeta {
  title: string;
  description?: string;
  language?: string;
  author?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface PageLayout {
  type?: "standard" | "wide" | "narrow" | "docs";
}

export interface Section {
  type: ComponentType;
  variant?: string;
  id?: string;

  // Semantic axes — orthogonal dimensions for page cohesion
  vibe?: "serene" | "gentle" | "steady" | "vibrant" | "intense" | "urgent";
  intent?: "engage" | "inform" | "persuade" | "direct";
  narrative?: "exposition" | "inciting" | "rising" | "climax" | "falling" | "resolution";
  cohesion?: "opens" | "continues" | "amplifies" | "supports" | "contrasts" | "pivots" | "echoes" | "resolves" | "closes";

  [key: string]: any;
}

export type ComponentType =
  | "hero"
  | "features"
  | "content"
  | "cta"
  | "navigation"
  | "footer"
  | "table";

export interface HeroSection extends Section {
  type: "hero";
  variant?: "centered" | "split" | "full-bleed";
  overline?: string;
  content: {
    heading: string;
    subheading?: string;
    description?: string;
    cta?: CTA | CTA[];
    image?: string;
    backgroundImage?: string;
  };
}

export interface FeaturesSection extends Section {
  type: "features";
  variant?: "grid-2" | "grid-3" | "grid-4" | "list";
  overline?: string;
  card_style?: "material" | "accent-border";
  heading?: string;
  subheading?: string;
  items: FeatureItem[];
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
  link?: string | { text: string; href: string };
}

export interface ContentSection extends Section {
  type: "content";
  variant?: "prose" | "narrow" | "wide";
  markdown?: string;
  html?: string;
}

export interface CTASection extends Section {
  type: "cta";
  variant?: "centered" | "split" | "banner";
  overline?: string;
  heading: string;
  description?: string;
  cta: CTA | CTA[];
  backgroundImage?: string;
}

export interface NavigationSection extends Section {
  type: "navigation";
  variant?: "default" | "centered" | "split";
  logo?: string | { text?: string; image?: string; href?: string };
  links: NavLink[];
  cta?: CTA;
}

export interface NavLink {
  text: string;
  href: string;
  dropdown?: NavLink[];
}

export interface FooterSection extends Section {
  type: "footer";
  variant?: "simple" | "detailed" | "newsletter";
  logo?: { text?: string; image?: string };
  description?: string;
  links?: NavLink[];
  social?: SocialLink[];
  copyright?: string;
}

export interface TableCell {
  label: string;
  value: string | number | boolean;
  type: "text" | "numeric" | "bool";
  "color-scale"?: [number, number];
  "invert-colors"?: boolean;
}

export interface TableSection extends Section {
  type: "table";
  label: string;
  cells: TableCell[];
}

export interface SocialLink {
  platform: string;
  href: string;
}

export interface CTA {
  text: string;
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

// Validation types

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  path: string;
  message: string;
}

// Render options

export interface RenderOptions {
  minify?: boolean;
  includeComments?: boolean;
  indentSize?: number;
  mode?: 'view' | 'edit';
}

// Semantic Axes Type Aliases

export type Vibe = "serene" | "gentle" | "steady" | "vibrant" | "intense" | "urgent";
export type Intent = "engage" | "inform" | "persuade" | "direct";
export type Narrative = "exposition" | "inciting" | "rising" | "climax" | "falling" | "resolution";
export type Cohesion = "opens" | "continues" | "amplifies" | "supports" | "contrasts" | "pivots" | "echoes" | "resolves" | "closes";
