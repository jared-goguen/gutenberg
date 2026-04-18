#!/usr/bin/env bun
import { serve } from "./core/index.js";
await serve({
    name: "gutenberg",
    version: "1.0.0",
    serverDir: import.meta.dir,
});
//# sourceMappingURL=index.js.map