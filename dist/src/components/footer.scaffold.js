/**
 * Footer scaffolding
 *
 * Converts FooterData to RenderNode tree
 */
import { createNode } from "../scaffold/node.js";
export function scaffoldFooter(data) {
    const children = [];
    // Top row: logo/description + links + social (if variant is detailed)
    if (data.variant === "detailed") {
        const topRowChildren = [];
        // Left column: logo + description
        if (data.logo || data.description) {
            const logoDescColumn = [];
            if (data.logo) {
                logoDescColumn.push(createNode("div", {
                    role: "footer-logo",
                    children: [data.logo.text || "Logo"],
                }));
            }
            if (data.description) {
                logoDescColumn.push(createNode("p", {
                    children: [data.description],
                }));
            }
            topRowChildren.push(createNode("div", {
                children: logoDescColumn,
            }));
        }
        // Middle: links
        if (data.links && data.links.length > 0) {
            topRowChildren.push(createNode("div", {
                role: "footer-links",
                layout: { flex: "true", gap: "md" },
                children: data.links.map(link => createNode("a", {
                    role: "footer-link",
                    attrs: { href: link.href },
                    children: [link.text],
                })),
            }));
        }
        // Right: social links
        if (data.social && data.social.length > 0) {
            topRowChildren.push(createNode("div", {
                role: "footer-social",
                layout: { flex: "true", gap: "sm" },
                children: data.social.map(social => createNode("a", {
                    attrs: { href: social.href, "aria-label": social.platform },
                    children: [social.platform],
                })),
            }));
        }
        if (topRowChildren.length > 0) {
            children.push(createNode("div", {
                layout: {
                    flex: "true",
                    justify: "between",
                    items: "start",
                    gap: "lg"
                },
                children: topRowChildren,
            }));
        }
    }
    else {
        // Simple variant: just logo + links in a row
        if (data.logo) {
            children.push(createNode("div", {
                role: "footer-logo",
                children: [data.logo.text || "Logo"],
            }));
        }
        if (data.links && data.links.length > 0) {
            children.push(createNode("div", {
                role: "footer-links",
                layout: { flex: "true", gap: "md" },
                children: data.links.map(link => createNode("a", {
                    role: "footer-link",
                    attrs: { href: link.href },
                    children: [link.text],
                })),
            }));
        }
    }
    // Copyright row (always at bottom if present)
    if (data.copyright) {
        children.push(createNode("p", {
            role: "footer-copy",
            children: [data.copyright],
        }));
    }
    return createNode("footer", {
        role: "footer-root",
        children: [
            createNode("div", {
                layout: { width: "standard" },
                children,
            }),
        ],
    });
}
//# sourceMappingURL=footer.scaffold.js.map