import {
  type Exercise,
  type Lesson,
  type Vocabulary,
  lessonSchema,
} from "../schema";
import { type Phrase } from "./course-types";
import { survivalCourse } from "./survival-course";

// Keep stable lesson IDs so historic attempts and published snapshots remain
// available. New activities and vocabulary belong to curriculum version 3.
export const curriculumModules: Lesson[] = survivalCourse.map(
  (course, index) => {
    const unit = index + 1;
    const context: Phrase[] = course.sections.flatMap((section) => [
      ...section.examples,
      ...section.dialogue.map(([, ...phrase]) => phrase as Phrase),
    ]);
    const vocabulary: Vocabulary[] = course.vocabulary.map(
      ([traditional, jyutping, english], i) => {
        const example = context.find(
          ([text]) => text.includes(traditional) && text !== traditional,
        ) || [traditional, jyutping, english];
        return {
          id: `${course.id}-lecture3-v${i + 1}`,
          traditional,
          jyutping,
          english,
          example: example[0],
          exampleJyutping: example[1],
          exampleEnglish: example[2],
        };
      },
    );
    const byWord = new Map(vocabulary.map((word) => [word.traditional, word]));
    const exercises: Exercise[] = [];
    const sections = course.sections.map((section, part) => {
      const words = section.terms.map((word) => {
        const entry = byWord.get(word);
        if (!entry)
          throw new Error(`Missing course vocabulary: ${course.id} / ${word}`);
        return entry;
      });
      const activities = section.activities.map((activity, i) => {
        // Vary answer positions across the course while keeping lesson
        // snapshots stable for saved attempts and teacher review.
        const options = activity.options || [];
        const offset = options.length ? (unit + part + i) % options.length : 0;
        return {
          id: `${course.id}-lecture3-part${part + 1}-activity${i + 1}`,
          type: activity.type!,
          instruction: activity.instruction!,
          prompt: activity.prompt!,
          jyutping: "",
          english: "",
          answer: "",
          explanation:
            "Use the complete phrases and sentence patterns from this lesson.",
          difficulty: 1,
          tags: words.map((word) => word.traditional),
          ...activity,
          options: [...options.slice(offset), ...options.slice(0, offset)],
        };
      });
      exercises.push(...activities);
      return {
        id: `${course.id}-lecture3-part${part + 1}`,
        title: section.title,
        title_zh: section.zh,
        description: section.recap,
        teachingPoints: section.points,
        examples: section.examples.map(([traditional, jyutping, english]) => ({
          traditional,
          jyutping,
          english,
        })),
        dialogue: section.dialogue.map(
          ([speaker, traditional, jyutping, english]) => ({
            speaker,
            traditional,
            jyutping,
            english,
          }),
        ),
        vocabularyIds: words.map((word) => word.id),
        exerciseIds: activities.map((activity) => activity.id),
      };
    });
    return lessonSchema.parse({
      id: course.id,
      title: `Lesson ${unit} · ${course.title}`,
      title_zh: `第${unit}課 · ${course.zh}`,
      description: course.introduction,
      level: "beginner",
      estimated_minutes: unit === 1 ? 20 : 25,
      icon: course.icon,
      topic: course.topic,
      workshop: "After-class practice · EduHK Survival Cantonese Units 1–4",
      learningObjectives: course.objectives,
      vocabulary,
      grammar: course.sections
        .flatMap((section) => section.points)
        .filter((point) =>
          /pattern|subject|sentence|negate|A-not-A|follows|before|after/.test(
            point,
          ),
        ),
      culturalNotes: [
        { title: "Language and class context", body: course.culture },
        {
          title: "Reading your class notes",
          body: "EduHK’s course uses a numbered notation influenced by Yale. This app displays modern Jyutping throughout. Compare the sound of the whole expression; spelling and tone conventions are not interchangeable across romanization systems.",
        },
      ],
      module: {
        unit,
        introduction: course.introduction,
        situation: course.situation,
        sections,
        reference: {
          title: `EduHK Survival Cantonese · Unit ${unit}`,
          url: `https://www.eduhk.hk/cle/resources/cep/cantonese-survival-package/unit${unit}.html`,
          adaptation: "original",
        },
      },
      exercises,
      roleplay: {
        scenario: course.situation,
        studentRole: "Fictional classmate Siu Yan",
        aiRole: "Friendly after-class practice buddy",
        allowedVocabulary: vocabulary.map((word) => word.traditional),
        goal: course.goal,
      },
      status: "published",
      version: 3,
      origin: "human",
      createdBy: "system",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-10-08T00:00:00Z",
    });
  },
);
