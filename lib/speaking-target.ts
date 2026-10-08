import type { Exercise, Lesson } from "./schema";

export function exerciseVocabulary(lesson: Lesson, exercise: Exercise) {
  const section = lesson.module?.sections.find((s) =>
    s.exerciseIds.includes(exercise.id),
  );
  return section
    ? lesson.vocabulary.filter((v) => section.vocabularyIds.includes(v.id))
    : lesson.vocabulary;
}

// Resolve the target from the authorized lesson, never from client-supplied text.
export function speakingTarget(
  lesson: Lesson,
  exerciseId: string,
  vocabularyId?: string,
): string | null {
  const exercise = lesson.exercises.find((e) => e.id === exerciseId);
  if (exercise?.type === "speak") return exercise.answer;
  if (exercise?.type !== "flashcard" || !vocabularyId) return null;
  return (
    exerciseVocabulary(lesson, exercise).find((v) => v.id === vocabularyId)
      ?.traditional || null
  );
}
