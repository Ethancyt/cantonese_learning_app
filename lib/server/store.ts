import { promises as fs } from "node:fs";
import path from "node:path";
import { Attempt, Completion, Lesson, Source } from "../schema";
import { seedLessons } from "../seeds";
export type Database = {
  lessons: Lesson[];
  versions: Lesson[];
  sources: Source[];
  attempts: Attempt[];
  completions: Completion[];
  reports: {
    id: string;
    studentId: string;
    lessonId: string;
    reason: string;
    timestamp: string;
  }[];
  generations: {
    id: string;
    sourceId: string;
    lessonId: string;
    mode: string;
    timestamp: string;
  }[];
};
const root = process.env.DEMO_DATA_DIR || path.join(process.cwd(), ".data");
const filename = path.join(root, "demo.json");
let queue: Promise<unknown> = Promise.resolve();
async function read(): Promise<Database> {
  try {
    return upgradeCurriculum(JSON.parse(await fs.readFile(filename, "utf8")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return {
      lessons: structuredClone(seedLessons),
      versions: structuredClone(seedLessons),
      sources: [],
      attempts: [],
      completions: [],
      reports: [],
      generations: [],
    };
  }
}
export async function transact<T>(
  fn: (db: Database) => T | Promise<T>,
): Promise<T> {
  const job = queue.then(async () => {
    const db = await read();
    const result = await fn(db);
    await fs.mkdir(root, { recursive: true });
    const temporary = filename + ".tmp";
    await fs.writeFile(temporary, JSON.stringify(db, null, 2), { mode: 0o600 });
    await fs.rename(temporary, filename);
    return result;
  });
  queue = job.catch(() => {});
  return job;
}
export async function snapshot() {
  await queue;
  return read();
}

// Old snapshots and attempts keep their version; only untouched system lessons upgrade.
export function upgradeCurriculum(db: Database): Database {
  for (const seed of seedLessons) {
    const current = db.lessons.find((l) => l.id === seed.id);
    if (
      !current ||
      (current.createdBy === "system" &&
        current.status === "published" &&
        current.version < seed.version)
    ) {
      if (
        current &&
        !db.versions.some(
          (v) => v.id === current.id && v.version === current.version,
        )
      )
        db.versions.push(structuredClone(current));
      if (current)
        db.lessons[db.lessons.indexOf(current)] = structuredClone(seed);
      else db.lessons.push(structuredClone(seed));
      if (
        !db.versions.some((v) => v.id === seed.id && v.version === seed.version)
      )
        db.versions.push(structuredClone(seed));
    }
  }
  return db;
}
