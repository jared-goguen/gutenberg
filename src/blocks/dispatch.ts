import type {
  SpecBlock, HeroSpec, SuperheroSpec, ClosingSpec,
  CardsSpec, StatSpec, PageNavSpec, ProseSpec, SectionLabelSpec,
  FlowChainSpec, BadgeSpec, TableSpec, HeadingSpec,
  InfoBoxSpec, TransformSpec, CalloutSpec, TimelineSpec,
} from "../specs/page/index.js";
import { blockType, blockValue } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { renderHero } from "./hero.js";
import { renderClosing } from "./closing.js";
import { renderCards } from "./cards.js";
import { renderProse } from "./prose.js";
import { renderSectionLabel } from "./section-label.js";
import { renderFlowChain } from "./flow-chain.js";
import { renderBadge } from "./badge.js";
import { renderTable } from "./table.js";
import { renderHeading } from "./heading.js";
import { renderInfoBox } from "./info-box.js";
import { renderStat } from "./stat.js";
import { renderPageNav } from "./page-nav.js";
import { renderTransform } from "./transform.js";
import { renderCallout } from "./callout.js";
import { renderTimeline } from "./timeline.js";
import { renderSuperhero } from "./superhero.js";
import type { ShowcaseFlags, BlockEnrichment } from "../enrich.js";

/**
 * Dispatch a SpecBlock to its renderer.
 */
export function renderBlock(
  block: SpecBlock,
  ctx: RenderContext,
  allBlocks?: SpecBlock[],
  showcase?: ShowcaseFlags,
  enrichment?: BlockEnrichment,
): string {
  const type = blockType(block);
  const val = blockValue(block);

  switch (type) {
    case "hero":
      return renderHero(val as HeroSpec, ctx);
    case "superhero": {
      const flags = showcase ?? { texture: false, heroMesh: false, heroParticles: false, heroFull: false };
      if (!showcase && typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
        console.warn(
          "⚠️  renderBlock('superhero') called without showcase flags. " +
          "Superhero will render as a centerless viewport box with no effects. " +
          "Did you forget to pass showcase from plan()?"
        );
      }
      return renderSuperhero(val as SuperheroSpec, ctx, flags);
    }
    case "closing":
      return renderClosing(val as ClosingSpec, ctx);
    case "cards":
      return renderCards(val as CardsSpec, ctx, enrichment);
    case "stat":
      return renderStat(val as StatSpec, ctx, enrichment);
    case "page_nav":
      return renderPageNav(val as PageNavSpec, ctx, allBlocks);
    case "prose":
      return renderProse(val as ProseSpec, ctx, enrichment);
    case "section_label":
      return renderSectionLabel(val as SectionLabelSpec, ctx);
    case "flow_chain":
      return renderFlowChain(val as FlowChainSpec, ctx);
    case "badge":
      return renderBadge(val as BadgeSpec, ctx);
    case "table":
      return renderTable(val as TableSpec, ctx, enrichment);
    case "heading":
      return renderHeading(val as HeadingSpec, ctx);
    case "info_box":
      return renderInfoBox(val as InfoBoxSpec, ctx);
    case "transform":
      return renderTransform(val as TransformSpec, ctx);
    case "callout":
      return renderCallout(val as CalloutSpec, ctx);
    case "timeline":
      return renderTimeline(val as TimelineSpec, ctx);

    default:
      return `<!-- gb: unknown block "${type}" -->`;
  }
}
