import { Analysis, Lesson } from "../schema";
// Keep source phrases and their translations intact when organizing a draft.
export function structureWorkshop(lesson: Lesson, analysis: Analysis): Lesson {
  if (lesson.module) return lesson;
  const chunks = Math.min(3, lesson.exercises.length);
  const names = [
    "Understand the workshop",
    "Practise the patterns",
    "Use it in a situation",
  ];
  lesson.module = {
    unit: 1,
    introduction: lesson.description,
    situation: lesson.roleplay.scenario,
    sections: Array.from({ length: chunks }, (_, i) => {
      const activities = lesson.exercises.slice(
        Math.floor((i * lesson.exercises.length) / chunks),
        Math.floor(((i + 1) * lesson.exercises.length) / chunks),
      );
      return {
        id: `${lesson.id}-section${i + 1}`,
        title: names[i],
        title_zh: ["理解工作坊內容", "練習句式", "應用所學"][i],
        description: analysis.learningObjectives.join(" "),
        teachingPoints: analysis.grammar.length
          ? analysis.grammar
          : analysis.learningObjectives,
        dialogue: [],
        examples: lesson.vocabulary.map((v) => ({
          traditional: v.example || v.traditional,
          jyutping: v.exampleJyutping || v.jyutping,
          english: v.exampleEnglish || v.english,
        })),
        vocabularyIds: lesson.vocabulary.map((v) => v.id),
        exerciseIds: activities.map((e) => e.id),
      };
    }),
  };
  return lesson;
}

// Maintain section links when a reviewer adds, removes, or replaces activities.
export function reconcileSections(lesson: Lesson): Lesson {
  if (!lesson.module) return lesson;
  const sections = lesson.module.sections.map((s) => ({
    ...s,
    exerciseIds: s.exerciseIds.filter((id) =>
      lesson.exercises.some((e) => e.id === id),
    ),
  }));
  for (const e of lesson.exercises)
    if (!sections.some((s) => s.exerciseIds.includes(e.id)))
      sections[sections.length - 1].exerciseIds.push(e.id);
  lesson.module = {
    ...lesson.module,
    sections: sections.filter((s) => s.exerciseIds.length),
  };
  return lesson;
}
