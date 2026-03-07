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
  className?: string;
  [key: string]: any;
}

export type ComponentType =
  | "hero"
  | "features"
  | "content"
  | "cta"
  | "navigation"
  | "footer"
  | "testimonials"
  | "pricing"
  | "faq"
  | "contact"
  | "gallery";

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

export interface TestimonialsSection extends Section {
  type: "testimonials";
  variant?: "grid" | "carousel" | "single";
  heading?: string;
  items: Testimonial[];
}

export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
}

export interface PricingSection extends Section {
  type: "pricing";
  variant?: "cards" | "table" | "comparison";
  heading?: string;
  items: PricingTier[];
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  cta: CTA;
  highlighted?: boolean;
}

export interface FAQSection extends Section {
  type: "faq";
  variant?: "accordion" | "grid";
  heading?: string;
  items: FAQItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContactSection extends Section {
  type: "contact";
  variant?: "form" | "split" | "centered";
  heading?: string;
  description?: string;
  fields?: FormField[];
  submitText?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface GallerySection extends Section {
  type: "gallery";
  variant?: "grid" | "masonry" | "carousel";
  heading?: string;
  items: GalleryItem[];
}

export interface GalleryItem {
  image: string;
  alt: string;
  caption?: string;
  link?: string;
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
  tailwindCDN?: boolean;
  indentSize?: number;
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
