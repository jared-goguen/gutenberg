// Simple event hooks system for tool tracking and monitoring
class HookRegistry {
    callbacks = new Set();
    register(callback) {
        this.callbacks.add(callback);
    }
    unregister(callback) {
        this.callbacks.delete(callback);
    }
    async emit(event) {
        const promises = Array.from(this.callbacks).map((cb) => Promise.resolve(cb(event)).catch((err) => {
            // Log hook errors but don't fail tool execution
            console.error("Hook execution failed:", err);
        }));
        await Promise.all(promises);
    }
}
export const toolHooks = new HookRegistry();
//# sourceMappingURL=hooks.js.map