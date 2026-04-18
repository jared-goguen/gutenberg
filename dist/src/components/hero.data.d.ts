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
export declare function extractHeroData(section: HeroSection): HeroData;
//# sourceMappingURL=hero.data.d.ts.map