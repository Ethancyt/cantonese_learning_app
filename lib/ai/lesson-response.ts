import type { Analysis, Source } from "../schema";
import { normalizeAIActivities } from "./activities";
import { comparisonText, normalizeAIProvenance } from "./provenance";

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
  const normalizedText = new Map<number, string>();
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
          const { sourceChunk, sourceExcerpt: quote } = entry.provenance;
          const provenance = {
            sourceMaterialId: source.id,
            generatedByAI: true,
            ...entry.provenance,
          };
          if (
            provenance.sourceMaterialId !== source.id ||
            typeof quote !== "string"
          )
            return { ...entry, provenance };
          const comparison = comparisonText(quote);
          if (!comparison) return { ...entry, provenance };
          const cited = source.chunks.find(
            (chunk) => chunk.index === sourceChunk,
          );
          const matches = (chunk: Source["chunks"][number]) => {
            if (chunk.text.includes(quote)) return true;
            const text =
              normalizedText.get(chunk.index) ?? comparisonText(chunk.text);
            normalizedText.set(chunk.index, text);
            return text.includes(comparison);
          };
          // Use the cited page if the quote matches. A model can miscopy the index.
          const chunk =
            cited && matches(cited) ? cited : source.chunks.find(matches);
          if (!chunk) return { ...entry, provenance };
          return {
            ...entry,
            provenance: {
              ...provenance,
              sourceChunk: chunk.index,
              sourcePage: chunk.page,
              // Keep the original source text when PDF spacing changed the quote.
              sourceExcerpt: chunk.text.includes(quote) ? quote : chunk.text,
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
