export interface CtaData {
    variant: "centered" | "split" | "banner";
    overline?: string;
    heading: string;
    description?: string;
    ctas: Array<{
        text: string;
        href: string;
    }>;
}
export declare function extractCtaData(section: any): CtaData;
//# sourceMappingURL=cta.data.d.ts.map