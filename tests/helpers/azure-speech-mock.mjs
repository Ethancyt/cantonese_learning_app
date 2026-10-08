// Explicit test-server preload only. Never imported by application code.
// Start an isolated server with TEST_AZURE_SPEECH_MOCK=true and
// NODE_OPTIONS="--import ./tests/helpers/azure-speech-mock.mjs" so the preload
// also reaches the Next.js child started by scripts/start-local.mjs.
import { readFile } from "node:fs/promises";
if (process.env.TEST_AZURE_SPEECH_MOCK === "true") {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname.endsWith(".tts.speech.microsoft.com")) {
      const headers = new Headers(options?.headers);
      if (
        headers.get("Ocp-Apim-Subscription-Key") !== "test-only-listening-key"
      )
        throw new Error("Unexpected test voice authentication.");
      return new Response(
        await readFile(
          new URL("../fixtures/audio-test-tone.mp3", import.meta.url),
        ),
        {
          headers: { "Content-Type": "audio/mpeg" },
        },
      );
    }
    if (!url.hostname.endsWith(".stt.speech.microsoft.com"))
      return original(input, options);
    const headers = new Headers(options?.headers);
    if (
      headers.get("Ocp-Apim-Subscription-Key") !== "test-only-pronunciation-key"
    )
      throw new Error("Unexpected test speech authentication.");
    const config = JSON.parse(
      Buffer.from(
        headers.get("Pronunciation-Assessment") || "",
        "base64",
      ).toString("utf8"),
    );
    if (
      url.searchParams.get("language") !== "zh-HK" ||
      url.searchParams.get("format") !== "detailed" ||
      config.GradingSystem !== "HundredMark" ||
      config.Dimension !== "Comprehensive" ||
      config.EnableMiscue !== true ||
      !config.ReferenceText
    )
      throw new Error("Unexpected test assessment contract.");
    const audio = Buffer.from(options.body);
    if (
      audio.toString("ascii", 0, 4) !== "RIFF" ||
      audio.readUInt32LE(24) !== 16000
    )
      throw new Error("Unexpected test audio format.");
    return Response.json({
      RecognitionStatus: "Success",
      NBest: [
        {
          Display: config.ReferenceText,
          Confidence: 0.99,
          PronScore: 90,
          AccuracyScore: 87,
          FluencyScore: 91,
          CompletenessScore: 100,
          Words: [
            {
              Word: config.ReferenceText,
              AccuracyScore: 87,
              ErrorType: "None",
            },
          ],
        },
      ],
    });
  };
}
