export function extractFooterData(section) {
    return {
        variant: section.variant || "simple",
        logo: section.logo,
        description: section.description,
        links: section.links || [],
        social: section.social || [],
        copyright: section.copyright,
    };
}
//# sourceMappingURL=footer.data.js.map