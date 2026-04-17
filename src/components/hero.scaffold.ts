/**
 * Hero scaffolding
 * 
 * Converts HeroData to RenderNode tree (classless HTML structure)
 */

import type { RenderNode } from "../scaffold/node.js";
import type { HeroData } from "./hero.data.js";
import { createNode } from "../scaffold/node.js";

/**
 * Scaffold hero section into RenderNode tree
 * 
 * Structure varies by variant:
 * - centered: vertical stack, content centered, image below
 * - split: two-column grid, text left, image right (reverses on mobile)
 * - full-bleed: full-width background with centered overlay
 * 
 * @param data Hero data
 * @param mode 'view' (default) or 'edit' - controls if heading is editable
 * @param section Original section object (contains _editable flag)
 */
export function scaffoldHero(data: HeroData, mode: 'view' | 'edit' = 'view', section?: any): RenderNode {
  // In edit mode, render as input field (handled in edit-specific function)
  if (mode === 'edit' && section?._editable === true) {
    return scaffoldHeroEdit(data);
  }

  // View mode or non-editable hero - use standard variants
  switch (data.variant) {
    case "centered":
      return scaffoldHeroCentered(data);
    case "split":
      return scaffoldHeroSplit(data);
    case "full-bleed":
      return scaffoldHeroFullBleed(data);
    default:
      return scaffoldHeroCentered(data);
  }
}

function scaffoldHeroEdit(data: HeroData): RenderNode {
  const children: (RenderNode | string)[] = [
    createNode("div", {
      layout: { width: "narrow", align: "left" },
      children: [
        // Heading as input field
        createNode("input", {
          attrs: {
            type: "text",
            name: "hero__heading",
            value: data.heading,
            class: "hero-heading-input"
          },
        }),
      ],
    }),
  ];
  return createNode("section", {
    role: "section-root",
    children,
  });
}

function scaffoldHeroCentered(data: HeroData): RenderNode {
  const children: (RenderNode | string)[] = [
    createNode("div", {
      layout: { width: "narrow", align: "left" },
      children: [
        ...(data.overline
          ? [createNode("p", { role: "section-overline", children: [data.overline] })]
          : []),
        createNode("h1", {
          role: "hero-heading",
          children: [data.heading],
        }),
        ...(data.subheading
          ? [
              createNode("p", {
                role: "hero-body",
                children: [data.subheading],
              }),
            ]
          : []),
        ...(data.body
          ? [
              createNode("p", {
                role: "hero-body",
                children: [data.body],
              }),
            ]
          : []),
        // CTAs
        ...(data.ctas.length > 0 || data.secondaryCtas.length > 0
          ? [
              createNode("div", {
                layout: { align: "left" },
                children: [
                  ...data.ctas.map((cta) =>
                    createNode("a", {
                      role: "btn-primary",
                      attrs: { href: cta.href },
                      children: [cta.text],
                    })
                  ),
                  ...data.secondaryCtas.map((cta) =>
                    createNode("a", {
                      role: "btn-secondary",
                      attrs: { href: cta.href },
                      children: [cta.text],
                    })
                  ),
                ],
              }),
            ]
          : []),
        // Image
        ...(data.image
          ? [
              createNode("div", {
                role: "hero-image",
                layout: { align: "left" },
                children: [
                  createNode("img", {
                    attrs: {
                      src: data.image.src,
                      alt: data.image.alt,
                    },
                  }),
                ],
              }),
            ]
          : []),
      ],
    }),
  ];

  return createNode("section", {
    role: "section-root",
    layout: { variant: "centered" },
    children,
  });
}

function scaffoldHeroSplit(data: HeroData): RenderNode {
  const textContent = [
    ...(data.overline
      ? [createNode("p", { role: "section-overline", children: [data.overline] })]
      : []),
    createNode("h1", {
      role: "hero-heading",
      children: [data.heading],
    }),
    ...(data.subheading
      ? [
          createNode("p", {
            role: "hero-body",
            children: [data.subheading],
          }),
        ]
      : []),
    ...(data.body
      ? [
          createNode("p", {
            role: "hero-body",
            children: [data.body],
          }),
        ]
      : []),
    ...(data.ctas.length > 0 || data.secondaryCtas.length > 0
      ? [
          createNode("div", {
            layout: { align: "left" },
            children: [
              ...data.ctas.map((cta) =>
                createNode("a", {
                  role: "btn-primary",
                  attrs: { href: cta.href },
                  children: [cta.text],
                })
              ),
              ...data.secondaryCtas.map((cta) =>
                createNode("a", {
                  role: "btn-secondary",
                  attrs: { href: cta.href },
                  children: [cta.text],
                })
              ),
            ],
          }),
        ]
      : []),
  ];

  const imageContent = data.image
    ? [
        createNode("img", {
          attrs: {
            src: data.image.src,
            alt: data.image.alt,
          },
        }),
      ]
    : [];

  const children: (RenderNode | string)[] = [
    createNode("div", {
      layout: { align: "split" },
      children: [
        createNode("div", {
          children: textContent,
        }),
        ...(imageContent.length > 0
          ? [
              createNode("div", {
                role: "hero-image",
                children: imageContent,
              }),
            ]
          : []),
      ],
    }),
  ];

  return createNode("section", {
    role: "section-root",
    layout: { variant: "split" },
    children,
  });
}

function scaffoldHeroFullBleed(data: HeroData): RenderNode {
  const children: (RenderNode | string)[] = [
    createNode("div", {
      layout: { align: "left" },
      attrs: {
        ...(data.backgroundImage
          ? { style: `background-image: url('${data.backgroundImage}')` }
          : {}),
      },
      children: [
        createNode("div", {
          layout: { width: "narrow" },
          children: [
            ...(data.overline
              ? [createNode("p", { role: "section-overline", children: [data.overline] })]
              : []),
            createNode("h1", {
              role: "hero-heading",
              children: [data.heading],
            }),
            ...(data.subheading
              ? [
                  createNode("p", {
                    role: "hero-body",
                    children: [data.subheading],
                  }),
                ]
              : []),
            ...(data.body
              ? [
                  createNode("p", {
                    role: "hero-body",
                    children: [data.body],
                  }),
                ]
              : []),
            ...(data.ctas.length > 0 || data.secondaryCtas.length > 0
              ? [
                  createNode("div", {
                    layout: { align: "left" },
                    children: [
                      ...data.ctas.map((cta) =>
                        createNode("a", {
                          role: "btn-primary",
                          attrs: { href: cta.href },
                          children: [cta.text],
                        })
                      ),
                      ...data.secondaryCtas.map((cta) =>
                        createNode("a", {
                          role: "btn-secondary",
                          attrs: { href: cta.href },
                          children: [cta.text],
                        })
                      ),
                    ],
                  }),
                ]
              : []),
          ],
        }),
      ],
    }),
  ];

  return createNode("section", {
    role: "section-root",
    layout: { variant: "full-bleed" },
    children,
  });
}
