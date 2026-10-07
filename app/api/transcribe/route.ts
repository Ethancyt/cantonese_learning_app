import { NextRequest, NextResponse } from "next/server";
import { identity, guard, failure } from "@/lib/server/security";
import { readData } from "@/lib/server/repository";
import { speakingFeedback } from "@/lib/ai/feedback";
export async function POST(req: NextRequest) {
  try {
    const user = await identity(req);
    guard(req, user.id, 8);
    if (!process.env.SPEECH_API_KEY)
      return NextResponse.json({
        available: false,
        message:
          "Transcription is not connected. Listen to your recording and practise again; no automatic score is given.",
      });
    if (Number(req.headers.get("content-length") || 0) > 6 * 1024 * 1024)
      throw new Error("Recording is too large.");
    const form = await req.formData();
    const db = await readData(user.client, user.id);
    const lesson = db.versions.find(
      (l) =>
        l.id === form.get("lessonId") &&
        String(l.version) === form.get("version") &&
        l.status === "published",
    );
    if (
      lesson &&
      (db.lessons.some((l) => l.id === lesson.id && l.status === "archived") ||
        (lesson.availability === "scheduled" &&
          (!lesson.availableAt || new Date(lesson.availableAt) > new Date())))
    )
      throw new Error("This lesson is unavailable.");
    const e = lesson?.exercises.find(
      (e) => e.id === form.get("exerciseId") && e.type === "speak",
    );
    const file = form.get("audio");
    if (
      !e ||
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !/^audio\/(webm|mp4|ogg|wav)/.test(file.type)
    )
      throw new Error("Invalid recording.");
    const upload = new FormData();
    upload.set("file", file);
    upload.set("model", process.env.SPEECH_MODEL || "whisper-1");
    upload.set("language", "zh");
    const response = await fetch(
      process.env.SPEECH_API_URL ||
        "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.SPEECH_API_KEY}` },
        body: upload,
        signal: AbortSignal.timeout(60000),
      },
    );
    if (!response.ok) throw new Error("Transcription provider failed.");
    const result = await response.json();
    return NextResponse.json({
      available: true,
      ...speakingFeedback(e.answer, ztext(result.text)),
    });
  } catch (e) {
    return failure(e);
  }
}
function ztext(t: unknown) {
  if (typeof t !== "string") throw new Error("Invalid transcription response.");
  return t.slice(0, 2000);
}
