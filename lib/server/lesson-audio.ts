import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AudioClip, Lesson } from "../schema";
import { lessonAudioTexts } from "../lesson-audio";
import { readSettings, validateEndpoints, type Settings } from "./settings";
import { saveLesson } from "./repository";

const bucket = "lesson-audio";
const maxBytes = 2 * 1024 * 1024;
function xml(text: string) {
  return text.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}
export function clipIdentity(text: string, settings: Settings) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        "cantonese-audio-v1",
        text,
        settings.ttsProvider,
        settings.ttsProvider === "azure"
          ? settings.azureRegion
          : settings.ttsUrl,
        settings.ttsProvider === "azure"
          ? settings.azureVoice
          : settings.ttsVoice,
        settings.ttsProvider === "azure"
          ? "ssml-rate-minus-15"
          : settings.ttsModel,
      ]),
    )
    .digest("hex");
}
export async function synthesize(
  text: string,
  settings: Settings,
): Promise<Buffer> {
  validateEndpoints(settings);
  if (settings.ttsProvider === "disabled" || !settings.ttsKey)
    throw new Error(
      "Lesson audio needs a voice provider and API key in Developer setup.",
    );
  if (!text.trim() || text.length > 700)
    throw new Error("Lesson audio phrases must contain 1–700 characters.");
  const azure = settings.ttsProvider === "azure";
  let response: Response;
  try {
    response = await fetch(
      azure
        ? `https://${settings.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`
        : settings.ttsUrl,
      {
        method: "POST",
        headers: azure
          ? {
              "Ocp-Apim-Subscription-Key": settings.ttsKey,
              "Content-Type": "application/ssml+xml",
              "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            }
          : {
              Authorization: `Bearer ${settings.ttsKey}`,
              "Content-Type": "application/json",
            },
        body: azure
          ? `<speak version="1.0" xml:lang="zh-HK"><voice name="${settings.azureVoice}"><prosody rate="-15%">${xml(text)}</prosody></voice></speak>`
          : JSON.stringify({
              model: settings.ttsModel,
              voice: settings.ttsVoice,
              input: text,
              response_format: "mp3",
              ...(settings.ttsModel.startsWith("gpt-4o")
                ? {
                    instructions:
                      "Speak naturally in Hong Kong Cantonese. Keep the Cantonese wording; do not translate it into Mandarin.",
                  }
                : {}),
            }),
        signal: AbortSignal.timeout(25000),
      },
    );
  } catch {
    throw new Error(
      "Lesson audio provider could not connect. Check Developer setup and retry.",
    );
  }
  if (!response.ok)
    throw new Error(
      "Lesson audio provider rejected the request. Check its key, voice, model, and quota.",
    );
  if (
    !/audio\/(mpeg|mp3)|application\/octet-stream/i.test(
      response.headers.get("content-type") || "",
    )
  )
    throw new Error("Lesson audio provider did not return an MP3 file.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Lesson audio provider returned an empty file.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Lesson audio file is too large. Shorten the phrase.");
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  if (
    bytes.length < 16 ||
    !(
      bytes.subarray(0, 3).toString() === "ID3" ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
    )
  )
    throw new Error("Lesson audio provider did not return a valid MP3 file.");
  return bytes;
}
function objectKey(lessonId: string, clipId: string) {
  if (
    !/^[a-zA-Z0-9_-]{1,100}$/.test(lessonId) ||
    !/^[a-f0-9]{64}$/.test(clipId)
  )
    throw new Error("Invalid lesson audio reference.");
  return `${lessonId}/${clipId}.mp3`;
}
function filename(key: string) {
  return path.join(
    process.env.DEMO_DATA_DIR || path.join(process.cwd(), ".data"),
    "audio",
    key,
  );
}
export async function readClip(
  client: SupabaseClient | null,
  lessonId: string,
  clipId: string,
) {
  const key = objectKey(lessonId, clipId);
  if (!client) return fs.readFile(filename(key));
  const { data, error } = await client.storage.from(bucket).download(key);
  if (error || !data)
    throw new Error(
      "Lesson audio could not load. Ask the workshop developer to check storage setup.",
    );
  return Buffer.from(await data.arrayBuffer());
}
async function storeClip(
  client: SupabaseClient | null,
  lessonId: string,
  clipId: string,
  bytes: Buffer,
) {
  const key = objectKey(lessonId, clipId);
  if (!client) {
    await fs.mkdir(path.dirname(filename(key)), {
      recursive: true,
      mode: 0o700,
    });
    const temporary = filename(key) + `.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
      // Linking a complete file publishes it atomically without replacing an existing clip.
      await fs.link(temporary, filename(key)).catch((e) => {
        if (e.code !== "EEXIST") throw e;
      });
    } finally {
      await fs.unlink(temporary).catch(() => {});
    }
    return;
  }
  const { error } = await client.storage
    .from(bucket)
    .upload(key, bytes, { contentType: "audio/mpeg", upsert: false });
  if (error && !(await client.storage.from(bucket).download(key)).data)
    throw new Error(
      "Lesson audio could not save. Run Initialize database in Developer setup to prepare private audio storage.",
    );
}

// A small resumable batch keeps requests bounded and saves each finished phrase.
export async function generateLessonAudio(
  client: SupabaseClient | null,
  lesson: Lesson,
) {
  const settings = await readSettings();
  if (settings.ttsProvider === "disabled" || !settings.ttsKey)
    throw new Error(
      "Lesson audio needs a voice provider and API key in Developer setup.",
    );
  const texts = lessonAudioTexts(lesson);
  if (texts.length > 200 || texts.some((text) => text.length > 700))
    throw new Error(
      "Lesson audio supports up to 200 phrases of 700 characters each. Split this material into smaller lessons.",
    );
  const keep = (lesson.audio || []).filter((clip) => texts.includes(clip.text));
  const pending = texts.filter(
    (text) =>
      !keep.some(
        (clip) =>
          clip.text === text && clip.id === clipIdentity(text, settings),
      ),
  );
  for (const text of pending.slice(0, 3)) {
    const id = clipIdentity(text, settings);
    objectKey(lesson.id, id);
    let bytes: Buffer | undefined;
    try {
      bytes = await readClip(client, lesson.id, id);
    } catch {
      /* Generate a missing clip. */
    }
    if (!bytes)
      await storeClip(client, lesson.id, id, await synthesize(text, settings));
    const clip: AudioClip = {
      id,
      text,
      provider: settings.ttsProvider as "azure" | "compatible",
      voice:
        settings.ttsProvider === "azure"
          ? settings.azureVoice
          : settings.ttsVoice,
      model:
        settings.ttsProvider === "azure" ? "azure-neural" : settings.ttsModel,
      createdAt: new Date().toISOString(),
    };
    const previous = keep.findIndex((c) => c.text === text);
    if (previous >= 0) keep[previous] = clip;
    else keep.push(clip);
    lesson = {
      ...lesson,
      audio: [...keep],
      status: "under_review",
      updatedAt: new Date().toISOString(),
    };
    await saveLesson(client, lesson);
  }
  return {
    lesson,
    total: texts.length,
    completed: texts.length - Math.max(0, pending.length - 3),
    remaining: Math.max(0, pending.length - 3),
  };
}
