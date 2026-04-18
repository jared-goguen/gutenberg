export function extractNavigationData(section) {
    return {
        variant: (section.variant || "default"),
        logo: section.logo
            ? typeof section.logo === "string"
                ? { text: section.logo, href: "/" }
                : { text: section.logo.text, href: section.logo.href || "/" }
            : undefined,
        links: (section.links || []).map(l => ({ text: l.text, href: l.href })),
    };
}
//# sourceMappingURL=navigation.data.js.map