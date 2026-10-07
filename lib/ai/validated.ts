import type { z } from "zod";
import { generationRules, type AIProvider } from "./provider";

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
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = 75000 - (Date.now() - started);
    if (remaining <= 1000) break;
    const response = await ai.json(generationRules, request, {
      timeoutMs: Math.min(60000, remaining),
    });
    const parsed = schema.safeParse(normalize(response));
    if (parsed.success) return parsed.data;
    request = {
      task: "Correct the previous JSON response using the validation errors. Return the complete corrected object, not a patch. Preserve the reviewed source, selected activity types, and intended answers. Follow the supplied schema exactly.",
      originalRequest: input,
      previousResponse: response,
      validationErrors: parsed.error.issues
        .slice(0, 12)
        .map((issue) => ({ path: issue.path, message: issue.message })),
    };
  }
  throw new Error(
    `Generated ${kind} did not pass validation after correction. Try again or choose a different AI model in Developer setup. No draft was published.`,
  );
}
