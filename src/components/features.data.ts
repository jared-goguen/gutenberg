import type { FeaturesSection } from "../types.js";

export interface FeaturesData {
  variant: "grid-2" | "grid-3" | "grid-4" | "list";
  overline?: string;
  card_style?: "material" | "accent-border";
  heading?: string;
  subheading?: string;
  items: Array<{ 
    icon?: string; 
    title: string; 
    description: string; 
    link?: string | { text: string; href: string };
  }>;
}

export function extractFeaturesData(section: FeaturesSection): FeaturesData {
  return {
    variant: (section.variant || "grid-3") as any,
    overline: section.overline,
    card_style: section.card_style,
    heading: section.heading,
    subheading: section.subheading,
    items: section.items || [],
  };
}
