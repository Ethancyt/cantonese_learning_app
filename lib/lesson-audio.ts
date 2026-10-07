import type { Lesson } from "./schema";

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
      .map((e) => e.prompt),
  ];
  return [
    ...new Set(
      texts
        .map((text) => text.trim())
        .filter((text) => /[\u3400-\u9fff]/u.test(text)),
    ),
  ];
}

export function retainedAudio(lesson: Lesson, stored: Lesson) {
  const texts = new Set(lessonAudioTexts(lesson));
  return (stored.audio || []).filter((clip) => texts.has(clip.text));
}
