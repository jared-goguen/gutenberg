// Simple event hooks system for tool tracking and monitoring

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
    content: Array<{ type: string; text: string }>;
  };
}

export type HookCallback = (event: ToolResultEvent) => void | Promise<void>;

class HookRegistry {
  private callbacks: Set<HookCallback> = new Set();

  register(callback: HookCallback): void {
    this.callbacks.add(callback);
  }

  unregister(callback: HookCallback): void {
    this.callbacks.delete(callback);
  }

  async emit(event: ToolResultEvent): Promise<void> {
    const promises = Array.from(this.callbacks).map((cb) =>
      Promise.resolve(cb(event)).catch((err) => {
        // Log hook errors but don't fail tool execution
        console.error("Hook execution failed:", err);
      })
    );
    await Promise.all(promises);
  }
}

export const toolHooks = new HookRegistry();
