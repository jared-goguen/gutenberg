/**
 * SCAFFOLD Stage — PageSchema → RenderNode[]
 *
 * Converts a page schema into a tree of RenderNode structures (classless HTML)
 * Each section is scaffolded according to its type
 */
import { createNode } from "../scaffold/node.js";
import { scaffoldHero } from "../components/hero.scaffold.js";
import { scaffoldFeatures } from "../components/features.scaffold.js";
import { scaffoldContent } from "../components/content.scaffold.js";
import { scaffoldCta } from "../components/cta.scaffold.js";
import { scaffoldNavigation } from "../components/navigation.scaffold.js";
import { scaffoldTable } from "../components/table.scaffold.js";
import { extractHeroData } from "../components/hero.data.js";
import { extractFeaturesData } from "../components/features.data.js";
import { extractContentData } from "../components/content.data.js";
import { extractCtaData } from "../components/cta.data.js";
import { extractNavigationData } from "../components/navigation.data.js";
/**
 * Extract a TOC label and ID from a section.
 * Returns null for sections that shouldn't appear in the TOC (nav, footer).
 */
function extractTocEntry(section) {
    let label = null;
    if (section.type === "hero") {
        label = section.content?.heading ?? null;
    }
    else if (section.type === "features") {
        label = section.heading ?? null;
    }
    else if (section.type === "content") {
        const md = section.markdown ?? "";
        const h2 = md.match(/^##\s+(.+)$/m);
        const h1 = md.match(/^#\s+(.+)$/m);
        label = (h2?.[1] ?? h1?.[1]) ?? null;
    }
    else if (section.type === "cta") {
        label = section.heading ?? null;
    }
    if (!label)
        return null;
    const id = section.id ||
        label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { id, label };
}
/**
 * Scaffold a page schema into RenderNode tree
 *
 * Returns an array of section RenderNodes, one per page section.
 * Each RenderNode has semantic axes attached (for ENRICH stage to read).
 *
 * For docs layout: nav → left sidebar, content → main, auto-TOC → right sidebar.
 * Three-column shell: docs-sidebar | docs-main | docs-sidebar-right
 *
 * @param schema The page schema to scaffold
 * @param mode 'view' (default) or 'edit' - determines if components scaffold as inputs or display elements
 */
export function scaffold(schema, mode = 'view') {
    const { sections } = schema.page;
    const layoutType = schema.page.layout?.type;
    // Build all section nodes with semantic axes
    const allNodes = sections.map((section) => {
        const axes = {
            vibe: (section.vibe || "steady"),
            intent: (section.intent || "inform"),
            narrative: (section.narrative || "rising"),
            cohesion: (section.cohesion || "continues"),
        };
        return { node: scaffoldSection(section, axes, mode), type: section.type, section };
    });
    // Docs layout: left sidebar (nav), main (content), right sidebar (TOC)
    if (layoutType === "docs") {
        const navEntry = allNodes.find(n => n.type === "navigation");
        const contentEntries = allNodes.filter(n => n.type !== "navigation");
        // Assign IDs to content sections and collect TOC entries
        const tocEntries = [];
        for (const entry of contentEntries) {
            const toc = extractTocEntry(entry.section);
            if (toc) {
                entry.node.attrs = { ...entry.node.attrs, id: toc.id };
                tocEntries.push(toc);
            }
        }
        // Build right sidebar TOC
        const tocLinks = tocEntries.map(entry => createNode("a", {
            role: "toc-link",
            attrs: { href: `#${entry.id}` },
            children: [entry.label],
        }));
        const tocNode = createNode("nav", {
            role: "toc-root",
            children: [
                createNode("p", { role: "toc-heading", children: ["On this page"] }),
                ...tocLinks,
            ],
        });
        const docsShell = createNode("div", {
            role: "docs-shell",
            children: [
                createNode("aside", {
                    role: "docs-sidebar",
                    children: navEntry ? [navEntry.node] : [],
                }),
                createNode("main", {
                    role: "docs-main",
                    children: contentEntries.map(e => e.node),
                }),
                createNode("aside", {
                    role: "docs-sidebar-right",
                    children: [tocNode],
                }),
            ],
        });
        return [docsShell];
    }
    return allNodes.map(e => e.node);
}
/**
 * Scaffold a single section based on its type
 *
 * @param section The section to scaffold
 * @param axes Semantic axes for the section
 * @param mode 'view' (default) or 'edit' - controls how components are rendered
 */
function scaffoldSection(section, axes, mode = 'view') {
    let node;
    switch (section.type) {
        case "hero": {
            const data = extractHeroData(section);
            // Pass both data and original section so we can check _editable flag
            node = scaffoldHero(data, mode, section);
            break;
        }
        case "features": {
            const data = extractFeaturesData(section);
            node = scaffoldFeatures(data);
            break;
        }
        case "content": {
            const data = extractContentData(section);
            // Pass both data and original section so we can check _editable flag
            node = scaffoldContent(data, mode, section);
            break;
        }
        case "cta": {
            const data = extractCtaData(section);
            node = scaffoldCta(data);
            break;
        }
        case "navigation": {
            // Hide navigation in edit mode
            if (mode === 'edit') {
                node = createNode("div", {
                    attrs: { style: "display: none;" },
                    children: [],
                });
            }
            else {
                const data = extractNavigationData(section);
                node = scaffoldNavigation(data);
            }
            break;
        }
        case "footer": {
            // Never render footer (removed from all pages)
            node = createNode("div", {
                attrs: { style: "display: none;" },
                children: [],
            });
            break;
        }
        case "table": {
            node = scaffoldTable(section, mode);
            break;
        }
        // Placeholder for any unknown component types
        default:
            node = createNode("section", {
                role: "section-root",
                children: [
                    createNode("div", {
                        children: [`[${section.type} section - not yet implemented]`],
                    }),
                ],
            });
    }
    // Attach semantic axes to the root node
    node.semantic = axes;
    return node;
}
//# sourceMappingURL=scaffold.js.map