/**
 * ENRICH stage — walks RenderNode tree, resolves class names
 * 
 * Converts RenderNode (classless) to AnnotatedNode (with classes)
 * 
 * Classes are resolved from three independent sources:
 * 1. role → semantic component class (hero-heading, btn-primary, feature-card)
 * 2. layout → structural classes (layout-3col, width-narrow, align-center)
 * 3. semantic axes → modifier classes (vibe-vibrant, intent-engage, etc.)
 */

import type { RenderNode, AnnotatedNode } from "./scaffold/node.js";
import type { Vibe, Intent, Narrative, Cohesion } from "./types.js";

/**
 * Maps semantic roles to component class names
 * Each role maps to the CSS class name the theme stylesheet uses
 */
const roleToClasses: Record<string, string[]> = {
  // Section roots get no role-based classes (they get axis classes instead)
  "section-root": [],
  
  // Hero
  "hero-heading": ["hero-heading"],
  "hero-body": ["hero-body"],
  "hero-image": ["hero-image"],
  
  // Features
  "feature-card": ["feature-card"],
  "feature-card-accent": ["feature-card-accent"],
  "feature-icon": ["feature-icon"],
  "feature-title": ["feature-title"],
  "feature-body": ["feature-body"],
  "feature-link": ["feature-link"],
  
  // Buttons (these get no role-based classes; they're determined by their button type)
  "btn-primary": ["btn-primary"],
  "btn-secondary": ["btn-secondary"],
  "btn-outline": ["btn-outline"],
  "btn-ghost": ["btn-ghost"],
  
  // Content
  "content-prose": ["content-prose"],

  // Navigation
  "nav-root": ["nav-root"],
  "nav-logo": ["nav-logo"],
  "nav-link": ["nav-link"],
  
  // Footer
  "footer-root": ["footer-root"],
  "footer-logo": ["footer-logo"],
  "footer-links": [],
  "footer-link": ["footer-link"],
  "footer-copy": ["footer-copy"],
  "footer-social": [],
  
  // CTA
  "cta-heading": ["cta-heading"],
  "cta-body": ["cta-body"],
  
  // Section headings (used by features, navigation, etc.)
  "section-heading": ["section-heading"],
  
  // Section overline — small uppercase label above heading
  "section-overline": ["section-overline"],
  
  // Docs layout shell
  "docs-shell": ["docs-shell"],
  "docs-sidebar": ["docs-sidebar"],
  "docs-sidebar-right": ["docs-sidebar-right"],
  "docs-main": ["docs-main"],

  // Right sidebar TOC
  "toc-root": ["toc-root"],
  "toc-heading": ["toc-heading"],
  "toc-link": ["toc-link"],

  // Table component
  "table-container": ["table-container"],
  "table-cell-label": ["table-cell", "cell-label"],
  "table-cell-header": ["table-cell", "cell-header"],
  "table-cell-value": ["table-cell", "cell-value"],
  "table-cell-value-edit": ["table-cell", "cell-value"],
  "table-cell-spacer": ["table-cell", "cell-spacer"],

  // Edit mode specific
  "content-edit": ["content-edit"],
  "hero-heading-input": ["hero-heading"],
};

/**
 * Maps layout hints to structural class names
 * These are the same for all themes
 */
const layoutToClasses: Record<string, Record<string, string>> = {
  variant: {},  // specific per component
  width: {
    full: "width-full",
    narrow: "width-narrow",
    standard: "width-standard",
    wide: "width-wide",
  },
  align: {
    left: "align-left",
    center: "align-center",
    split: "align-split",
  },
  columns: {
    "2": "layout-2col",
    "3": "layout-3col",
    "4": "layout-4col",
  },
  gap: {
    sm: "gap-sm",
    md: "gap-md",
    lg: "gap-lg",
  },
  flex: {
    true: "flex",
    row: "flex-row",
    col: "flex-col",
  },
  justify: {
    center: "justify-center",
    between: "justify-between",
  },
  items: {
    center: "items-center",
    start: "items-start",
  },
};

/**
 * Maps semantic axes to modifier class names
 */
function getAxisClasses(axes: {
  vibe: Vibe;
  intent: Intent;
  narrative: Narrative;
  cohesion: Cohesion;
}): string[] {
  return [
    `vibe-${axes.vibe}`,
    `intent-${axes.intent}`,
    `narrative-${axes.narrative}`,
    `cohesion-${axes.cohesion}`,
  ];
}

/**
 * Compute color class for table cell values using heat-map gradient
 * Maps 0-1 normalized value to smooth 5-step color gradient
 * Called during enrichment for cells with 'table-cell-value' role
 */
function getTableCellColorClass(attrs: Record<string, string>): string | null {
  const cellType = attrs["data-cell-type"];
  const cellValue = attrs["data-cell-value"];
  const normalizedStr = attrs["data-normalized"];
  const invertColors = attrs["data-invert-colors"] === "true";

  if (!cellType) return null;

  if (cellType === "text") {
    return "cell-text";
  }

  if (cellType === "bool") {
    const isTrue = cellValue === "true" || cellValue === "1";
    return isTrue ? "cell-bool-true" : "cell-bool-false";
  }

  if (cellType === "numeric" && normalizedStr !== undefined) {
    const normalized = parseFloat(normalizedStr);

    // Map 0-1 to 5 color steps in heat-map gradient
    // Default: cool (low) → warm (high)
    let colorClass: string;

    if (!invertColors) {
      // Heat-map gradient: cool (low values) → warm (high values)
      if (normalized < 0.2) colorClass = "cell-heat-very-low";
      else if (normalized < 0.4) colorClass = "cell-heat-low";
      else if (normalized < 0.6) colorClass = "cell-heat-mid";
      else if (normalized < 0.8) colorClass = "cell-heat-high";
      else colorClass = "cell-heat-very-high";
    } else {
      // Inverted: warm (low values) → cool (high values)
      if (normalized < 0.2) colorClass = "cell-heat-very-high";
      else if (normalized < 0.4) colorClass = "cell-heat-high";
      else if (normalized < 0.6) colorClass = "cell-heat-mid";
      else if (normalized < 0.8) colorClass = "cell-heat-low";
      else colorClass = "cell-heat-very-low";
    }

    return colorClass;
  }

  return null;
}

/**
 * Enriches a single RenderNode to AnnotatedNode by resolving all class names
 */
function enrichNode(node: RenderNode): AnnotatedNode {
  const classes: string[] = [];
  
  // Source 1: Role → semantic component class
  if (node.role && node.role in roleToClasses) {
    classes.push(...roleToClasses[node.role]);
  }
  
  // Source 2: Layout hints → structural classes
  if (node.layout) {
    for (const [key, value] of Object.entries(node.layout)) {
      if (key in layoutToClasses && value in layoutToClasses[key]) {
        classes.push(layoutToClasses[key][value]);
      }
    }
  }
  
  // Source 3: Semantic axes → modifier classes (section roots only)
  if (node.semantic) {
    classes.push(...getAxisClasses(node.semantic));
  }

  // Source 4: Table cell color computation (special case for table-cell-value role)
  if (node.role === "table-cell-value") {
    const colorClass = getTableCellColorClass(node.attrs);
    if (colorClass) {
      classes.push(colorClass);
    }
  }
  
  // Recursively enrich children (filter out any null/undefined values)
  const enrichedChildren = node.children
    .filter((child) => child != null)
    .map((child) => {
      if (typeof child === "string") {
        return child;
      }
      return enrichNode(child);
    });
  
  return {
    ...node,
    classes,
    children: enrichedChildren,
  };
}

/**
 * Enrich an array of RenderNode trees to AnnotatedNode trees
 */
export function enrichRenderNodes(nodes: RenderNode[]): AnnotatedNode[] {
  return nodes.map(enrichNode);
}

/**
 * Enrich a single RenderNode
 */
export function enrichRenderNode(node: RenderNode): AnnotatedNode {
  return enrichNode(node);
}
