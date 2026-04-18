import type { NavigationSection } from "../types.js";
export interface NavLinkData {
    text: string;
    href: string;
}
export interface NavigationData {
    variant: "default" | "centered" | "split";
    logo?: {
        text?: string;
        href?: string;
    };
    links: NavLinkData[];
}
export declare function extractNavigationData(section: NavigationSection): NavigationData;
//# sourceMappingURL=navigation.data.d.ts.map