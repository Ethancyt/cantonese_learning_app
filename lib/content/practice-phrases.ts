import type { Lesson } from "../schema";

// Prefer reviewed sentences for conversation practice; isolated vocabulary is
// still available for workshops without a structured lesson.
export function practicePhrases(lesson: Lesson) {
  const sections = lesson.module?.sections || [];
  const phrases = [
    ...(sections.at(-1)?.examples || []),
    ...sections.flatMap((section) => section.examples),
  ].filter(
    (phrase) =>
      phrase.traditional.length > 2 &&
      lesson.roleplay.allowedVocabulary.some((word) =>
        phrase.traditional.includes(word),
      ),
  );
  const unique = [
    ...new Map(phrases.map((phrase) => [phrase.traditional, phrase])).values(),
  ];
  return unique.length ? unique : lesson.vocabulary;
}
