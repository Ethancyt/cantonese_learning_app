import type { z } from "zod";
import { analysisRules, generationRules, type AIProvider } from "./provider";

// One correction request at most, within the Studio route's 90-second budget.
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
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = 85000 - (Date.now() - started);
    if (remaining <= 1000) break;
    const response = await ai.json(
      kind === "analysis" ? analysisRules : generationRules,
      request,
      {
        timeoutMs: Math.min(75000, remaining),
        maxTokens: kind === "analysis" ? 6000 : 12000,
      },
    );
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
