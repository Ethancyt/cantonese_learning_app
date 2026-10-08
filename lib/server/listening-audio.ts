import { promises as fs } from "node:fs";
import path from "node:path";
import { clipIdentity, synthesize } from "./lesson-audio";
import type { Settings } from "./settings";

const pending = new Map<string, Promise<Buffer>>();

// Call only after resolving the phrase against an authorized lesson. This cache
// contains lesson voice examples, never learner recordings or provider keys.
export async function listeningAudio(text: string, settings: Settings) {
  const root = path.join(
    process.env.DEMO_DATA_DIR || path.join(process.cwd(), ".data"),
    "listening-audio",
  );
  const key = clipIdentity(text, settings);
  const filename = path.join(root, `${key}.mp3`);
  try {
    return await fs.readFile(filename);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const existing = pending.get(filename);
  if (existing) return existing;
  const task = (async () => {
    const bytes = await synthesize(text, settings);
    await fs.mkdir(root, { recursive: true, mode: 0o700 });
    const temporary = `${filename}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, bytes, { mode: 0o600, flag: "wx" });
      await fs.rename(temporary, filename);
    } finally {
      await fs.unlink(temporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
    return bytes;
  })();
  pending.set(filename, task);
  try {
    return await task;
  } finally {
    pending.delete(filename);
  }
}
