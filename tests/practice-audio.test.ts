import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { seedLessons } from "../lib/seeds";
import { exerciseVocabulary, speakingTarget } from "../lib/speaking-target";
import { lessonAudioTexts } from "../lib/lesson-audio";
import { listeningAudio } from "../lib/server/listening-audio";
import { readSettings } from "../lib/server/settings";

test("existing courses authorize card pronunciation only for the displayed section vocabulary", () => {
  for (const lesson of seedLessons) {
    for (const exercise of lesson.exercises) {
      if (exercise.type === "speak") {
        assert.equal(speakingTarget(lesson, exercise.id), exercise.answer);
      } else if (exercise.type === "flashcard") {
        const words = exerciseVocabulary(lesson, exercise);
        assert.ok(words.length);
        for (const word of words)
          assert.equal(
            speakingTarget(lesson, exercise.id, word.id),
            word.traditional,
          );
        assert.equal(speakingTarget(lesson, exercise.id), null);
        assert.equal(
          speakingTarget(lesson, exercise.id, "forged-word-id"),
          null,
        );
        for (const word of lesson.vocabulary.filter((v) => !words.includes(v)))
          assert.equal(speakingTarget(lesson, exercise.id, word.id), null);
      } else {
        assert.equal(
          speakingTarget(lesson, exercise.id, lesson.vocabulary[0].id),
          null,
        );
      }
    }
  }
  const legacy = structuredClone(seedLessons[0]);
  delete legacy.module;
  const card = legacy.exercises.find((e) => e.type === "flashcard")!;
  assert.equal(
    speakingTarget(legacy, card.id, legacy.vocabulary[0].id),
    legacy.vocabulary[0].traditional,
  );
});

test("Chinese choice, matching and sentence audio is included without English distractors", () => {
  const lesson = structuredClone(seedLessons[0]);
  const choice = lesson.exercises.find((e) => e.type === "multiple_choice")!;
  choice.options = ["搭巴士", "坐火車", "English only"];
  const match = lesson.exercises.find((e) => e.type === "match")!;
  match.pairs = [{ left: "去學校", right: "Go to school" }];
  const sentence = lesson.exercises.find((e) => e.type === "sentence_order")!;
  sentence.tokens = ["明天", "見"];
  const texts = lessonAudioTexts(lesson);
  for (const text of ["搭巴士", "坐火車", "去學校", "明天", "見"])
    assert.ok(texts.includes(text));
  assert.equal(texts.includes("English only"), false);
  assert.equal(texts.includes("Go to school"), false);
  assert.equal(texts.length, new Set(texts).size);
});

test("lesson voice cache reuses phrases, merges simultaneous requests, and respects voice changes", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "cantonese-listen-cache-"));
  const previousRoot = process.env.DEMO_DATA_DIR;
  const originalFetch = globalThis.fetch;
  process.env.DEMO_DATA_DIR = root;
  t.after(async () => {
    globalThis.fetch = originalFetch;
    if (previousRoot === undefined) delete process.env.DEMO_DATA_DIR;
    else process.env.DEMO_DATA_DIR = previousRoot;
    await rm(root, { recursive: true, force: true });
  });
  const settings = {
    ...(await readSettings()),
    ttsProvider: "azure" as const,
    ttsKey: "test-cache-key",
  };
  const bytes = Buffer.alloc(128);
  bytes.write("ID3");
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(bytes, { headers: { "Content-Type": "audio/mpeg" } });
  };
  const results = await Promise.all([
    listeningAudio("你好", settings),
    listeningAudio("你好", settings),
  ]);
  assert.deepEqual(results, [bytes, bytes]);
  assert.equal(calls, 1);
  await listeningAudio("你好", settings);
  assert.equal(calls, 1);
  await listeningAudio("你好", {
    ...settings,
    azureVoice: "zh-HK-WanLungNeural",
  });
  assert.equal(calls, 2);
});
