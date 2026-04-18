import { createNode } from "../scaffold/node.js";
export function scaffoldFeatures(data) {
    const gridCols = data.variant === "list" ? null : data.variant.split("-")[1];
    const cardRole = data.card_style === "accent-border" ? "feature-card-accent" : "feature-card";
    const featureItems = data.items.map(item => {
        // Extract link href and text (supports both string and object formats)
        let linkHref;
        let linkText = "Learn more";
        if (item.link) {
            if (typeof item.link === "string") {
                linkHref = item.link;
            }
            else {
                linkHref = item.link.href;
                linkText = item.link.text || linkText;
            }
        }
        return createNode("div", {
            role: cardRole,
            children: [
                ...(item.icon ? [createNode("div", { role: "feature-icon", children: [item.icon] })] : []),
                createNode("h3", { role: "feature-title", children: [item.title] }),
                createNode("p", { role: "feature-body", children: [item.description] }),
                ...(linkHref ? [createNode("a", { role: "feature-link", attrs: { href: linkHref }, children: [linkText] })] : []),
            ],
        });
    });
    const children = [
        createNode("div", {
            layout: { width: "standard" },
            children: [
                ...(data.overline ? [createNode("p", { role: "section-overline", children: [data.overline] })] : []),
                ...(data.heading ? [createNode("h2", { role: "section-heading", children: [data.heading] })] : []),
                ...(data.subheading ? [createNode("p", { children: [data.subheading] })] : []),
                createNode("div", {
                    layout: gridCols ? { columns: gridCols } : { flex: "true", col: "flex-col" },
                    children: featureItems,
                }),
            ],
        }),
    ];
    return createNode("section", { role: "section-root", children });
}
//# sourceMappingURL=features.scaffold.js.map