import type { Attempt, Completion, Lesson } from "./schema";
import { lessonCompleted } from "./lesson-completion";

export function lessonActivityProgress(lesson: Lesson, attempts: Attempt[]) {
  const exerciseIds = new Set(lesson.exercises.map((e) => e.id));
  const explored = new Set(
    attempts
      .filter(
        (a) =>
          a.lessonId === lesson.id &&
          a.version === lesson.version &&
          exerciseIds.has(a.exerciseId),
      )
      .map((a) => a.exerciseId),
  );
  const nextIndex = lesson.exercises.findIndex((e) => !explored.has(e.id));
  return {
    explored: explored.size,
    total: lesson.exercises.length,
    percent: lesson.exercises.length
      ? Math.round((explored.size / lesson.exercises.length) * 100)
      : 0,
    nextIndex,
  };
}

export function lessonToContinue(
  lessons: Lesson[],
  attempts: Attempt[],
  completions: Completion[],
) {
  const unfinished = lessons.filter((l) => !lessonCompleted(l, completions));
  const recent = attempts
    .filter((a) =>
      unfinished.some(
        (l) =>
          l.id === a.lessonId &&
          l.version === a.version &&
          l.exercises.some((e) => e.id === a.exerciseId),
      ),
    )
    .reduce<Attempt | null>(
      (latest, a) => (!latest || a.timestamp > latest.timestamp ? a : latest),
      null,
    );
  return (
    unfinished.find((l) => l.id === recent?.lessonId) || unfinished[0] || null
  );
}
