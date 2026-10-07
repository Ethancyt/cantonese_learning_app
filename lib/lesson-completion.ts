import type { Completion, Lesson } from "./schema";

// A completed older lecture remains in history, but does not complete a new
// curriculum revision that has different practice activities.
export function lessonCompleted(
  lesson: Pick<Lesson, "id" | "version">,
  completions: Completion[],
) {
  return completions.some(
    (completion) =>
      completion.lessonId === lesson.id &&
      completion.version === lesson.version,
  );
}
