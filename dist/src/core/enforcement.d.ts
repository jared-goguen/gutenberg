export interface EnforcementCheckInput {
    tool_name: string;
    input: Record<string, unknown>;
    timestamp: number;
}
export interface EnforcementCheckResult {
    allowed: boolean;
    reason?: string;
    limit_type?: string;
}
export type EnforcementCheckCallback = (input: EnforcementCheckInput) => Promise<EnforcementCheckResult>;
declare class EnforcementRegistry {
    private callbacks;
    register(callback: EnforcementCheckCallback): void;
    unregister(callback: EnforcementCheckCallback): void;
    check(input: EnforcementCheckInput): Promise<EnforcementCheckResult>;
}
export declare const enforcementHooks: EnforcementRegistry;
export {};
//# sourceMappingURL=enforcement.d.ts.map