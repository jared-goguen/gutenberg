/**
 * Component exports
 *
 * This module re-exports all component data extractors and scaffolders
 * for use by the pipeline stages.
 */
export { extractHeroData, type HeroData, type CtaData, type ImageData } from "./hero.data.js";
export { scaffoldHero } from "./hero.scaffold.js";
export { extractFeaturesData, type FeaturesData } from "./features.data.js";
export { scaffoldFeatures } from "./features.scaffold.js";
export { extractContentData, type ContentData } from "./content.data.js";
export { scaffoldContent } from "./content.scaffold.js";
export { extractCtaData, type CtaData as CtaSectionData } from "./cta.data.js";
export { scaffoldCta } from "./cta.scaffold.js";
export { extractNavigationData, type NavigationData, type NavLinkData } from "./navigation.data.js";
export { scaffoldNavigation } from "./navigation.scaffold.js";
export { extractFooterData, type FooterData } from "./footer.data.js";
export { scaffoldFooter } from "./footer.scaffold.js";
//# sourceMappingURL=index.d.ts.map