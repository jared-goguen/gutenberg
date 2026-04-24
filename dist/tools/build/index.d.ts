/**
 * Build tool — compiles YAML specs to .site/ using the ported rendering engine.
 *
 * Pipeline: readProjectConfig → discoverSpecs → plan → render (html5) → write .site/
 *
 * Keeps handler(input) export for convention-based tool discovery.
 */
export declare function handler(input: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=index.d.ts.map