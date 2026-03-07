import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function makeRoot(): Promise<string> {
  return await mkdtemp(join(tmpdir(), "gutenberg-test-"));
}

export async function cleanRoot(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}
