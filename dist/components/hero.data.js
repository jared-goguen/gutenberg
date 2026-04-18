/**
 * Hero data extraction
 *
 * Extracts typed, normalized data from raw HeroSection
 * No HTML generation, no classes
 */
/**
 * Extract typed HeroData from raw HeroSection
 */
export function extractHeroData(section) {
    const { content } = section;
    // Normalize CTAs to array
    const allCtas = Array.isArray(content.cta) ? content.cta : content.cta ? [content.cta] : [];
    // First CTA is primary, rest are secondary
    const ctas = allCtas.slice(0, 1).map(cta => ({
        text: cta.text,
        href: cta.href,
        variant: (cta.variant || "primary"),
    }));
    const secondaryCtas = allCtas.slice(1).map(cta => ({
        text: cta.text,
        href: cta.href,
        variant: (cta.variant || "secondary"),
    }));
    const image = content.image ? { src: content.image, alt: content.heading } : undefined;
    return {
        variant: (section.variant || "centered"),
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
//# sourceMappingURL=hero.data.js.map