import { Attempt, Completion } from "./schema";
export function progress(attempts: Attempt[], completions: Completion[]) {
  const successful = new Set(
    attempts
      .filter((a) => a.correct)
      .map((a) => `${a.lessonId}:${a.version}:${a.exerciseId}`),
  );
  const days = [
    ...new Set(
      [
        ...attempts.map((a) => a.timestamp),
        ...completions.map((c) => c.timestamp),
      ].map((t) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Hong_Kong",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(t)),
      ),
    ),
  ]
    .sort()
    .reverse();
  let streak = 0;
  let cursor = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(cursor);
  if (days[0] !== today) cursor.setDate(cursor.getDate() - 1);
  for (const day of days) {
    const expected = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(cursor);
    if (day !== expected) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    xp: successful.size * 10 + completions.length * 20,
    completed: completions.length,
    streak,
  };
}
export function mastery(attempts: Attempt[]) {
  const map = new Map<
    string,
    { correct: number; total: number; last: string }
  >();
  for (const a of attempts)
    for (const tag of a.tags) {
      const row = map.get(tag) || { correct: 0, total: 0, last: a.timestamp };
      row.total++;
      if (a.correct) row.correct++;
      if (a.timestamp > row.last) row.last = a.timestamp;
      map.set(tag, row);
    }
  return [...map]
    .map(([word, r]) => ({
      word,
      score: Math.round((r.correct / r.total) * 100),
      attempts: r.total,
      last: r.last,
      priority:
        (r.total - r.correct) * 2 +
        (1 - r.correct / r.total) * 5 +
        Math.min(7, (Date.now() - new Date(r.last).getTime()) / 86400000),
    }))
    .sort((a, b) => b.priority - a.priority);
}
