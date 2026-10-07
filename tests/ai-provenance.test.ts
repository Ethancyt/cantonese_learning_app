import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { analyze, generate } from "../lib/ai/lesson-generator";
import { normalizeAIProvenance } from "../lib/ai/provenance";
import { analysisSchema } from "../lib/schema";
import { sourceFromText } from "../lib/server/extraction";
import { initializeDeveloper, saveSettings } from "../lib/server/settings";
import { demoMaterial } from "../lib/seeds";

test("AI analysis and generation accept flat source metadata while preserving strict validation and grounding", async (t) => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "cantonese-ai-provenance-"),
  );
  const previous = process.env.DEVELOPER_DATA_DIR;
  const originalFetch = globalThis.fetch;
  process.env.DEVELOPER_DATA_DIR = root;
  t.after(async () => {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.DEVELOPER_DATA_DIR;
    else process.env.DEVELOPER_DATA_DIR = previous;
    await rm(root, { recursive: true, force: true });
  });
  const source = sourceFromText(
    "AI source test",
    demoMaterial,
    "test-volunteer",
  );
  const baseline = (await analyze(source)).analysis;
  const settings = {
    types: ["flashcard", "speak", "listen_choose"],
    level: "beginner",
    minutes: 5,
    age: "Adults",
    references: false,
  };
  const template = (await generate(source, baseline, settings, [])).lesson;
  delete template.module;
  const flatten = (item: { provenance?: unknown }) => {
    const { provenance, ...fields } = item;
    const flat = { ...fields, ...(provenance as object) };
    delete (flat as Record<string, unknown>).generatedByAI;
    return flat;
  };
  const flatAnalysis = {
    ...baseline,
    vocabulary: baseline.vocabulary.map(flatten),
  };
  let response: unknown = flatAnalysis;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(String(options?.body));
    assert.match(request.messages[0].content, /nested provenance object/);
    return Response.json({
      choices: [{ message: { content: JSON.stringify(response) } }],
    });
  };
  await initializeDeveloper("provenance-test-password");
  await saveSettings({ aiKey: "test-only-ai-provenance-canary" });
  const analyzed = await analyze(source);
  assert.equal(analyzed.mode, "AI-assisted");
  assert.ok(
    analyzed.analysis.vocabulary.every((v) => v.provenance?.generatedByAI),
  );
  assert.equal(
    analyzed.analysis.vocabulary[0].provenance?.sourceMaterialId,
    source.id,
  );
  assert.equal(
    Object.hasOwn(analyzed.analysis.vocabulary[0], "sourceExcerpt"),
    false,
  );
  response = {
    ...template,
    vocabulary: template.vocabulary.map(flatten),
    exercises: template.exercises.map(flatten),
  };
  const generated = await generate(source, analyzed.analysis, settings, []);
  assert.equal(generated.lesson.status, "ai_generated");
  assert.ok(
    generated.lesson.exercises.every(
      (e) =>
        e.provenance?.generatedByAI &&
        e.provenance.sourceMaterialId === source.id,
    ),
  );

  const invalid = structuredClone(response) as typeof template;
  (invalid.exercises[0] as unknown as Record<string, unknown>).sourceExcerpt =
    "Invented source content";
  response = invalid;
  await assert.rejects(
    () => generate(source, analyzed.analysis, settings, []),
    /verified source provenance/,
  );

  const extra = structuredClone(flatAnalysis);
  (extra.vocabulary[0] as Record<string, unknown>).unexpectedField =
    "still invalid";
  response = extra;
  await assert.rejects(() => analyze(source), /unrecognized_keys/);
  response = {
    ...flatAnalysis,
    vocabulary: [{ ...flatAnalysis.vocabulary[0], traditional: "不存在的詞" }],
  };
  await assert.rejects(() => analyze(source), /not grounded/);
  const malformed = {
    ...flatAnalysis,
    vocabulary: [{ ...flatAnalysis.vocabulary[0], provenance: "invalid" }],
  };
  assert.equal(
    analysisSchema.safeParse(normalizeAIProvenance(malformed)).success,
    false,
  );
});
