export function extractFeaturesData(section) {
    return {
        variant: (section.variant || "grid-3"),
        overline: section.overline,
        card_style: section.card_style,
        heading: section.heading,
        subheading: section.subheading,
        items: section.items || [],
    };
}
//# sourceMappingURL=features.data.js.map