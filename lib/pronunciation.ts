import { z } from "zod";

const score = z.number().finite().min(0).max(100);
export const pronunciationSchema = z.object({
  overall: score,
  accuracy: score,
  fluency: score,
  completeness: score,
  words: z
    .array(
      z.object({
        word: z.string().min(1).max(200),
        accuracy: score.nullable(),
        error: z.enum(["None", "Omission", "Insertion", "Mispronunciation"]),
      }),
    )
    .max(500),
});
export type PronunciationAssessment = z.infer<typeof pronunciationSchema>;
