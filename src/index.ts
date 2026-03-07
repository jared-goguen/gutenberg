#!/usr/bin/env bun
import { startServer } from "./serve.js";

await startServer({
  name: "gutenberg",
  version: "1.0.0",
});
