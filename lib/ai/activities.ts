import type { Analysis } from "../schema";

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sentenceTokens(answer: string) {
  const tokens: string[] = [];
  const segments = new Intl.Segmenter("zh-HK", { granularity: "word" });
  for (const { segment } of segments.segment(answer)) {
    if (/^[\p{P}\s]+$/u.test(segment) && tokens.length)
      tokens[tokens.length - 1] += segment;
    else tokens.push(segment);
  }
  return tokens;
}

// Repair presentation structure, keeping the answer text and reviewed vocabulary authoritative.
export function normalizeAIActivities(
  value: unknown,
  analysis: Analysis,
): unknown {
  if (!record(value) || !Array.isArray(value.exercises)) return value;
  return {
    ...value,
    exercises: value.exercises.map((entry: unknown) => {
      if (!record(entry)) return entry;
      const item = { ...entry };
      if (
        item.type === "sentence_order" &&
        typeof item.answer === "string" &&
        item.answer.length &&
        (item.tokens === undefined ||
          (Array.isArray(item.tokens) &&
            item.tokens.every((t) => typeof t === "string")))
      ) {
        if (
          !Array.isArray(item.tokens) ||
          !item.tokens.length ||
          item.tokens.join("") !== item.answer
        )
          item.tokens = sentenceTokens(item.answer);
      }
      if (item.type === "match") {
        const raw = item.pairs;
        if (
          raw !== undefined &&
          (!Array.isArray(raw) ||
            !raw.every(
              (p) =>
                record(p) &&
                typeof p.left === "string" &&
                typeof p.right === "string" &&
                Object.keys(p).every((k) => k === "left" || k === "right"),
            ))
        )
          return item; // Unexpected fields or types still require validation/AI correction.
        const pairs =
          (raw as { left: string; right: string }[] | undefined) || [];
        const unique = new Map(
          pairs.map((p) => [
            JSON.stringify([p.left.trim(), p.right.trim()]),
            { left: p.left.trim(), right: p.right.trim() },
          ]),
        );
        const canonical = [...unique.values()];
        if (
          canonical.length &&
          canonical.every((p) => p.left && p.right) &&
          new Set(canonical.map((p) => p.left)).size === canonical.length &&
          new Set(canonical.map((p) => p.right)).size === canonical.length
        ) {
          item.pairs = canonical;
        } else {
          const tags = Array.isArray(item.tags) ? item.tags : [];
          const words = [
            ...analysis.vocabulary.filter((v) => tags.includes(v.traditional)),
            ...analysis.vocabulary,
          ];
          const left = new Set<string>(),
            right = new Set<string>();
          const reviewed: { left: string; right: string }[] = [];
          for (const word of words) {
            const l = word.traditional.trim(),
              r = word.english.trim();
            if (!l || !r || left.has(l) || right.has(r)) continue;
            reviewed.push({ left: l, right: r });
            left.add(l);
            right.add(r);
            if (reviewed.length === 5) break;
          }
          item.pairs = reviewed;
          item.instruction =
            "Match each Cantonese word to its English meaning.";
          item.prompt = "Choose the matching word and meaning.";
          item.explanation = "Use the English meanings from this workshop.";
          item.tags = reviewed.map((p) => p.left);
        }
      }
      return item;
    }),
  };
}
