import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  synthesize,
  clipIdentity,
  generateLessonAudio,
  readClip,
} from "../lib/server/lesson-audio";
import { transcribeAudio } from "../lib/server/speech";
import {
  initializeDeveloper,
  saveSettings,
  readSettings,
  redactedSettings,
} from "../lib/server/settings";
import { seedLessons } from "../lib/seeds";
import { lessonAudioTexts } from "../lib/lesson-audio";
import { lessonSchema } from "../lib/schema";
import { encodePcmWav } from "../lib/audio-recording";

test("Knowlez uses documented JSON and X-API-Key contracts, saves reusable MP3s, and keeps keys private", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "cantonese-knowlez-"));
  const previousDemo = process.env.DEMO_DATA_DIR;
  const previousDeveloper = process.env.DEVELOPER_DATA_DIR;
  const originalFetch = globalThis.fetch;
  process.env.DEMO_DATA_DIR = root;
  process.env.DEVELOPER_DATA_DIR = root;
  t.after(async () => {
    globalThis.fetch = originalFetch;
    if (previousDemo === undefined) delete process.env.DEMO_DATA_DIR;
    else process.env.DEMO_DATA_DIR = previousDemo;
    if (previousDeveloper === undefined) delete process.env.DEVELOPER_DATA_DIR;
    else process.env.DEVELOPER_DATA_DIR = previousDeveloper;
    await rm(root, { recursive: true, force: true });
  });
  await initializeDeveloper("knowlez-test-developer-password");
  await saveSettings({
    ttsProvider: "knowlez",
    ttsUrl: "https://api-tts.knowlez.com/v1/tts/synthesise",
    ttsVoice: "test-only-cantonese-voice",
    ttsKey: "test-only-knowlez-tts-canary",
    speechProvider: "knowlez",
    speechUrl: "https://api-stt.knowlez.com/v1/stt/transcribe",
    speechKey: "test-only-knowlez-stt-canary",
  });
  const settings = await readSettings();
  const mp3 = await readFile("tests/fixtures/audio-test-tone.mp3");
  const wav = Buffer.from(encodePcmWav(new Float32Array(16000)));
  const file = new File([wav], "practice.wav", { type: "audio/wav" });
  let voiceCalls = 0;
  globalThis.fetch = async (url, options) => {
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("Authorization"), null);
    assert.equal(headers.get("Ocp-Apim-Subscription-Key"), null);
    assert.equal(headers.get("Content-Type"), "application/json");
    const body = JSON.parse(String(options?.body));
    if (String(url) === settings.ttsUrl) {
      voiceCalls++;
      assert.equal(headers.get("X-API-Key"), settings.ttsKey);
      assert.deepEqual(Object.keys(body).sort(), [
        "format",
        "return",
        "speed",
        "text",
        "voice",
      ]);
      assert.equal(body.voice, settings.ttsVoice);
      assert.equal(body.format, "mp3");
      assert.equal(body.return, "audio");
      assert.equal(body.speed, 0.85);
      assert.equal(typeof body.text, "string");
      return new Response(mp3, {
        status: 201,
        headers: { "Content-Type": "audio/mpeg" },
      });
    }
    assert.equal(String(url), settings.speechUrl);
    assert.equal(headers.get("X-API-Key"), settings.speechKey);
    assert.deepEqual(body, {
      audio_base64: wav.toString("base64"),
      filename: "practice.wav",
    });
    return Response.json(
      { text: "你好。", language: "zh", segments: [] },
      { status: 201 },
    );
  };
  assert.deepEqual(await synthesize("你好", settings), mp3);
  assert.equal(await transcribeAudio(file, settings), "你好。");
  assert.equal(
    clipIdentity("你好", settings),
    clipIdentity("你好", {
      ...settings,
      ttsKey: "rotated-canary",
      ttsModel: "unused-model",
    }),
  );
  assert.notEqual(
    clipIdentity("你好", settings),
    clipIdentity("你好", { ...settings, ttsVoice: "other-voice" }),
  );
  const lesson = structuredClone(seedLessons[1]);
  lesson.id = "knowlez-audio-draft";
  lesson.createdBy = crypto.randomUUID();
  lesson.status = "under_review";
  await saveSettings({ ttsVoice: "af_bella" });
  const beforeBlocked = voiceCalls;
  await assert.rejects(
    () => generateLessonAudio(null, lesson),
    /af_bella is not verified for Cantonese/,
  );
  assert.equal(
    voiceCalls,
    beforeBlocked,
    "the default voice cannot generate Cantonese lesson clips or incur a request",
  );
  await saveSettings({ ttsVoice: settings.ttsVoice });
  let result = await generateLessonAudio(null, lesson);
  while (result.remaining)
    result = await generateLessonAudio(null, result.lesson);
  assert.equal(result.lesson.audio?.length, lessonAudioTexts(lesson).length);
  assert.ok(
    result.lesson.audio?.every(
      (c) => c.provider === "knowlez" && c.model === "knowlez-tts",
    ),
  );
  lessonSchema.parse(result.lesson);
  assert.deepEqual(
    await readClip(null, lesson.id, result.lesson.audio![0].id),
    mp3,
  );
  const completed = voiceCalls;
  await generateLessonAudio(null, result.lesson);
  assert.equal(
    voiceCalls,
    completed,
    "saved Knowlez clips are reused without billing another request",
  );
  assert.doesNotMatch(
    JSON.stringify(redactedSettings(settings)),
    /test-only-knowlez/,
  );
  assert.equal(
    (await readFile(path.join(root, "developer.enc"))).includes(
      Buffer.from(settings.ttsKey),
    ),
    false,
  );

  for (const status of [401, 403, 422, 429]) {
    globalThis.fetch = async () =>
      Response.json(
        { leaked: settings.ttsKey, leakedStt: settings.speechKey },
        { status },
      );
    for (const action of [
      () => synthesize("你好", settings),
      () => transcribeAudio(file, settings),
    ]) {
      await assert.rejects(action, (e: Error) => {
        assert.ok(e.message.includes(`Knowlez HTTP ${status}`));
        assert.doesNotMatch(e.message, /test-only-knowlez/);
        return true;
      });
    }
  }
  globalThis.fetch = async () =>
    Response.json({ url: "https://example.com/unsupported-response" });
  await assert.rejects(() => synthesize("你好", settings), /MP3/);
  await assert.rejects(
    () => transcribeAudio(file, settings),
    /invalid response/,
  );
});
