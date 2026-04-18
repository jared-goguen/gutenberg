export function extractCtaData(section) {
    const variant = section.variant || "centered";
    const ctas = Array.isArray(section.cta) ? section.cta : section.cta ? [section.cta] : [];
    return {
        variant,
        overline: section.overline,
        heading: section.heading,
        description: section.description,
        ctas
    };
}
//# sourceMappingURL=cta.data.js.map