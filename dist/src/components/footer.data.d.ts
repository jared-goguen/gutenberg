import type { FooterSection } from "../types.js";
export interface FooterData {
    variant: "simple" | "detailed" | "newsletter";
    logo?: {
        text?: string;
        image?: string;
    };
    description?: string;
    links?: Array<{
        text: string;
        href: string;
    }>;
    social?: Array<{
        platform: string;
        href: string;
    }>;
    copyright?: string;
}
export declare function extractFooterData(section: FooterSection): FooterData;
//# sourceMappingURL=footer.data.d.ts.map