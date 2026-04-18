// Enforcement hooks for tool usage limits
class EnforcementRegistry {
    callbacks = new Set();
    register(callback) {
        this.callbacks.add(callback);
    }
    unregister(callback) {
        this.callbacks.delete(callback);
    }
    async check(input) {
        // Run all enforcement checks
        // If any check rejects, return rejection immediately
        for (const callback of this.callbacks) {
            try {
                const result = await callback(input);
                if (!result.allowed) {
                    return result;
                }
            }
            catch (err) {
                // Log enforcement check errors but don't block execution
                console.error("Enforcement check failed:", err);
            }
        }
        // All checks passed
        return { allowed: true };
    }
}
export const enforcementHooks = new EnforcementRegistry();
//# sourceMappingURL=enforcement.js.map