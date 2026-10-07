import test from "node:test";
import assert from "node:assert/strict";
import { transcribeAudio } from "../lib/server/speech";
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
