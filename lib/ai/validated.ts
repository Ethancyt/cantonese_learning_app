import type { z } from "zod";
import {
  AIOutputLimitError,
  analysisRules,
  generationRules,
  type AIProvider,
} from "./provider";

// Share one recovery request (validation or truncation) and one deadline.
export async function validatedAI<S extends z.ZodTypeAny>(
  ai: AIProvider,
  input: Record<string, unknown>,
  schema: S,
  normalize: (value: unknown) => unknown,
  kind: "analysis" | "lesson",
): Promise<z.output<S>> {
  const started = Date.now();
  let request = input;
  let lastIssues: { path: PropertyKey[]; message: string }[] = [];
  let truncated: AIOutputLimitError | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = 85000 - (Date.now() - started);
    if (remaining <= 1000) break;
    let response: unknown;
    try {
      response = await ai.json(
        kind === "analysis" ? analysisRules : generationRules,
        request,
        {
          timeoutMs: Math.min(75000, remaining),
          maxTokens: kind === "analysis" ? 6000 : 12000,
        },
      );
    } catch (error) {
      if (!(error instanceof AIOutputLimitError)) throw error;
      truncated = error;
      if (attempt === 1) throw error;
      request = {
        ...input,
        responseLimits: {
          ...(input.responseLimits as object | undefined),
          recovery:
            kind === "analysis"
              ? "The previous response exceeded the token limit. Return at most 12 key vocabulary entries and 3 short entries in each other collection. Keep examples to one short phrase and translations concise. Omit provenance and excerpts. Return a complete JSON object."
              : "The previous response exceeded the token limit. Return one concise activity per selected type. Omit all server-populated fields and reviewed vocabulary. Use only short source quotes, one-sentence explanations, and short options. Return a complete JSON object.",
        },
      };
      continue;
    }
    truncated = null;
    const parsed = schema.safeParse(normalize(response));
    if (parsed.success) return parsed.data;
    lastIssues = parsed.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
    request = {
      task: "Correct the previous JSON response using the validation errors. Return the complete corrected object, not a patch. Preserve the reviewed source, selected activity types, and intended answers. Follow the supplied schema exactly.",
      originalRequest: input,
      previousResponse: response,
      validationErrors: lastIssues.slice(0, 12),
    };
  }
  if (truncated) throw truncated;
  if (
    lastIssues.some(
      (issue) =>
        issue.message === "Vocabulary is not grounded in the workshop source.",
    )
  )
    throw new Error("Vocabulary is not grounded in the workshop source.");
  throw new Error(
    `Generated ${kind} did not pass validation after correction. Try again or choose a different AI model in Developer setup. No draft was published.`,
  );
}
