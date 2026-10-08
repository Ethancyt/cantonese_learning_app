import test from "node:test";
import assert from "node:assert/strict";
import { analysisSchema, exerciseSchema, type Exercise } from "../lib/schema";
import { normalizeAIActivities } from "../lib/ai/activities";
import { validatedAI } from "../lib/ai/validated";
import type { AIProvider } from "../lib/ai/provider";

const analysis = analysisSchema.parse({
  learningObjectives: ["Introduce a fictional student."],
  vocabulary: [
    ["學生", "hok6 saang1", "Student"],
    ["老師", "lou5 si1", "Teacher"],
    ["同學", "tung4 hok6", "Classmate"],
    ["你好", "nei5 hou2", "Hello"],
    ["早晨", "zou2 san4", "Good morning"],
    ["再見", "zoi3 gin3", "Goodbye"],
  ].map(([traditional, jyutping, english], i) => ({
    id: `word-${i}`,
    traditional,
    jyutping,
    english,
    example: traditional,
    exampleJyutping: jyutping,
    exampleEnglish: english,
  })),
  expressions: [],
  grammar: [],
  dialogue: [],
  culturalNotes: [],
});
const base = {
  id: "activity",
  type: "match",
  instruction: "Match.",
  prompt: "Match the words.",
  answer: "",
  explanation: "Use the workshop words.",
  difficulty: 1,
  tags: ["學生"],
};
function repaired(entry: Record<string, unknown>) {
  const input = { exercises: [{ ...base, ...entry }] };
  const before = structuredClone(input);
  const result = normalizeAIActivities(input, analysis) as {
    exercises: Exercise[];
  };
  assert.deepEqual(
    input,
    before,
    "normalization never changes the provider response in place",
  );
  return result.exercises[0];
}

test("matching deduplicates identical pairs and rebuilds ambiguous pairs from reviewed vocabulary", () => {
  const duplicate = repaired({
    pairs: [
      { left: "學生", right: "Student" },
      { left: " 學生 ", right: "Student " },
      { left: "老師", right: "Teacher" },
    ],
  });
  assert.deepEqual(duplicate.pairs, [
    { left: "學生", right: "Student" },
    { left: "老師", right: "Teacher" },
  ]);
  exerciseSchema.parse(duplicate);
  for (const pairs of [
    undefined,
    [],
    [
      { left: "學生", right: "Student" },
      { left: "學生", right: "Teacher" },
      { left: "老師", right: "Student" },
    ],
  ]) {
    const corrected = repaired({ pairs });
    exerciseSchema.parse(corrected);
    assert.equal(corrected.pairs?.length, 5);
    assert.equal(new Set(corrected.pairs!.map((p) => p.left)).size, 5);
    assert.equal(new Set(corrected.pairs!.map((p) => p.right)).size, 5);
    assert.ok(
      corrected.pairs!.every((p) =>
        analysis.vocabulary.some(
          (v) => v.traditional === p.left && v.english === p.right,
        ),
      ),
    );
    assert.equal(
      corrected.instruction,
      "Match each Cantonese word to its English meaning.",
    );
  }
  assert.equal(
    exerciseSchema.safeParse(
      repaired({
        pairs: [{ left: "學生", right: "Student", unexpected: true }],
      }),
    ).success,
    false,
  );
  assert.equal(
    exerciseSchema.safeParse(
      repaired({ pairs: [{ left: 123, right: "Student" }] }),
    ).success,
    false,
  );
});

test("sentence construction keeps the intended answer and reconstructs exact tokens including punctuation and spaces", () => {
  for (const [answer, tokens] of [
    ["我係學生。", ["學生", "我", "係"]],
    ["我學廣東話！", ["我", "學", "廣東話"]],
    ["I am a student.", ["I", "am", "a", "student"]],
    ["你好，老師！", undefined],
  ] as const) {
    const corrected = repaired({ type: "sentence_order", answer, tokens });
    exerciseSchema.parse(corrected);
    assert.equal(corrected.answer, answer);
    assert.equal(corrected.tokens!.join(""), answer);
    assert.ok(corrected.tokens!.every((t) => t.trim().length > 0));
  }
  const correct = ["我", "係", "學生。"];
  assert.deepEqual(
    repaired({ type: "sentence_order", answer: "我係學生。", tokens: correct })
      .tokens,
    correct,
  );
  assert.equal(
    exerciseSchema.safeParse(
      repaired({ type: "sentence_order", answer: "我係學生", tokens: [123] }),
    ).success,
    false,
  );
});

test("AI schema correction retries once, supplies field-level errors, and rejects persistent invalid output", async () => {
  const requests: unknown[] = [];
  const valid = {
    ...base,
    type: "multiple_choice",
    options: ["學生", "老師"],
    answer: "學生",
  };
  const ai: AIProvider = {
    async json(_system, request, options) {
      requests.push(request);
      assert.ok(options!.timeoutMs > 0 && options!.timeoutMs <= 75000);
      return requests.length === 1
        ? { ...valid, options: ["學生", "學生"] }
        : valid;
    },
  };
  const result = await validatedAI(
    ai,
    { task: "Create lesson", source: "Reviewed source" },
    exerciseSchema,
    (value) => value,
    "lesson",
  );
  assert.equal(result.answer, "學生");
  assert.equal(requests.length, 2);
  const correction = requests[1] as Record<string, unknown>;
  assert.ok(Array.isArray(correction.validationErrors));
  assert.match(
    JSON.stringify(correction.validationErrors),
    /Choices need unique options/,
  );
  assert.deepEqual(correction.originalRequest, requests[0]);
  let failures = 0;
  const invalid: AIProvider = {
    async json() {
      failures++;
      return { secretCanary: "private-provider-body" };
    },
  };
  await assert.rejects(
    () => validatedAI(invalid, {}, exerciseSchema, (value) => value, "lesson"),
    (e: Error) => {
      assert.match(
        e.message,
        /Generated lesson did not pass validation after correction/,
      );
      assert.doesNotMatch(e.message, /private-provider-body|secretCanary/);
      return true;
    },
  );
  assert.equal(
    failures,
    2,
    "invalid AI output cannot cause an unbounded retry loop",
  );
});

test("AI correction shares a total deadline with the first request", async (t) => {
  const originalNow = Date.now;
  let elapsed = 0;
  Date.now = () => elapsed;
  t.after(() => {
    Date.now = originalNow;
  });
  const timeouts: number[] = [];
  const ai: AIProvider = {
    async json(_system, _request, options) {
      timeouts.push(options!.timeoutMs);
      elapsed = 65000;
      return timeouts.length === 1
        ? {}
        : { ...base, pairs: [{ left: "學生", right: "Student" }] };
    },
  };
  await validatedAI(ai, {}, exerciseSchema, (value) => value, "lesson");
  assert.deepEqual(timeouts, [75000, 20000]);
});
