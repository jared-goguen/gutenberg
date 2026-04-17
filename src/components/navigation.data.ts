import type { NavigationSection } from "../types.js";

export interface NavLinkData {
  text: string;
  href: string;
}

export interface NavigationData {
  variant: "default" | "centered" | "split";
  logo?: { text?: string; href?: string };
  links: NavLinkData[];
}

export function extractNavigationData(section: NavigationSection): NavigationData {
  return {
    variant: (section.variant || "default") as any,
    logo: section.logo
      ? typeof section.logo === "string"
        ? { text: section.logo, href: "/" }
        : { text: section.logo.text, href: section.logo.href || "/" }
      : undefined,
    links: (section.links || []).map(l => ({ text: l.text, href: l.href })),
  };
}
