export interface ToolCallEvent {
    tool_name: string;
    input: Record<string, unknown>;
    timestamp: number;
}
export interface ToolResultEvent extends ToolCallEvent {
    duration_ms: number;
    success: boolean;
    error?: string;
    result?: {
        content: Array<{
            type: string;
            text: string;
        }>;
    };
}
export type HookCallback = (event: ToolResultEvent) => void | Promise<void>;
declare class HookRegistry {
    private callbacks;
    register(callback: HookCallback): void;
    unregister(callback: HookCallback): void;
    emit(event: ToolResultEvent): Promise<void>;
}
export declare const toolHooks: HookRegistry;
export {};
//# sourceMappingURL=hooks.d.ts.map