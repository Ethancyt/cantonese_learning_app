import { z } from "zod";
export const exerciseTypes = [
  "flashcard",
  "multiple_choice",
  "match",
  "listen_choose",
  "sentence_order",
  "fill_blank",
  "speak",
  "conversation_choice",
  "scenario",
  "ai_roleplay",
] as const;
export const provenanceSchema = z
  .object({
    sourceMaterialId: z.string(),
    sourcePage: z.number().optional(),
    sourceChunk: z.number().optional(),
    sourceExcerpt: z.string().max(2000),
    generatedByAI: z.boolean(),
  })
  .strict();
export const vocabularySchema = z
  .object({
    id: z.string(),
    traditional: z.string().min(1),
    jyutping: z.string().min(1),
    english: z.string().min(1),
    example: z.string(),
    exampleJyutping: z.string(),
    exampleEnglish: z.string(),
    provenance: provenanceSchema.optional(),
  })
  .strict();
export const exerciseSchema = z
  .object({
    id: z.string(),
    type: z.enum(exerciseTypes),
    instruction: z.string().min(1),
    prompt: z.string().min(1),
    jyutping: z.string().default(""),
    english: z.string().default(""),
    options: z.array(z.string()).default([]),
    answer: z.string().default(""),
    explanation: z.string(),
    difficulty: z.number().int().min(1).max(3),
    tags: z.array(z.string()).min(1),
    pairs: z
      .array(z.object({ left: z.string(), right: z.string() }).strict())
      .optional(),
    tokens: z.array(z.string()).optional(),
    provenance: provenanceSchema.optional(),
  })
  .strict()
  .superRefine((e, c) => {
    if (
      [
        "multiple_choice",
        "listen_choose",
        "conversation_choice",
        "scenario",
      ].includes(e.type) &&
      (!e.options.includes(e.answer) ||
        e.options.length < 2 ||
        new Set(e.options).size !== e.options.length)
    )
      c.addIssue({
        code: "custom",
        message:
          "Choices need unique options and an answer matching an option.",
      });
    if (
      e.type === "match" &&
      (!e.pairs?.length ||
        new Set(e.pairs.map((p) => p.left)).size !== e.pairs.length ||
        new Set(e.pairs.map((p) => p.right)).size !== e.pairs.length)
    )
      c.addIssue({ code: "custom", message: "Matching needs unique pairs." });
    if (
      e.type === "sentence_order" &&
      (!e.tokens?.length || e.tokens.join("") !== e.answer)
    )
      c.addIssue({
        code: "custom",
        message: "Sentence tokens must construct the answer.",
      });
    if (["fill_blank", "speak"].includes(e.type) && !e.answer)
      c.addIssue({ code: "custom", message: "This activity needs an answer." });
  });
export const dialogueLineSchema = z
  .object({
    speaker: z.string(),
    traditional: z.string().min(1),
    jyutping: z.string().min(1),
    english: z.string().min(1),
  })
  .strict();
export const moduleSectionSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    title_zh: z.string(),
    description: z.string(),
    teachingPoints: z.array(z.string()).min(1),
    dialogue: z.array(dialogueLineSchema).default([]),
    examples: z
      .array(
        z
          .object({
            traditional: z.string(),
            jyutping: z.string(),
            english: z.string(),
          })
          .strict(),
      )
      .default([]),
    vocabularyIds: z.array(z.string()).min(1),
    exerciseIds: z.array(z.string()).min(1),
  })
  .strict();
export const moduleSchema = z
  .object({
    unit: z.number().int().min(1),
    introduction: z.string(),
    situation: z.string(),
    sections: z.array(moduleSectionSchema).min(1),
    reference: z
      .object({
        title: z.string(),
        url: z.string().url(),
        adaptation: z.literal("original"),
      })
      .strict()
      .optional(),
  })
  .strict();
export const audioClipSchema = z
  .object({
    id: z.string().regex(/^[a-f0-9]{64}$/),
    text: z.string().min(1).max(700),
    provider: z.enum(["azure", "compatible"]),
    voice: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    createdAt: z.string().datetime(),
  })
  .strict();
export type AudioClip = z.infer<typeof audioClipSchema>;
export const lessonSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1).max(100),
    title_zh: z.string().min(1).max(100),
    description: z.string().max(500),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    estimated_minutes: z.number().int().min(1).max(30),
    icon: z.string().max(8),
    topic: z.string(),
    workshop: z.string(),
    availability: z.enum(["available", "scheduled"]).default("available"),
    availableAt: z.string().datetime().optional(),
    learningObjectives: z.array(z.string()).min(1),
    module: moduleSchema.optional(),
    audio: z.array(audioClipSchema).max(200).optional(),
    vocabulary: z.array(vocabularySchema).min(1).max(50),
    grammar: z.array(z.string()),
    culturalNotes: z.array(
      z.object({ title: z.string(), body: z.string() }).strict(),
    ),
    exercises: z.array(exerciseSchema).min(1).max(60),
    roleplay: z
      .object({
        scenario: z.string(),
        studentRole: z.string(),
        aiRole: z.string(),
        allowedVocabulary: z.array(z.string()),
        goal: z.string(),
      })
      .strict(),
    status: z.enum([
      "draft",
      "ai_generated",
      "under_review",
      "approved",
      "published",
      "archived",
    ]),
    version: z.number().int().min(1),
    origin: z.enum(["human", "ai", "assisted", "imported"]),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    sourceMaterialId: z.string().optional(),
  })
  .strict()
  .superRefine((l, c) => {
    if (new Set(l.exercises.map((e) => e.id)).size !== l.exercises.length)
      c.addIssue({ code: "custom", message: "Exercise IDs must be unique." });
    if (new Set(l.vocabulary.map((v) => v.id)).size !== l.vocabulary.length)
      c.addIssue({ code: "custom", message: "Vocabulary IDs must be unique." });
    if (l.module) {
      const ids = l.module.sections.flatMap((s) => s.exerciseIds);
      if (
        new Set(l.module.sections.map((s) => s.id)).size !==
        l.module.sections.length
      )
        c.addIssue({
          code: "custom",
          message: "Module section IDs must be unique.",
        });
      if (
        ids.length !== l.exercises.length ||
        ids.some((id, i) => id !== l.exercises[i]?.id)
      )
        c.addIssue({
          code: "custom",
          message:
            "Module sections must contain every activity once, in lesson order.",
        });
      if (
        l.module.sections.some((s) =>
          s.vocabularyIds.some((id) => !l.vocabulary.some((v) => v.id === id)),
        )
      )
        c.addIssue({
          code: "custom",
          message: "Module vocabulary references must exist.",
        });
    }
    if (l.availability === "scheduled" && !l.availableAt)
      c.addIssue({
        code: "custom",
        message: "Choose a date for a scheduled journey.",
      });
  });
export type Lesson = z.infer<typeof lessonSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Vocabulary = z.infer<typeof vocabularySchema>;
export type Attempt = {
  id: string;
  studentId: string;
  lessonId: string;
  version: number;
  exerciseId: string;
  answer: string;
  correct: boolean;
  tags: string[];
  timestamp: string;
  attemptCount: number;
};
export type Completion = {
  studentId: string;
  lessonId: string;
  version: number;
  timestamp: string;
};
export type Source = {
  id: string;
  filename: string;
  text: string;
  chunks: { index: number; page?: number; text: string }[];
  createdBy: string;
  createdAt: string;
};
export const analysisSchema = z.object({
  learningObjectives: z.array(z.string()).min(1),
  vocabulary: z.array(vocabularySchema).min(1),
  expressions: z.array(z.string()),
  grammar: z.array(z.string()),
  dialogue: z.array(z.string()),
  culturalNotes: z.array(z.object({ title: z.string(), body: z.string() })),
});
export type Analysis = z.infer<typeof analysisSchema>;
export function normalize(s: string) {
  return s
    .normalize("NFKC")
    .replace(/[\s。，！？,.!?、]/g, "")
    .toLowerCase();
}
export function isCorrect(e: Exercise, answer: string) {
  return normalize(answer) === normalize(e.answer);
}

export type ModuleSection = z.infer<typeof moduleSectionSchema>;
