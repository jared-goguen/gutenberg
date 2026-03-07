/**
 * Semantic Axes Resolver
 * Transforms vibe, intent, narrative, cohesion into concrete CSS classes
 *
 * Design:
 * - Each axis is independent (orthogonal)
 * - Styles are computed per-section, including context (previous/next)
 * - Cohesion depends on relationships; other axes are absolute
 * - All classes are Tailwind utilities for consistency
 */

import { Section, Vibe, Intent, Narrative, Cohesion } from "./types.js";
import type { ThemeSpec } from "./theme.js";

export interface SemanticContext {
  section: Section;
  prev?: Section;
  next?: Section;
  position: number;      // 0-indexed
  totalSections: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface SemanticStyles {
  // Container-level spacing and background
  container: {
    padding: string;         // py-X classes
    margin: string;          // mt-X from cohesion
    background: string;      // bg-X from cohesion/vibe
    divider: string;         // border/separator from cohesion
  };

  // Typography modifiers (applied to headings, body, etc.)
  typography: {
    heading: string;         // h1-h6 scale and weight from narrative/intent
    body: string;            // p and main text styles
    muted: string;           // secondary text (opacity, color)
    scale: number;           // multiplier for text sizes (narrative position)
  };

  // Color palette (derived from vibe, intent, cohesion context)
  colors: {
    text: string;            // text-X classes
    textMuted: string;       // muted text
    background: string;      // section background
    accent: string;          // for highlights/emphasis
    border: string;          // divider colors
  };

  // Interactive element styling
  interactive: {
    buttonPrimary: string;   // CTA buttons, primary action
    buttonSecondary: string; // alternative actions
    link: string;            // hyperlinks
  };

  // Visual emphasis/weight
  emphasis: {
    shadow: string;          // shadow-X from vibe
    border: string;          // border styling
  };

  // Metadata for renderer decisions
  metadata: {
    vibe: Vibe;
    intent: Intent;
    narrative: Narrative;
    cohesion: Cohesion;
  };
}

/**
 * Main resolver: compute all semantic styles for a section
 */
export function resolveSemanticStyles(
  ctx: SemanticContext,
  theme: ThemeSpec
): SemanticStyles {
  const section = ctx.section;

  // Resolve each axis independently
  const vibeStyles = resolveVibeStyles(section.vibe || "steady");
  const intentStyles = resolveIntentStyles(section.intent || "inform");
  const narrativeStyles = resolveNarrativeStyles(section.narrative || "rising");
  const cohesionStyles = resolveCohesionStyles(
    section.cohesion || "continues",
    ctx.prev,
    theme
  );

  // Merge all styles (cohesion has highest precedence for spacing/background)
  const merged = mergeSemanticStyles(
    vibeStyles,
    intentStyles,
    narrativeStyles,
    cohesionStyles
  );

  // Store metadata for template/component decisions
  merged.metadata = {
    vibe: section.vibe || "steady",
    intent: section.intent || "inform",
    narrative: section.narrative || "rising",
    cohesion: section.cohesion || "continues",
  };

  return merged;
}

/**
 * VIBE: visual and emotional energy
 * serene → gentle → steady → vibrant → intense → urgent
 */
function resolveVibeStyles(vibe: Vibe): Partial<SemanticStyles> {
  const baseStyles: Record<Vibe, Partial<SemanticStyles>> = {
    serene: {
      container: {
        padding: "py-32",
        margin: "",
        background: "",
        divider: "",
      },
      typography: {
        heading: "text-3xl md:text-4xl font-light tracking-wide",
        body: "text-base font-light leading-relaxed",
        muted: "text-neutral-500 opacity-90",
        scale: 1.0,
      },
      colors: {
        text: "text-neutral-700",
        textMuted: "text-neutral-500",
        background: "bg-white",
        accent: "text-primary-300",
        border: "border-neutral-100",
      },
      emphasis: {
        shadow: "shadow-none",
        border: "border-0",
      },
    },

    gentle: {
      container: {
        padding: "py-24",
        margin: "",
        background: "",
        divider: "",
      },
      typography: {
        heading: "text-3xl md:text-4xl font-normal tracking-normal",
        body: "text-base font-normal leading-relaxed",
        muted: "text-neutral-600 opacity-80",
        scale: 1.05,
      },
      colors: {
        text: "text-neutral-800",
        textMuted: "text-neutral-600",
        background: "bg-neutral-50",
        accent: "text-primary-400",
        border: "border-neutral-200",
      },
      emphasis: {
        shadow: "shadow-sm",
        border: "border-0",
      },
    },

    steady: {
      container: {
        padding: "py-20",
        margin: "",
        background: "",
        divider: "",
      },
      typography: {
        heading: "text-4xl md:text-5xl font-medium tracking-normal",
        body: "text-base font-normal",
        muted: "text-neutral-600",
        scale: 1.1,
      },
      colors: {
        text: "text-neutral-900",
        textMuted: "text-neutral-600",
        background: "bg-white",
        accent: "text-primary-500",
        border: "border-neutral-300",
      },
      emphasis: {
        shadow: "shadow",
        border: "border",
      },
    },

    vibrant: {
      container: {
        padding: "py-16",
        margin: "",
        background: "",
        divider: "",
      },
      typography: {
        heading: "text-4xl md:text-5xl font-semibold tracking-tight",
        body: "text-base font-medium",
        muted: "text-neutral-700",
        scale: 1.15,
      },
      colors: {
        text: "text-neutral-900",
        textMuted: "text-neutral-700",
        background: "bg-primary-50",
        accent: "text-primary-600",
        border: "border-primary-300",
      },
      emphasis: {
        shadow: "shadow-lg",
        border: "border",
      },
    },

    intense: {
      container: {
        padding: "py-12",
        margin: "",
        background: "",
        divider: "",
      },
      typography: {
        heading: "text-5xl md:text-6xl font-bold tracking-tight",
        body: "text-base font-semibold",
        muted: "text-neutral-800",
        scale: 1.2,
      },
      colors: {
        text: "text-neutral-950",
        textMuted: "text-neutral-800",
        background: "bg-primary-100",
        accent: "text-primary-700",
        border: "border-primary-500",
      },
      emphasis: {
        shadow: "shadow-xl",
        border: "border-2",
      },
    },

    urgent: {
      container: {
        padding: "py-10",
        margin: "",
        background: "",
        divider: "",
      },
      typography: {
        heading: "text-6xl font-black tracking-tighter",
        body: "text-base font-bold",
        muted: "text-neutral-900",
        scale: 1.25,
      },
      colors: {
        text: "text-neutral-950",
        textMuted: "text-neutral-800",
        background: "bg-red-50",
        accent: "text-red-700",
        border: "border-red-500",
      },
      emphasis: {
        shadow: "shadow-2xl",
        border: "border-2",
      },
    },
  };

  return baseStyles[vibe];
}

/**
 * INTENT: rhetorical purpose (Aristotelian rhetoric)
 * engage (pathos) → inform (logos) → persuade (ethos) → direct (kairos)
 */
function resolveIntentStyles(intent: Intent): Partial<SemanticStyles> {
  const baseStyles: Record<Intent, Partial<SemanticStyles>> = {
    engage: {
      typography: {
        heading: "font-bold",
        body: "leading-relaxed",
        muted: "italic",
        scale: 1.15,
      },
      colors: {
        accent: "text-primary-600",
        text: "text-neutral-900",
        textMuted: "text-neutral-700",
        background: "bg-primary-50",
        border: "border-primary-300",
      },
      interactive: {
        buttonPrimary: "bg-primary-600 hover:bg-primary-700 text-white",
        buttonSecondary: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
        link: "text-primary-600 underline hover:text-primary-700",
      },
    },

    inform: {
      typography: {
        heading: "font-semibold",
        body: "leading-normal",
        muted: "text-neutral-500",
        scale: 1.0,
      },
      colors: {
        accent: "text-neutral-700",
        text: "text-neutral-900",
        textMuted: "text-neutral-600",
        background: "bg-white",
        border: "border-neutral-200",
      },
      interactive: {
        buttonPrimary: "bg-neutral-900 hover:bg-neutral-800 text-white",
        buttonSecondary: "border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-50",
        link: "text-neutral-900 underline hover:text-neutral-700",
      },
    },

    persuade: {
      typography: {
        heading: "font-bold uppercase tracking-wide",
        body: "leading-relaxed font-medium",
        muted: "text-neutral-600",
        scale: 1.1,
      },
      colors: {
        accent: "text-primary-700",
        text: "text-neutral-900",
        textMuted: "text-neutral-700",
        background: "bg-primary-50",
        border: "border-primary-400",
      },
      interactive: {
        buttonPrimary: "bg-primary-700 hover:bg-primary-800 text-white shadow-lg",
        buttonSecondary: "border-2 border-primary-700 text-primary-700 hover:bg-primary-50",
        link: "text-primary-700 font-medium hover:underline",
      },
    },

    direct: {
      typography: {
        heading: "font-black text-lg md:text-xl",
        body: "font-semibold",
        muted: "text-neutral-700 font-medium",
        scale: 1.0,
      },
      colors: {
        accent: "text-red-600",
        text: "text-neutral-950",
        textMuted: "text-neutral-800",
        background: "bg-red-50",
        border: "border-red-500",
      },
      interactive: {
        buttonPrimary: "bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg",
        buttonSecondary: "border-2 border-red-600 text-red-600 hover:bg-red-50",
        link: "text-red-600 font-bold hover:underline",
      },
    },
  };

  return baseStyles[intent];
}

/**
 * NARRATIVE: position in dramatic arc (Freytag's Pyramid)
 * exposition → inciting → rising → climax → falling → resolution
 */
function resolveNarrativeStyles(
  narrative: Narrative
): Partial<SemanticStyles> {
  const baseStyles: Record<Narrative, Partial<SemanticStyles>> = {
    exposition: {
      container: { padding: "py-28", margin: "", background: "", divider: "" },
      typography: { heading: "", body: "", muted: "", scale: 1.0 },
      colors: {
        background: "bg-white",
        text: "text-neutral-800",
        textMuted: "text-neutral-600",
        accent: "text-primary-400",
        border: "border-neutral-100",
      },
      emphasis: { shadow: "shadow-none", border: "border-0" },
    },

    inciting: {
      container: { padding: "py-24", margin: "", background: "", divider: "" },
      typography: { heading: "", body: "", muted: "", scale: 1.05 },
      colors: {
        background: "bg-neutral-50",
        text: "text-neutral-850",
        textMuted: "text-neutral-650",
        accent: "text-primary-500",
        border: "border-neutral-200",
      },
      emphasis: { shadow: "shadow-sm", border: "border" },
    },

    rising: {
      container: { padding: "py-20", margin: "", background: "", divider: "" },
      typography: { heading: "", body: "", muted: "", scale: 1.1 },
      colors: {
        background: "bg-white",
        text: "text-neutral-900",
        textMuted: "text-neutral-700",
        accent: "text-primary-600",
        border: "border-neutral-300",
      },
      emphasis: { shadow: "shadow", border: "border" },
    },

    climax: {
      container: { padding: "py-16", margin: "", background: "", divider: "" },
      typography: { heading: "", body: "", muted: "", scale: 1.2 },
      colors: {
        background: "bg-primary-100",
        text: "text-neutral-950",
        textMuted: "text-neutral-850",
        accent: "text-primary-700",
        border: "border-primary-500",
      },
      emphasis: { shadow: "shadow-xl", border: "border-2" },
    },

    falling: {
      container: { padding: "py-22", margin: "", background: "", divider: "" },
      typography: { heading: "", body: "", muted: "", scale: 1.08 },
      colors: {
        background: "bg-neutral-50",
        text: "text-neutral-900",
        textMuted: "text-neutral-700",
        accent: "text-primary-600",
        border: "border-neutral-300",
      },
      emphasis: { shadow: "shadow", border: "border" },
    },

    resolution: {
      container: { padding: "py-24", margin: "", background: "", divider: "" },
      typography: { heading: "", body: "", muted: "", scale: 1.0 },
      colors: {
        background: "bg-white",
        text: "text-neutral-800",
        textMuted: "text-neutral-600",
        accent: "text-neutral-400",
        border: "border-neutral-200",
      },
      emphasis: { shadow: "shadow-sm", border: "border-0" },
    },
  };

  return baseStyles[narrative];
}

/**
 * COHESION: relationship to surrounding sections
 * opens | continues | amplifies | supports | contrasts | pivots | echoes | resolves | closes
 *
 * Most complex axis because it depends on previous section
 */
function resolveCohesionStyles(
  cohesion: Cohesion,
  prev: Section | undefined,
  theme: ThemeSpec
): Partial<SemanticStyles> {
  const baseStyles: Record<Cohesion, Partial<SemanticStyles>> = {
    opens: {
      container: {
        margin: "mt-32",
        padding: "py-24",
        background: "bg-white",
        divider: "",
      },
      colors: {
        background: "bg-white",
        border: "border-neutral-200",
        text: "text-neutral-900",
        textMuted: "text-neutral-600",
        accent: "text-primary-500",
      },
    },

    continues: {
      container: {
        margin: "mt-0",
        padding: "py-20",
        background: "",
        divider: "",
      },
      colors: {
        background: "",
        border: "border-transparent",
        text: "",
        textMuted: "",
        accent: "",
      },
    },

    amplifies: {
      container: {
        margin: "mt-4",
        padding: "py-20",
        background: "bg-primary-50",
        divider: "",
      },
      colors: {
        background: "bg-primary-50",
        border: "border-primary-200",
        text: "text-neutral-900",
        textMuted: "text-neutral-700",
        accent: "text-primary-700",
      },
    },

    supports: {
      container: {
        margin: "mt-8",
        padding: "py-16",
        background: "bg-neutral-50",
        divider: "border-t border-neutral-200",
      },
      colors: {
        background: "bg-neutral-50",
        border: "border-neutral-200",
        text: "text-neutral-800",
        textMuted: "text-neutral-600",
        accent: "text-neutral-600",
      },
    },

    contrasts: {
      container: {
        margin: "mt-20",
        padding: "py-20",
        background: "bg-neutral-900",
        divider: "border-t-4 border-neutral-700",
      },
      colors: {
        background: "bg-neutral-900",
        border: "border-neutral-700",
        text: "text-white",
        textMuted: "text-neutral-300",
        accent: "text-primary-300",
      },
    },

    pivots: {
      container: {
        margin: "mt-24",
        padding: "py-20",
        background: "bg-primary-600",
        divider: "border-t-8 border-primary-700",
      },
      colors: {
        background: "bg-primary-600",
        border: "border-primary-700",
        text: "text-white",
        textMuted: "text-primary-100",
        accent: "text-white",
      },
    },

    echoes: {
      container: {
        margin: "mt-16",
        padding: "py-20",
        background: "bg-primary-50",
        divider: "",
      },
      colors: {
        background: "bg-primary-50",
        border: "border-primary-300",
        text: "text-neutral-900",
        textMuted: "text-neutral-700",
        accent: "text-primary-600",
      },
    },

    resolves: {
      container: {
        margin: "mt-20",
        padding: "py-24",
        background: "bg-white",
        divider: "border-t border-neutral-100",
      },
      colors: {
        background: "bg-white",
        border: "border-neutral-100",
        text: "text-neutral-800",
        textMuted: "text-neutral-500",
        accent: "text-neutral-600",
      },
    },

    closes: {
      container: {
        margin: "mt-24",
        padding: "py-32",
        background: "bg-neutral-50",
        divider: "border-t-2 border-neutral-300",
      },
      colors: {
        background: "bg-neutral-50",
        border: "border-neutral-300",
        text: "text-neutral-900",
        textMuted: "text-neutral-600",
        accent: "text-neutral-500",
      },
    },
  };

  return baseStyles[cohesion];
}

/**
 * Merge semantic styles (later values override earlier, with smart appending for typography)
 */
function mergeSemanticStyles(
  ...styles: Partial<SemanticStyles>[]
): SemanticStyles {
  const result: SemanticStyles = {
    container: { padding: "", margin: "", background: "", divider: "" },
    typography: { heading: "", body: "", muted: "", scale: 1.0 },
    colors: {
      text: "",
      textMuted: "",
      background: "",
      accent: "",
      border: "",
    },
    interactive: {
      buttonPrimary: "",
      buttonSecondary: "",
      link: "",
    },
    emphasis: { shadow: "", border: "" },
    metadata: {
      vibe: "steady",
      intent: "inform",
      narrative: "rising",
      cohesion: "continues",
    },
  };

  for (const style of styles) {
    if (style.container) {
      result.container = { ...result.container, ...style.container };
    }
    if (style.typography) {
      // For typography, append modifier classes (font-weight, tracking, etc)
      // but keep the base size/family from vibe
      if (style.typography.heading) {
        // If the new heading doesn't contain a size (text-Xnl), keep the old one
        const hasSize = /text-\d+xl/.test(style.typography.heading);
        if (hasSize || !result.typography.heading) {
          result.typography.heading = style.typography.heading;
        } else if (result.typography.heading) {
          // Append modifier (like font-bold, tracking-tight) to existing heading
          result.typography.heading += ` ${style.typography.heading}`;
        }
      }
      if (style.typography.body) {
        result.typography.body = style.typography.body || result.typography.body;
      }
      if (style.typography.muted) {
        result.typography.muted = style.typography.muted || result.typography.muted;
      }
      if (style.typography.scale) {
        result.typography.scale = style.typography.scale;
      }
    }
    if (style.colors) {
      result.colors = { ...result.colors, ...style.colors };
    }
    if (style.interactive) {
      result.interactive = { ...result.interactive, ...style.interactive };
    }
    if (style.emphasis) {
      result.emphasis = { ...result.emphasis, ...style.emphasis };
    }
  }

  return result;
}

export default {
  resolveSemanticStyles,
  resolveVibeStyles,
  resolveIntentStyles,
  resolveNarrativeStyles,
  resolveCohesionStyles,
};
