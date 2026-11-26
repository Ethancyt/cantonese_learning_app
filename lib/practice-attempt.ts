import { isCorrect, normalize, type Exercise } from "./schema";

export function gradePractice(exercise: Exercise, submitted: string) {
  if (["flashcard", "speak", "ai_roleplay"].includes(exercise.type))
    return {
      answer: exercise.personalPractice ? "practised" : submitted,
      correct: false,
      tags: [],
    };

  return {
    answer: submitted,
    correct:
      exercise.type === "match"
        ? normalize(submitted) === normalize(JSON.stringify(exercise.pairs))
        : isCorrect(exercise, submitted),
    tags: exercise.tags,
  };
}
