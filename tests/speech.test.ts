import test from "node:test";
import assert from "node:assert/strict";
import { transcribeAudio, assessSpeaking } from "../lib/server/speech";
import { readSettings } from "../lib/server/settings";
import { encodePcmWav } from "../lib/audio-recording";
import { speakingFeedback } from "../lib/ai/feedback";

test("spoken-word feedback shows the expected target and distinguishes matching from different words", () => {
  const correct = speakingFeedback("我係學生。", "我係學生！");
  assert.equal(correct.expected, "我係學生。");
  assert.equal(correct.matches, true);
  assert.equal(speakingFeedback("我係學生。", "我係老師。").matches, false);
  assert.match(correct.note, /not tone accuracy/);
});

test("Azure Cantonese STT sends PCM audio and handles word recognition without exposing provider errors", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const settings = {
    ...(await readSettings()),
    speechProvider: "azure" as const,
    speechKey: "private-azure-test-key",
    speechRegion: "eastasia",
  };
  const bytes = encodePcmWav(new Float32Array(16000));
  const audio = new File([bytes], "practice.wav", { type: "audio/wav" });
  let calls = 0;
  let payload: unknown = {
    RecognitionStatus: "Success",
    DisplayText: "你好。",
  };
  let status = 200;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(
      String(url),
      "https://eastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-HK&format=simple",
    );
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("Ocp-Apim-Subscription-Key"), settings.speechKey);
    assert.equal(headers.get("Authorization"), null);
    assert.equal(
      headers.get("Content-Type"),
      "audio/wav; codecs=audio/pcm; samplerate=16000",
    );
    assert.deepEqual(options?.body, new Uint8Array(bytes));
    return Response.json(payload, { status });
  };
  assert.equal(await transcribeAudio(audio, settings), "你好。");
  for (const RecognitionStatus of [
    "NoMatch",
    "InitialSilenceTimeout",
    "BabbleTimeout",
  ]) {
    payload = { RecognitionStatus };
    assert.equal(await transcribeAudio(audio, settings), "");
  }
  payload = {
    RecognitionStatus: "Error",
    DisplayText: "private-provider-error",
  };
  await assert.rejects(
    () => transcribeAudio(audio, settings),
    /invalid response/,
  );
  status = 401;
  payload = { error: settings.speechKey };
  await assert.rejects(
    () => transcribeAudio(audio, settings),
    (e: Error) =>
      /Speech transcription provider rejected.*401/.test(e.message) &&
      !e.message.includes(settings.speechKey),
  );
  const previous = calls;
  await assert.rejects(
    () =>
      transcribeAudio(
        new File(["fake-webm"], "fake.webm", { type: "audio/webm" }),
        settings,
      ),
    /PCM WAV/,
  );
  await assert.rejects(
    () =>
      transcribeAudio(
        new File([encodePcmWav(new Float32Array(16000 * 61))], "long.wav"),
        settings,
      ),
    /under 60/,
  );
  assert.equal(
    calls,
    previous,
    "invalid audio is rejected before calling the provider",
  );
  globalThis.fetch = async (_url, options) => {
    assert.equal(
      new Headers(options?.headers).get("Authorization"),
      `Bearer ${settings.speechKey}`,
    );
    const body = options?.body as FormData;
    assert.equal(body.get("model"), "whisper-1");
    assert.equal(body.get("language"), "zh");
    assert.equal((body.get("file") as File).type, "audio/wav");
    return Response.json({ text: "早晨" });
  };
  assert.equal(
    await transcribeAudio(audio, {
      ...settings,
      speechProvider: "compatible",
      speechModel: "whisper-1",
    }),
    "早晨",
  );
});

test("browser WAV encoding clamps samples and records the portable audio format", () => {
  const view = new DataView(
    encodePcmWav(new Float32Array([-2, -0.5, 0, 0.5, 2])),
  );
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 10);
  assert.deepEqual(
    [44, 46, 48, 50, 52].map((offset) => view.getInt16(offset, true)),
    [-32768, -16384, 0, 16384, 32767],
  );
});

test("Azure scripted Cantonese assessment uses one authenticated request and returns provider word scores", async (t) => {
  const realFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  const settings = {
    ...(await readSettings()),
    speechProvider: "azure" as const,
    speechKey: "assessment-test-canary",
    speechRegion: "southeastasia",
  };
  const bytes = encodePcmWav(new Float32Array(16000));
  const file = new File([bytes], "practice.wav", { type: "audio/wav" });
  const scores = {
    PronScore: 73.4,
    AccuracyScore: 65.2,
    FluencyScore: 82.1,
    CompletenessScore: 90,
  };
  let payload: unknown = {
    RecognitionStatus: "Success",
    NBest: [
      {
        Display: "我係學生。",
        Confidence: 0.99,
        ...scores,
        Words: [
          { Word: "我", AccuracyScore: 54, ErrorType: "Mispronunciation" },
          { Word: "係", AccuracyScore: 0, ErrorType: "Omission" },
          { Word: "老師", ErrorType: "Insertion" },
        ],
      },
    ],
  };
  let requests = 0;
  globalThis.fetch = async (url, options) => {
    requests++;
    const endpoint = new URL(String(url));
    assert.equal(endpoint.hostname, "southeastasia.stt.speech.microsoft.com");
    assert.equal(endpoint.searchParams.get("language"), "zh-HK");
    assert.equal(endpoint.searchParams.get("format"), "detailed");
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("Ocp-Apim-Subscription-Key"), settings.speechKey);
    assert.deepEqual(
      JSON.parse(
        Buffer.from(
          headers.get("Pronunciation-Assessment")!,
          "base64",
        ).toString("utf8"),
      ),
      {
        ReferenceText: "我係學生。",
        GradingSystem: "HundredMark",
        Granularity: "Word",
        Dimension: "Comprehensive",
        EnableMiscue: true,
      },
    );
    assert.deepEqual(options?.body, new Uint8Array(bytes));
    return Response.json(payload);
  };
  const feedback = await assessSpeaking(file, settings, "我係學生。");
  assert.equal(requests, 1);
  assert.equal(feedback.matches, true);
  assert.equal(feedback.recognized, "我係學生。");
  assert.deepEqual(feedback.assessment, {
    overall: 73.4,
    accuracy: 65.2,
    fluency: 82.1,
    completeness: 90,
    words: [
      { word: "我", accuracy: 54, error: "Mispronunciation" },
      { word: "係", accuracy: 0, error: "Omission" },
      { word: "老師", accuracy: null, error: "Insertion" },
    ],
  });
  assert.doesNotMatch(
    JSON.stringify(feedback),
    /assessment-test-canary|Confidence/,
  );
  assert.match(feedback.note, /not a separate Cantonese tone/);
  payload = {
    RecognitionStatus: "Success",
    NBest: [
      {
        Display: "我係學生。",
        PronunciationAssessment: scores,
        Words: [
          {
            Word: "學生",
            PronunciationAssessment: { AccuracyScore: 78, ErrorType: "None" },
          },
        ],
      },
    ],
  };
  assert.equal(
    (await assessSpeaking(file, settings, "我係學生。")).assessment?.words[0]
      .accuracy,
    78,
  );
});

test("assessment never invents scores for silence, missing scores, or malformed provider results", async (t) => {
  const realFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  const settings = {
    ...(await readSettings()),
    speechKey: "assessment-no-score-canary",
    speechProvider: "azure" as const,
  };
  const file = new File(
    [encodePcmWav(new Float32Array(16000))],
    "practice.wav",
  );
  const valid = {
    Display: "你好",
    PronScore: 70,
    AccuracyScore: 60,
    FluencyScore: 80,
    CompletenessScore: 90,
  };
  for (const payload of [
    { RecognitionStatus: "NoMatch" },
    { RecognitionStatus: "InitialSilenceTimeout" },
    {
      RecognitionStatus: "Success",
      NBest: [{ Display: "你好", Confidence: 0.99 }],
    },
    { RecognitionStatus: "Success", NBest: [{ ...valid, AccuracyScore: 101 }] },
    { RecognitionStatus: "Success", NBest: [{ ...valid, AccuracyScore: -1 }] },
    { RecognitionStatus: "Success", NBest: [{ ...valid, PronScore: "70" }] },
    { RecognitionStatus: "Success", NBest: [{ ...valid, Words: [null] }] },
    {
      RecognitionStatus: "Success",
      NBest: [
        {
          ...valid,
          Words: [{ Word: "你好", AccuracyScore: 50, ErrorType: "Unexpected" }],
        },
      ],
    },
  ]) {
    let requests = 0;
    globalThis.fetch = async () => {
      requests++;
      return Response.json(payload);
    };
    const feedback = await assessSpeaking(file, settings, "你好");
    assert.equal(
      requests,
      1,
      "missing scores do not cause a second billable request",
    );
    assert.equal(feedback.assessment, null);
    assert.match(feedback.note, /No pronunciation score/);
  }
  globalThis.fetch = async () =>
    Response.json({
      RecognitionStatus: "Success",
      NBest: [
        {
          ...valid,
          PronScore: 0,
          AccuracyScore: 0,
          FluencyScore: 0,
          CompletenessScore: 0,
        },
      ],
    });
  assert.equal(
    (await assessSpeaking(file, settings, "你好")).assessment?.overall,
    0,
    "a real zero score is preserved",
  );
});

test("assessment respects short-audio limits, exposes quota errors safely, and keeps compatible STT as word-only feedback", async (t) => {
  const realFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  const settings = {
    ...(await readSettings()),
    speechKey: "assessment-quota-canary",
    speechProvider: "azure" as const,
  };
  const file = new File(
    [encodePcmWav(new Float32Array(16000))],
    "practice.wav",
  );
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return Response.json({ error: settings.speechKey }, { status: 429 });
  };
  await assert.rejects(
    () => assessSpeaking(file, settings, "你好"),
    (error: Error) =>
      /HTTP 429/.test(error.message) &&
      !error.message.includes(settings.speechKey),
  );
  assert.equal(requests, 1);
  await assert.rejects(
    () =>
      assessSpeaking(
        new File([encodePcmWav(new Float32Array(16000 * 31))], "too-long.wav"),
        settings,
        "你好",
      ),
    /under 30/,
  );
  await assert.rejects(
    () => assessSpeaking(file, settings, ""),
    /target phrase/,
  );
  await assert.rejects(
    () => assessSpeaking(file, settings, "你".repeat(701)),
    /target phrase/,
  );
  assert.equal(requests, 1, "invalid input is rejected before calling Azure");
  globalThis.fetch = async (_url, options) => {
    assert.equal(
      new Headers(options?.headers).get("Pronunciation-Assessment"),
      null,
    );
    return Response.json({ text: "你好" });
  };
  const feedback = await assessSpeaking(
    file,
    { ...settings, speechProvider: "compatible" },
    "你好",
  );
  assert.equal(feedback.matches, true);
  assert.equal(feedback.assessment, null);
  assert.match(feedback.note, /not tone accuracy/);
});
