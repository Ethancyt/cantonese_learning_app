import type { Analysis, Source } from "../schema";
import { normalizeAIActivities } from "./activities";
import { normalizeAIProvenance } from "./provenance";

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// Reuse reviewed content instead of asking the model to emit it a second time.
// Full responses from compatible providers remain subject to strict validation.
export function completeLessonResponse(
  value: unknown,
  source: Source,
  analysis: Analysis,
  settings: { level: string; minutes: number },
  id: string,
  now: string,
): unknown {
  const response = normalizeAIActivities(
    normalizeAIProvenance(value),
    analysis,
  );
  if (!record(response)) return response;
  const roleplay = response.roleplay;
  return {
    workshop: source.filename,
    availability: "available",
    learningObjectives: analysis.learningObjectives,
    vocabulary: analysis.vocabulary,
    grammar: analysis.grammar,
    culturalNotes: analysis.culturalNotes,
    ...response,
    exercises: Array.isArray(response.exercises)
      ? response.exercises.map((entry: unknown) => {
          if (!record(entry) || !record(entry.provenance)) return entry;
          return {
            ...entry,
            provenance: {
              sourceMaterialId: source.id,
              generatedByAI: true,
              ...entry.provenance,
            },
          };
        })
      : response.exercises,
    roleplay: record(roleplay)
      ? {
          ...roleplay,
          allowedVocabulary: analysis.vocabulary.map((v) => v.traditional),
        }
      : roleplay,
    id,
    level: settings.level,
    estimated_minutes: settings.minutes,
    status: "ai_generated",
    version: 1,
    origin: "ai",
    createdBy: source.createdBy,
    createdAt: now,
    updatedAt: now,
    sourceMaterialId: source.id,
  };
}
