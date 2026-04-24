/**
 * MCP tool: unified page spec linter.
 *
 * Runs structural validation (schema + sanitize) then visual rhythm checks (V1–V27)
 * on PageSpec YAML. Single file, inline YAML, or batch directory mode.
 *
 * Structural: parse errors, required fields, type issues
 * Rhythm: V1 prose density, V2 section variety, V3 block variety
 * Color:  V4 color intent
 * Content: V5 thin cards, V6 stubby flow chain, V26 card density, V27 card block density
 * Structure: V7 missing opening, V8 frame gaps, V9 anemic section, V10 section balance
 * Repetition: V11 layout monotony
 * Density: V15 caption stacking, V16 section density, V17 scheme fragmentation, V18 identical consecutive
 * Hygiene: V20 no title field in specs
 * Markup: V23 presentational markup
 * Escape: V24 escape artifacts
 */
export declare function handler(input: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
}>;
//# sourceMappingURL=index.d.ts.map