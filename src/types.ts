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
  theme?: "light" | "dark" | "auto";
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
  | "footer";

export interface HeroSection extends Section {
  type: "hero";
  variant?: "centered" | "split" | "full-bleed";
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
  heading?: string;
  subheading?: string;
  items: FeatureItem[];
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
  link?: string;
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
  tone?: "brand" | "subtle";  // visual treatment
  heading: string;
  description?: string;
  cta: CTA | CTA[];
  backgroundImage?: string;
}

export interface NavigationSection extends Section {
  type: "navigation";
  variant?: "default" | "centered" | "split";
  logo?: {
    text?: string;
    image?: string;
    href?: string;
  };
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
  tone?: "light" | "dark";  // visual treatment
  logo?: {
    text?: string;
    image?: string;
  };
  description?: string;
  links?: FooterLinkGroup[];
  social?: SocialLink[];
  copyright?: string;
}

export interface FooterLinkGroup {
  heading: string;
  links: NavLink[];
}

export interface SocialLink {
  platform: "twitter" | "facebook" | "linkedin" | "github" | "youtube" | "instagram";
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

import type { ThemeSpec } from "./theme.js";

export interface RenderOptions {
  minify?: boolean;
  includeComments?: boolean;
  tailwindCDN?: boolean;
  indentSize?: number;
  theme?: ThemeSpec;
}

// Component registry

export interface ComponentRenderer {
  type: ComponentType;
  variants: string[];
  render: (section: Section, options: RenderOptions) => string;
  validate?: (section: Section) => ValidationResult;
}

// HTML Node for AST

export interface HTMLNode {
  tag: string;
  attrs?: Record<string, string>;
  children?: (HTMLNode | string)[];
  selfClosing?: boolean;
}
