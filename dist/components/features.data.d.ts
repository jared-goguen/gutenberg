import type { FeaturesSection } from "../types.js";
export interface FeaturesData {
    variant: "grid-2" | "grid-3" | "grid-4" | "list";
    overline?: string;
    card_style?: "material" | "accent-border";
    heading?: string;
    subheading?: string;
    items: Array<{
        icon?: string;
        title: string;
        description: string;
        link?: string | {
            text: string;
            href: string;
        };
    }>;
}
export declare function extractFeaturesData(section: FeaturesSection): FeaturesData;
//# sourceMappingURL=features.data.d.ts.map