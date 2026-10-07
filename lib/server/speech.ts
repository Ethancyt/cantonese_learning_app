import { speechRejection } from "./speech-errors";
import { type Settings, validateEndpoints } from "./settings";
import { speakingFeedback } from "../ai/feedback";
import { pronunciationSchema } from "../pronunciation";

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function validateAzureWav(bytes: Buffer, assessment = false) {
  const invalid = () =>
    new Error(
      `Speech transcription needs a mono 16-bit PCM WAV recording, under ${assessment ? 30 : 60} seconds. Record again using the website.`,
    );
  if (
    bytes.length < 44 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WAVE" ||
    bytes.readUInt32LE(4) + 8 !== bytes.length
  )
    throw invalid();
  let validFormat = false,
    audioBytes = 0,
    rate = 0;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = bytes.toString("ascii", offset, offset + 4),
      length = bytes.readUInt32LE(offset + 4),
      data = offset + 8;
    if (data + length > bytes.length) throw invalid();
    if (name === "fmt ") {
      if (length < 16) throw invalid();
      rate = bytes.readUInt32LE(data + 4);
      validFormat =
        bytes.readUInt16LE(data) === 1 &&
        bytes.readUInt16LE(data + 2) === 1 &&
        [8000, 16000].includes(rate) &&
        bytes.readUInt16LE(data + 14) === 16 &&
        bytes.readUInt16LE(data + 12) === 2 &&
        bytes.readUInt32LE(data + 8) === rate * 2;
    }
    if (name === "data") audioBytes += length;
    offset = data + length + (length % 2);
  }
  if (
    !validFormat ||
    !audioBytes ||
    audioBytes % 2 ||
    audioBytes > rate * 2 * (assessment ? 30 : 60)
  )
    throw invalid();
  return rate;
}

async function recognizeAudio(
  file: File,
  settings: Settings,
  referenceText?: string,
): Promise<{ text: string; result: Record<string, unknown> }> {
  validateEndpoints(settings);
  if (!settings.speechKey) throw new Error("Add a speech API key first.");
  const azure = settings.speechProvider === "azure";
  let url: string,
    body: FormData | Uint8Array<ArrayBuffer> | string,
    headers: Record<string, string>;
  if (azure) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const rate = validateAzureWav(bytes, referenceText !== undefined);
    url = `https://${settings.speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-HK&format=${referenceText === undefined ? "simple" : "detailed"}`;
    body = new Uint8Array(bytes);
    headers = {
      "Ocp-Apim-Subscription-Key": settings.speechKey,
      "Content-Type": `audio/wav; codecs=audio/pcm; samplerate=${rate}`,
    };
    if (referenceText !== undefined) {
      if (!referenceText.trim() || referenceText.length > 700)
        throw new Error(
          "Speech transcription assessment needs a target phrase of 1–700 characters.",
        );
      // Basic scripted assessment uses the existing STT resource. Cantonese
      // supports word scores; en-US-only prosody is deliberately not requested.
      headers["Pronunciation-Assessment"] = Buffer.from(
        JSON.stringify({
          ReferenceText: referenceText,
          GradingSystem: "HundredMark",
          Granularity: "Word",
          Dimension: "Comprehensive",
          EnableMiscue: true,
        }),
        "utf8",
      ).toString("base64");
    }
  } else {
    url = settings.speechUrl;
    body = new FormData();
    body.set("file", file);
    body.set("model", settings.speechModel);
    body.set("language", "zh");
    headers = { Authorization: `Bearer ${settings.speechKey}` };
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new Error(
      "Speech transcription could not connect. Check Developer setup and retry.",
    );
  }
  if (!response.ok)
    throw new Error(
      speechRejection(
        response.status,
        azure ? "Azure Speech" : "Voice provider",
        "Speech transcription",
      ),
    );
  let result: Record<string, unknown>;
  try {
    result = object(await response.json());
  } catch {
    throw new Error("Speech transcription returned an invalid response.");
  }
  if (
    azure &&
    ["NoMatch", "InitialSilenceTimeout", "BabbleTimeout"].includes(
      String(result.RecognitionStatus),
    )
  )
    return { text: "", result };
  const best = object(
    Array.isArray(result.NBest) ? result.NBest[0] : undefined,
  );
  const text = azure ? (best.Display ?? result.DisplayText) : result.text;
  if (
    (azure && result.RecognitionStatus !== "Success") ||
    typeof text !== "string"
  )
    throw new Error("Speech transcription returned an invalid response.");
  return { text: text.slice(0, 2000), result };
}

export async function transcribeAudio(
  file: File,
  settings: Settings,
): Promise<string> {
  return (await recognizeAudio(file, settings)).text;
}

export async function assessSpeaking(
  file: File,
  settings: Settings,
  expected: string,
) {
  const azure = settings.speechProvider === "azure";
  const { text, result } = await recognizeAudio(
    file,
    settings,
    azure ? expected : undefined,
  );
  const feedback = speakingFeedback(expected, text);
  if (!azure) return { ...feedback, assessment: null };
  const best = object(
    Array.isArray(result.NBest) ? result.NBest[0] : undefined,
  );
  // REST scores are flat; also accept the nested Speech SDK shape. Never derive
  // pronunciation scores from transcript confidence or word equality.
  const scores =
    best.PronunciationAssessment === undefined
      ? best
      : object(best.PronunciationAssessment);
  const parsed = pronunciationSchema.safeParse({
    overall: scores.PronScore,
    accuracy: scores.AccuracyScore,
    fluency: scores.FluencyScore,
    completeness: scores.CompletenessScore,
    words: Array.isArray(best.Words)
      ? best.Words.map((value: unknown) => {
          const word = object(value);
          const detail =
            word.PronunciationAssessment === undefined
              ? word
              : object(word.PronunciationAssessment);
          return {
            word: word.Word,
            accuracy: detail.AccuracyScore ?? null,
            error: detail.ErrorType,
          };
        })
      : [],
  });
  if (!text || !parsed.success)
    return {
      ...feedback,
      assessment: null,
      message: text
        ? feedback.message
        : "No clear speech was recognized. Record the phrase again in a quiet place.",
      note: "Azure did not return a pronunciation assessment. No pronunciation score is given; try another recording.",
    };
  return {
    ...feedback,
    assessment: parsed.data,
    note: "Azure estimates pronunciation for this Cantonese phrase. Scores are practice guidance, not a separate Cantonese tone assessment.",
  };
}
