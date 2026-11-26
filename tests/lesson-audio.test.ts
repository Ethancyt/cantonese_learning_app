import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { seedLessons } from "../lib/seeds";
import {
  exerciseAudioText,
  lessonAudioTexts,
  retainedAudio,
} from "../lib/lesson-audio";
import {
  initializeDeveloper,
  saveSettings,
  readSettings,
} from "../lib/server/settings";

test("speaking reference audio uses the checked answer rather than activity instructions", () => {
  const lesson = structuredClone(seedLessons[0]);
  const speaking = lesson.exercises.find((e) => e.type === "speak")!;
  speaking.prompt = "請講以下句子：我係學生。";
  speaking.answer = "我係學生。";
  assert.equal(exerciseAudioText(speaking), speaking.answer);
  assert.ok(lessonAudioTexts(lesson).includes(speaking.answer));
  assert.equal(lessonAudioTexts(lesson).includes(speaking.prompt), false);
  const listening = lesson.exercises.find((e) => e.type === "listen_choose")!;
  assert.equal(exerciseAudioText(listening), listening.prompt);
});

test("lesson audio escapes Azure SSML, stores reusable clips, resumes failures and invalidates edited text", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "cantonese-audio-unit-"));
  process.env.DEMO_DATA_DIR = root;
  process.env.DEVELOPER_DATA_DIR = root;
  const realFetch = globalThis.fetch;
  t.after(async () => {
    globalThis.fetch = realFetch;
    delete process.env.DEMO_DATA_DIR;
    delete process.env.DEVELOPER_DATA_DIR;
    await rm(root, { recursive: true, force: true });
  });
  await initializeDeveloper("audio-unit-test-password");
  const { synthesize, generateLessonAudio, clipIdentity, readClip } =
    await import("../lib/server/lesson-audio");
  const { readData, saveLesson } = await import("../lib/server/repository");
  const mp3 = Buffer.alloc(128);
  mp3.write("ID3");
  const calls: { url: string; body: string; headers: Headers }[] = [];
  let failAt = 0;
  globalThis.fetch = async (url, options) => {
    calls.push({
      url: String(url),
      body: String(options?.body),
      headers: new Headers(options?.headers),
    });
    if (failAt === calls.length)
      return new Response('{"error":"private-provider-key"}', { status: 429 });
    return new Response(mp3, { headers: { "Content-Type": "audio/mpeg" } });
  };
  const base = await readSettings();
  await assert.rejects(
    () => synthesize("你好", { ...base, ttsProvider: "disabled" }),
    /voice provider/,
  );
  await saveSettings({
    ttsProvider: "azure",
    ttsKey: "private-voice-key",
    azureRegion: "eastasia",
  });
  const azure = await readSettings();
  await synthesize('你好<&"', azure);
  assert.equal(
    calls[0].url,
    "https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1",
  );
  assert.match(calls[0].body, /zh-HK-HiuMaanNeural/);
  assert.match(
    calls[0].body,
    /xmlns="http:\/\/www.w3.org\/2001\/10\/synthesis"/,
  );
  assert.equal(calls[0].headers.get("User-Agent"), "CantoneseLearningApp/1.0");
  assert.equal(
    calls[0].headers.get("Content-Type"),
    "application/ssml+xml; charset=utf-8",
  );
  assert.match(calls[0].body, /你好&lt;&amp;&quot;/);
  assert.equal(
    calls[0].headers.get("Ocp-Apim-Subscription-Key"),
    "private-voice-key",
  );
  await synthesize("你好！好高興識你！", azure);
  assert.match(
    calls[1].body,
    /你好！<phoneme alphabet="sapi" ph="hou 2 gou 1 hing 3 sik 1 nei 5">好高興識你<\/phoneme>！/,
  );
  await synthesize("聽日見！聽日你去邊度呀？", azure);
  assert.match(
    calls[2].body,
    /<phoneme alphabet="sapi" ph="ting 1 jat 6 gin 3">聽日見<\/phoneme>！<phoneme alphabet="sapi" ph="ting 1 jat 6">聽日<\/phoneme>你去邊度<phoneme alphabet="sapi" ph="aa 3">呀<\/phoneme>？/,
  );
  const previousAzureClip = (text: string, ...overrides: string[]) =>
    createHash("sha256")
      .update(
        JSON.stringify([
          "cantonese-audio-v1",
          text,
          "azure",
          azure.azureRegion,
          azure.azureVoice,
          "ssml-rate-minus-15",
          ...overrides,
        ]),
      )
      .digest("hex");
  assert.notEqual(
    clipIdentity("好高興識你", azure),
    previousAzureClip("好高興識你"),
  );
  assert.equal(clipIdentity("你好", azure), previousAzureClip("你好"));
  for (const corrected of ["聽日見", "呀？"])
    assert.notEqual(
      clipIdentity(corrected, azure),
      previousAzureClip(corrected),
    );
  const workshopQuestions = {
    "你叫咩名呀？": "nei 5 giu 3 me 1 meng 2 aa 3",
    "你姓咩呀？": "nei 5 sing 3 me 1 aa 3",
    "你係邊度人呀？": "nei 5 hai 6 bin 1 dou 6 jan 4 aa 3",
    "你住喺邊度呀？": "nei 5 zyu 6 hai 2 bin 1 dou 6 aa 3",
  };
  assert.deepEqual(
    lessonAudioTexts(seedLessons[0])
      .filter((text) => text !== "呀？" && text.endsWith("呀？"))
      .sort(),
    Object.keys(workshopQuestions).sort(),
  );
  for (const [question, reading] of Object.entries(workshopQuestions)) {
    await synthesize(question, azure);
    assert.ok(
      calls
        .at(-1)
        ?.body.includes(
          `<phoneme alphabet="sapi" ph="${reading}">${question.slice(0, -1)}</phoneme>？`,
        ),
    );
    assert.notEqual(
      clipIdentity(question, azure),
      previousAzureClip(
        question,
        '<phoneme alphabet="sapi" ph="aa 3">呀</phoneme>',
      ),
    );
  }
  await synthesize("名", azure);
  assert.ok(
    calls
      .at(-1)
      ?.body.includes('<phoneme alphabet="sapi" ph="meng 2">名</phoneme>'),
  );
  assert.notEqual(clipIdentity("名", azure), previousAzureClip("名"));
  assert.equal(clipIdentity("有名", azure), previousAzureClip("有名"));
  await saveSettings({
    ttsProvider: "compatible",
    ttsKey: "private-compatible-key",
    ttsModel: "tts-1",
  });
  const lesson = structuredClone(seedLessons[0]);
  lesson.id = "audio-test-draft";
  lesson.vocabulary[0] = {
    ...lesson.vocabulary[0],
    traditional: "測試錄音",
    example: "測試錄音",
  };
  lesson.createdBy = crypto.randomUUID();
  lesson.status = "under_review";
  lesson.version = 1;
  await saveLesson(null, lesson);
  failAt = calls.length + 2;
  await assert.rejects(() => generateLessonAudio(null, lesson), /rejected/);
  let stored = (await readData(null, lesson.createdBy)).lessons.find(
    (l) => l.id === lesson.id,
  )!;
  assert.equal(
    stored.audio?.length,
    1,
    "successful phrases survive a later provider failure",
  );
  failAt = 0;
  let result = await generateLessonAudio(null, stored);
  while (result.remaining)
    result = await generateLessonAudio(null, result.lesson);
  const settings = await readSettings();
  const completedCalls = calls.length;
  await generateLessonAudio(null, result.lesson);
  assert.equal(
    calls.length,
    completedCalls,
    "retrying complete audio does not call the provider",
  );
  const compatible = calls.find((c) => c.headers.has("Authorization"))!;
  assert.equal(
    compatible.headers.get("Authorization"),
    "Bearer private-compatible-key",
  );
  assert.equal(
    JSON.parse(compatible.body).instructions,
    undefined,
    "legacy TTS models do not receive unsupported instructions",
  );
  assert.equal(JSON.parse(compatible.body).response_format, "mp3");
  assert.equal(result.lesson.audio?.length, lessonAudioTexts(lesson).length);
  assert.deepEqual(
    await readClip(null, lesson.id, result.lesson.audio![0].id),
    mp3,
  );
  assert.equal(
    clipIdentity("你好", settings),
    clipIdentity("你好", { ...settings, ttsKey: "rotated-key" }),
  );
  assert.notEqual(
    clipIdentity("你好", settings),
    clipIdentity("你好", { ...settings, ttsVoice: "nova" }),
  );
  const edited = structuredClone(result.lesson);
  const previousText = edited.vocabulary[0].traditional;
  edited.vocabulary[0] = {
    ...edited.vocabulary[0],
    traditional: "新詞語",
    example: "新詞語",
  };
  assert.equal(
    retainedAudio(edited, result.lesson).some((c) => c.text === previousText),
    false,
  );
  await assert.rejects(
    () => readClip(null, "../outside", "a".repeat(64)),
    /Invalid/,
  );
  globalThis.fetch = async () =>
    new Response('{"private-key":"bad"}', {
      headers: { "Content-Type": "application/json" },
    });
  await assert.rejects(() => synthesize("你好", settings), /MP3/);
});
