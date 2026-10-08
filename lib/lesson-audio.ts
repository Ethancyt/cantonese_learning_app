import type { Exercise, Lesson } from "./schema";

export function hasChinese(text: string) {
  return /[\u3400-\u9fff]/u.test(text);
}

export function exerciseAudioText(exercise: Exercise) {
  return exercise.type === "speak"
    ? exercise.answer || exercise.prompt
    : exercise.prompt;
}

// Speak complete Cantonese phrases, never English activity instructions or Jyutping.
export function lessonAudioTexts(lesson: Lesson): string[] {
  const texts = [
    ...lesson.vocabulary.flatMap((v) => [v.traditional, v.example]),
    ...(lesson.module?.sections.flatMap((s) => [
      ...s.dialogue.map((l) => l.traditional),
      ...s.examples.map((e) => e.traditional),
    ]) || []),
    ...lesson.exercises
      .filter((e) => ["listen_choose", "speak"].includes(e.type))
      .map(exerciseAudioText),
    ...lesson.exercises.flatMap((e) => [
      ...e.options,
      ...(e.tokens || []),
      ...(e.pairs?.flatMap((p) => [p.left, p.right]) || []),
    ]),
  ];
  return [...new Set(texts.map((text) => text.trim()).filter(hasChinese))];
}

export function retainedAudio(lesson: Lesson, stored: Lesson) {
  const texts = new Set(lessonAudioTexts(lesson));
  return (stored.audio || []).filter((clip) => texts.has(clip.text));
}
