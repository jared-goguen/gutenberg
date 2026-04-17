/**
 * Scaffold intermediate types
 * 
 * SCAFFOLD stage produces RenderNode trees (classless HTML structure)
 * ENRICH stage consumes RenderNode, produces AnnotatedNode (with classes)
 * STYLE stage consumes AnnotatedNode, produces HTML string with CSS
 */

import type { Vibe, Intent, Narrative, Cohesion } from "../types.js";

/**
 * Semantic axes for a section
 */
export interface SemanticAxes {
  vibe: Vibe;
  intent: Intent;
  narrative: Narrative;
  cohesion: Cohesion;
}

/**
 * RenderNode — output of SCAFFOLD stage
 * Pure HTML structure with no class attributes.
 * 
 * Carries:
 * - HTML structure (tag, attrs, children)
 * - Semantic roles (role: 'hero-heading', 'btn-primary')
 * - Layout hints (variant, width, columns)
 * - Semantic axes (on section roots only)
 * 
 * Does NOT carry: class names, inline styles, or CSS decisions
 */
export interface RenderNode {
  tag: string;                                    // 'section', 'h1', 'a', 'div', etc.
  role?: string;                                 // semantic identifier: 'hero-heading', 'btn-primary', 'feature-card'
  
  attrs: Record<string, string>;                 // href, id, src, alt, data-*, etc. — NOT class
  
  layout?: Record<string, string>;               // structural hints: variant, width, align, columns, gap
  
  semantic?: SemanticAxes;                       // vibe, intent, narrative, cohesion (section roots only)
  
  rawHtml?: string;                              // pre-rendered HTML to inject as inner content (bypasses escaping)
  
  children: (RenderNode | string)[];             // child nodes or text content
}

/**
 * AnnotatedNode — output of ENRICH stage
 * RenderNode with classes resolved and added.
 * 
 * Same structure, but now includes classes: string[] resolved from:
 * - role → semantic component class ('hero-heading')
 * - layout → structural classes ('layout-3col', 'width-narrow')
 * - semantic axes → modifier classes ('vibe-vibrant', 'intent-engage')
 */
export interface AnnotatedNode extends RenderNode {
  classes: string[];                             // resolved CSS class names
  children: (AnnotatedNode | string)[];          // children are also AnnotatedNode
}

/**
 * Helper to create a RenderNode
 */
export function createNode(
  tag: string,
  options: {
    role?: string;
    attrs?: Record<string, string>;
    layout?: Record<string, string>;
    semantic?: SemanticAxes;
    rawHtml?: string;
    children?: (RenderNode | string)[];
  } = {}
): RenderNode {
  return {
    tag,
    role: options.role,
    attrs: options.attrs || {},
    layout: options.layout,
    semantic: options.semantic,
    rawHtml: options.rawHtml,
    children: options.children || [],
  };
}

/**
 * Type guard: is this an AnnotatedNode?
 */
export function isAnnotatedNode(node: RenderNode | AnnotatedNode): node is AnnotatedNode {
  return 'classes' in node && Array.isArray((node as any).classes);
}
