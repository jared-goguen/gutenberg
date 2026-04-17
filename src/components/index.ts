/**
 * Component exports
 * 
 * This module re-exports all component data extractors and scaffolders
 * for use by the pipeline stages.
 */

// Hero
export { extractHeroData, type HeroData, type CtaData, type ImageData } from "./hero.data.js";
export { scaffoldHero } from "./hero.scaffold.js";

// Features
export { extractFeaturesData, type FeaturesData } from "./features.data.js";
export { scaffoldFeatures } from "./features.scaffold.js";

// Content
export { extractContentData, type ContentData } from "./content.data.js";
export { scaffoldContent } from "./content.scaffold.js";

// CTA
export { extractCtaData, type CtaData as CtaSectionData } from "./cta.data.js";
export { scaffoldCta } from "./cta.scaffold.js";

// Navigation
export { extractNavigationData, type NavigationData, type NavLinkData } from "./navigation.data.js";
export { scaffoldNavigation } from "./navigation.scaffold.js";

// Footer
export { extractFooterData, type FooterData } from "./footer.data.js";
export { scaffoldFooter } from "./footer.scaffold.js";
