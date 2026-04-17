import type { RenderNode } from "../scaffold/node.js";
import type { NavigationData } from "./navigation.data.js";
import { createNode } from "../scaffold/node.js";

export function scaffoldNavigation(data: NavigationData): RenderNode {
  const navLinks = data.links.map(link =>
    createNode("a", {
      role: "nav-link",
      attrs: { href: link.href },
      children: [link.text],
    })
  );

  return createNode("nav", {
    role: "nav-root",
    children: [
      createNode("div", {
        layout: { 
          width: "standard",
          flex: "true",
          justify: "between",
          items: "center"
        },
        children: [
          ...(data.logo ? [createNode("a", { role: "nav-logo", attrs: { href: data.logo.href || "/" }, children: [data.logo.text ?? ""] })] : []),
          createNode("div", {
            layout: { 
              flex: "true",
              gap: "sm"
            },
            children: navLinks
          }),
        ],
      }),
    ],
  });
}
