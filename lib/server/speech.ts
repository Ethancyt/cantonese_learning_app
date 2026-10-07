import { type Settings, validateEndpoints } from "./settings";

function validateAzureWav(bytes: Buffer) {
  const invalid = () =>
    new Error(
      "Speech transcription needs a mono 16-bit PCM WAV recording, under 60 seconds. Record again using the website.",
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
    audioBytes > rate * 2 * 60
  )
    throw invalid();
  return rate;
}

export async function transcribeAudio(
  file: File,
  settings: Settings,
): Promise<string> {
  validateEndpoints(settings);
  if (!settings.speechKey) throw new Error("Add a speech API key first.");
  const azure = settings.speechProvider === "azure";
  let url: string,
    body: FormData | Uint8Array<ArrayBuffer>,
    headers: Record<string, string>;
  if (azure) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const rate = validateAzureWav(bytes);
    url = `https://${settings.speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-HK&format=simple`;
    body = new Uint8Array(bytes);
    headers = {
      "Ocp-Apim-Subscription-Key": settings.speechKey,
      "Content-Type": `audio/wav; codecs=audio/pcm; samplerate=${rate}`,
    };
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
      "Speech transcription failed. Check the API key, region or endpoint, and provider quota.",
    );
  let result: Record<string, unknown>;
  try {
    result = await response.json();
  } catch {
    throw new Error("Speech transcription returned an invalid response.");
  }
  if (
    azure &&
    ["NoMatch", "InitialSilenceTimeout", "BabbleTimeout"].includes(
      String(result.RecognitionStatus),
    )
  )
    return "";
  const text = azure ? result.DisplayText : result.text;
  if (
    (azure && result.RecognitionStatus !== "Success") ||
    typeof text !== "string"
  )
    throw new Error("Speech transcription returned an invalid response.");
  return text.slice(0, 2000);
}
