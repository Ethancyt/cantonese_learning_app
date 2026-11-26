import { lessonCompleted } from "./lesson-completion";
import { gradePractice } from "./practice-attempt";
import type { Attempt, Completion, Lesson } from "./schema";

export class VisitorPractice {
  attempts: Attempt[] = [];
  completions: Completion[] = [];

  constructor(readonly lessons: Lesson[]) {}

  submit(body: unknown) {
    const input = body as {
      action?: string;
      lessonId?: string;
      version?: number;
      exerciseId?: string;
      answer?: string;
      attemptId?: string;
    };
    const lesson = this.lessons.find(
      (item) => item.id === input?.lessonId && item.version === input.version,
    );
    if (!lesson) throw new Error("This lesson is unavailable.");
    const attempts = this.attempts.filter(
      (a) => a.lessonId === lesson.id && a.version === lesson.version,
    );
    if (input.action === "complete") {
      if (
        lesson.exercises.some(
          (e) => !attempts.some((a) => a.exerciseId === e.id),
        )
      )
        throw new Error("Finish each activity before completing the journey.");
      if (!lessonCompleted(lesson, this.completions)) {
        this.completions = [
          ...this.completions,
          {
            studentId: "visitor",
            lessonId: lesson.id,
            version: lesson.version,
            timestamp: new Date().toISOString(),
          },
        ];
      }
      return { ok: true };
    }
    if (input.action !== "attempt")
      throw new Error("Sign in to use this feature.");
    const exercise = lesson.exercises.find((e) => e.id === input.exerciseId);
    if (!exercise) throw new Error("Unknown activity.");
    const previous = attempts.filter((a) => a.exerciseId === exercise.id);
    const duplicate = previous.find((a) => a.id === input.attemptId);
    if (duplicate)
      return { correct: duplicate.correct, explanation: exercise.explanation };
    const result = gradePractice(exercise, input.answer ?? "");
    this.attempts = [
      ...this.attempts,
      {
        ...result,
        id: input.attemptId ?? crypto.randomUUID(),
        studentId: "visitor",
        lessonId: lesson.id,
        version: lesson.version,
        exerciseId: exercise.id,
        timestamp: new Date().toISOString(),
        attemptCount: previous.length + 1,
      },
    ];
    return { correct: result.correct, explanation: exercise.explanation };
  }
}
