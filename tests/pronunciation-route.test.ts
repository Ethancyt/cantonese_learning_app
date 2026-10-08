import test from "node:test";
import assert from "node:assert/strict";
import { encodePcmWav } from "../lib/audio-recording";

// Requires a separate, empty test data directory and the explicit mock preload
// in tests/helpers/azure-speech-mock.mjs. No live Azure resource is contacted.
const base = process.env.TEST_AZURE_BASE_URL;
test(
  "speaking HTTP route assesses the authorized published answer and returns Azure scores",
  { skip: !base },
  async () => {
    const cookies = new Map<string, string>();
    async function call(path: string, data?: unknown) {
      const form = data instanceof FormData;
      const response = await fetch(base + path, {
        method: data === undefined ? "GET" : "POST",
        headers: {
          Origin: base!,
          Cookie: [...cookies]
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
          ...(data !== undefined && !form
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body:
          data === undefined
            ? undefined
            : form
              ? (data as FormData)
              : JSON.stringify(data),
      });
      for (const value of response.headers.getSetCookie()) {
        const first = value.split(";")[0],
          equals = first.indexOf("=");
        cookies.set(first.slice(0, equals), first.slice(equals + 1));
      }
      return {
        status: response.status,
        body: response.headers.get("Content-Type")?.includes("audio/mpeg")
          ? { audioBytes: (await response.arrayBuffer()).byteLength }
          : await response.json(),
      };
    }
    assert.equal(
      (
        await call("/api/developer", {
          action: "initialize",
          password: "pronunciation-http-test-password",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await call("/api/developer", {
          action: "save",
          settings: {
            speechProvider: "azure",
            speechKey: "test-only-pronunciation-key",
            speechRegion: "eastasia",
          },
        })
      ).status,
      200,
    );
    const initial = await call("/api/data");
    const lesson = initial.body.lessons.find((lesson: any) =>
      lesson.exercises.some((exercise: any) => exercise.type === "speak"),
    );
    assert.ok(lesson);
    const exercise = lesson.exercises.find(
      (exercise: any) => exercise.type === "speak",
    );
    function recording() {
      const form = new FormData();
      form.set("lessonId", lesson.id);
      form.set("version", String(lesson.version));
      form.set("exerciseId", exercise.id);
      form.set(
        "audio",
        new File([encodePcmWav(new Float32Array(16000))], "practice.wav", {
          type: "audio/wav",
        }),
      );
      form.set("referenceText", "forged-client-target");
      return form;
    }
    try {
      const feedback = await call("/api/transcribe", recording());
      assert.equal(feedback.status, 200, JSON.stringify(feedback.body));
      assert.equal(feedback.body.expected, exercise.answer);
      assert.equal(
        feedback.body.recognized,
        exercise.answer,
        "Azure reference must use the published answer, ignoring the client target",
      );
      assert.equal(feedback.body.matches, true);
      assert.equal(feedback.body.assessment.overall, 90);
      assert.equal(
        feedback.body.assessment.accuracy,
        87,
        "provider accuracy is not calculated from text equality",
      );
      assert.doesNotMatch(
        JSON.stringify(feedback.body),
        /test-only-pronunciation-key|forged-client-target/,
      );
      const wrongVersion = recording();
      wrongVersion.set("version", "9999");
      assert.equal((await call("/api/transcribe", wrongVersion)).status, 400);
      const wrongExercise = recording();
      wrongExercise.set("exerciseId", "not-a-published-speaking-exercise");
      assert.equal((await call("/api/transcribe", wrongExercise)).status, 400);
      const flashcard = lesson.exercises.find(
        (e: any) => e.type === "flashcard",
      );
      const section = lesson.module?.sections.find((s: any) =>
        s.exerciseIds.includes(flashcard.id),
      );
      const word = lesson.vocabulary.find(
        (v: any) => !section || section.vocabularyIds.includes(v.id),
      );
      const flashRecording = recording();
      flashRecording.set("exerciseId", flashcard.id);
      flashRecording.set("vocabularyId", word.id);
      const wordFeedback = await call("/api/transcribe", flashRecording);
      assert.equal(wordFeedback.status, 200, JSON.stringify(wordFeedback.body));
      assert.equal(wordFeedback.body.expected, word.traditional);
      assert.equal(wordFeedback.body.assessment.accuracy, 87);
      flashRecording.set("vocabularyId", "unpublished-word");
      assert.equal((await call("/api/transcribe", flashRecording)).status, 400);
      flashRecording.delete("vocabularyId");
      assert.equal((await call("/api/transcribe", flashRecording)).status, 400);

      await call("/api/developer", {
        action: "save",
        settings: {
          ttsProvider: "azure",
          ttsKey: "test-only-listening-key",
          azureRegion: "eastasia",
        },
      });
      const voiceRequest = {
        lessonId: lesson.id,
        version: lesson.version,
        text: word.traditional,
      };
      const voice = await call("/api/audio", voiceRequest);
      assert.equal(voice.status, 200);
      assert.equal(voice.body.audioBytes > 16, true);
      const replay = await call("/api/audio", voiceRequest);
      assert.equal(replay.status, 200);
      assert.equal(replay.body.audioBytes, voice.body.audioBytes);
      assert.equal(
        (await call("/api/audio", { ...voiceRequest, text: "未授權的新句子" }))
          .status,
        400,
      );
      assert.equal(
        (await call("/api/audio", { ...voiceRequest, version: 9999 })).status,
        400,
      );
    } finally {
      await call("/api/developer", {
        action: "save",
        settings: { speechKey: null, ttsKey: null },
      });
    }
  },
);
