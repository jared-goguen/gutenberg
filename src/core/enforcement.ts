// Enforcement hooks for tool usage limits

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

export type EnforcementCheckCallback = (
  input: EnforcementCheckInput
) => Promise<EnforcementCheckResult>;

class EnforcementRegistry {
  private callbacks: Set<EnforcementCheckCallback> = new Set();

  register(callback: EnforcementCheckCallback): void {
    this.callbacks.add(callback);
  }

  unregister(callback: EnforcementCheckCallback): void {
    this.callbacks.delete(callback);
  }

  async check(input: EnforcementCheckInput): Promise<EnforcementCheckResult> {
    // Run all enforcement checks
    // If any check rejects, return rejection immediately
    for (const callback of this.callbacks) {
      try {
        const result = await callback(input);
        if (!result.allowed) {
          return result;
        }
      } catch (err) {
        // Log enforcement check errors but don't block execution
        console.error("Enforcement check failed:", err);
      }
    }

    // All checks passed
    return { allowed: true };
  }
}

export const enforcementHooks = new EnforcementRegistry();
