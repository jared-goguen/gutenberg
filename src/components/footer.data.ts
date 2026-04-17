import type { FooterSection } from "../types.js";

export interface FooterData {
  variant: "simple" | "detailed" | "newsletter";
  logo?: {
    text?: string;
    image?: string;
  };
  description?: string;
  links?: Array<{
    text: string;
    href: string;
  }>;
  social?: Array<{
    platform: string;
    href: string;
  }>;
  copyright?: string;
}

export function extractFooterData(section: FooterSection): FooterData {
  return {
    variant: section.variant || "simple",
    logo: section.logo,
    description: section.description,
    links: section.links || [],
    social: section.social || [],
    copyright: section.copyright,
  };
}
