/**
 * CTA (Call-to-Action) scaffolding
 *
 * Converts CtaData to RenderNode tree (classless HTML structure)
 */
import { createNode } from "../scaffold/node.js";
/**
 * Scaffold CTA section into RenderNode tree
 *
 * Structure varies by variant:
 * - centered: vertical stack, centered alignment, all buttons stacked vertically
 * - split: two-column layout, text left, buttons right
 * - banner: full-width dark section with white text, buttons inline
 */
export function scaffoldCta(data) {
    switch (data.variant) {
        case "centered":
            return scaffoldCtaCentered(data);
        case "split":
            return scaffoldCtaSplit(data);
        case "banner":
            return scaffoldCtaBanner(data);
        default:
            return scaffoldCtaCentered(data);
    }
}
function scaffoldCtaCentered(data) {
    const children = [
        createNode("div", {
            layout: { width: "narrow", align: "center" },
            children: [
                ...(data.overline
                    ? [createNode("p", { role: "section-overline", children: [data.overline] })]
                    : []),
                createNode("h2", {
                    role: "cta-heading",
                    children: [data.heading],
                }),
                ...(data.description
                    ? [
                        createNode("p", {
                            role: "cta-body",
                            children: [data.description],
                        }),
                    ]
                    : []),
                createNode("div", {
                    layout: { align: "center" },
                    children: data.ctas.map((cta) => createNode("a", {
                        role: "btn-primary",
                        attrs: { href: cta.href },
                        children: [cta.text],
                    })),
                }),
            ],
        }),
    ];
    return createNode("section", {
        role: "section-root",
        layout: { variant: "centered" },
        children,
    });
}
function scaffoldCtaSplit(data) {
    return createNode("section", {
        role: "section-root",
        layout: { variant: "split" },
        children: [
            createNode("div", {
                layout: { width: "standard", align: "split" },
                children: [
                    createNode("div", {
                        children: [
                            createNode("h2", {
                                role: "cta-heading",
                                children: [data.heading],
                            }),
                            ...(data.description
                                ? [
                                    createNode("p", {
                                        role: "cta-body",
                                        children: [data.description],
                                    }),
                                ]
                                : []),
                        ],
                    }),
                    createNode("div", {
                        layout: { align: "left" },
                        children: data.ctas.map((cta) => createNode("a", {
                            role: "btn-primary",
                            attrs: { href: cta.href },
                            children: [cta.text],
                        })),
                    }),
                ],
            }),
        ],
    });
}
function scaffoldCtaBanner(data) {
    return createNode("section", {
        role: "section-root",
        layout: { variant: "banner" },
        children: [
            createNode("div", {
                layout: { width: "wide", align: "center" },
                children: [
                    createNode("h2", {
                        role: "cta-heading",
                        children: [data.heading],
                    }),
                    ...(data.description
                        ? [
                            createNode("p", {
                                role: "cta-body",
                                children: [data.description],
                            }),
                        ]
                        : []),
                    createNode("div", {
                        layout: { align: "center" },
                        children: data.ctas.map((cta) => createNode("a", {
                            role: "btn-primary",
                            attrs: { href: cta.href },
                            children: [cta.text],
                        })),
                    }),
                ],
            }),
        ],
    });
}
//# sourceMappingURL=cta.scaffold.js.map