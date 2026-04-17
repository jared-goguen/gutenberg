/**
 * Hero data extraction
 * 
 * Extracts typed, normalized data from raw HeroSection
 * No HTML generation, no classes
 */

import type { HeroSection } from "../types.js";

export interface CtaData {
  text: string;
  href: string;
  variant?: "primary" | "secondary";
}

export interface ImageData {
  src: string;
  alt: string;
}

export interface HeroData {
  variant: "centered" | "split" | "full-bleed";
  overline?: string;
  heading: string;
  subheading?: string;
  body?: string;
  ctas: CtaData[];
  secondaryCtas: CtaData[];
  image?: ImageData;
  backgroundImage?: string;
}

/**
 * Extract typed HeroData from raw HeroSection
 */
export function extractHeroData(section: HeroSection): HeroData {
  const { content } = section;
  
  // Normalize CTAs to array
  const allCtas = Array.isArray(content.cta) ? content.cta : content.cta ? [content.cta] : [];
  
  // First CTA is primary, rest are secondary
  const ctas = allCtas.slice(0, 1).map(cta => ({
    text: cta.text,
    href: cta.href,
    variant: (cta.variant || "primary") as "primary" | "secondary",
  }));
  
  const secondaryCtas = allCtas.slice(1).map(cta => ({
    text: cta.text,
    href: cta.href,
    variant: (cta.variant || "secondary") as "primary" | "secondary",
  }));
  
  const image = content.image ? { src: content.image, alt: content.heading } : undefined;
  
  return {
    variant: (section.variant || "centered") as "centered" | "split" | "full-bleed",
    overline: section.overline,
    heading: content.heading,
    subheading: content.subheading,
    body: content.description,
    ctas,
    secondaryCtas,
    image,
    backgroundImage: content.backgroundImage,
  };
}
