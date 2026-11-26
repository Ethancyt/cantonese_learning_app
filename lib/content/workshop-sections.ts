import type { Exercise } from "../schema";
import type { Phrase } from "./course-types";

type Activity = [key: string, exercise: Partial<Exercise>, terms?: string[]];
export type WorkshopSection = {
  key: string;
  title: string;
  chinese: string;
  description: string;
  points: string[];
  terms: string[];
  examples: Phrase[];
  dialogue?: [speaker: string, phrase: Phrase][];
  activities: Activity[];
};

function example([traditional, jyutping, english]: Phrase) {
  return { traditional, jyutping, english };
}

export function workshopSections(id: string, sections: WorkshopSection[]) {
  const exercises: Exercise[] = [];
  const moduleSections = sections.map((section, index) => {
    const sectionId = `${id}-${section.key}`;
    const activities = section.activities.map(
      ([key, activity, tags], position) => {
        const options = activity.options ?? [];
        const offset = options.length ? (index + position) % options.length : 0;
        return {
          id: `${sectionId}-${key}`,
          type: activity.type!,
          instruction: activity.instruction!,
          prompt: activity.prompt!,
          jyutping: "",
          english: "",
          answer: "",
          explanation: "Review the examples from this section and try again.",
          difficulty: 1,
          tags: tags ?? section.terms,
          ...activity,
          options: [...options.slice(offset), ...options.slice(0, offset)],
        };
      },
    );
    exercises.push(...activities);
    return {
      id: sectionId,
      title: section.title,
      title_zh: section.chinese,
      description: section.description,
      teachingPoints: section.points,
      examples: section.examples.map(example),
      dialogue:
        section.dialogue?.map(([speaker, line]) => ({
          speaker,
          ...example(line),
        })) ?? [],
      vocabularyIds: section.terms.map((term) => `${id}-v-${term}`),
      exerciseIds: activities.map((activity) => activity.id),
    };
  });
  return { exercises, moduleSections };
}
