import { assessSpeaking } from "@/lib/server/speech";
import { readSettings } from "@/lib/server/settings";
import { NextRequest, NextResponse } from "next/server";
import { identity, guard, failure } from "@/lib/server/security";
import { readData } from "@/lib/server/repository";
import { speakingTarget } from "@/lib/speaking-target";
export async function POST(req: NextRequest) {
  try {
    const user = await identity(req);
    guard(req, user.id, 8);
    const settings = await readSettings();
    if (!settings.speechKey)
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
    const target = lesson
      ? speakingTarget(
          lesson,
          String(form.get("exerciseId") || ""),
          String(form.get("vocabularyId") || ""),
        )
      : null;
    const file = form.get("audio");
    if (
      !target ||
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !/^audio\/(webm|mp4|ogg|wav)/.test(file.type)
    )
      throw new Error("Invalid recording.");
    const feedback = await assessSpeaking(file, settings, target);
    return NextResponse.json({
      available: true,
      ...feedback,
    });
  } catch (e) {
    return failure(e);
  }
}
