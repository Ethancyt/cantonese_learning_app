import type { Lesson } from "./schema";
// Source excerpts and uploader identities belong in the staff review interface.
export function publicLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    createdBy: lesson.createdBy === "system" ? "system" : "workshop",
    sourceMaterialId: undefined,
    vocabulary: lesson.vocabulary.map(({ provenance: _source, ...v }) => v),
    exercises: lesson.exercises.map(({ provenance: _source, ...e }) => e),
  };
}
