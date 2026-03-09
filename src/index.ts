#!/usr/bin/env bun
import { serve } from "mcp-core";

await serve({
  name: "gutenberg",
  version: "1.0.0",
  serverDir: import.meta.dir,
});
