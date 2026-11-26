import type { Source } from "../schema";

export const retiredSystemLessonIds = [
  "start",
  "greetings",
  "introductions",
  "manners",
];

// Identify the built-in source narrowly so similarly titled uploads are kept.
export const retiredDemoFilename = "Workshop Demo — 茶餐廳";
export const retiredDemoOpening =
  "Workshop Demo — 茶餐廳\nGoal: order a drink politely.\n奶茶 | naai5 caa4 | Milk tea";

export function isRetiredDemoSource(source: Source) {
  return (
    source.filename === retiredDemoFilename &&
    source.text.startsWith(retiredDemoOpening)
  );
}

export function isArchivedSource(source: Source) {
  return Boolean(source.archivedAt) || isRetiredDemoSource(source);
}
