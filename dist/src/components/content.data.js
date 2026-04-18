export function extractContentData(section) {
    const variant = section.variant || "prose";
    return {
        variant,
        markdown: section.markdown,
        html: section.html
    };
}
//# sourceMappingURL=content.data.js.map