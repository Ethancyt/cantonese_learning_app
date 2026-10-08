import { NextRequest, NextResponse } from "next/server";
import { identity, failure, guard } from "@/lib/server/security";
import { readData } from "@/lib/server/repository";
import { readClip } from "@/lib/server/lesson-audio";
import { lessonAudioTexts } from "@/lib/lesson-audio";
import { readSettings } from "@/lib/server/settings";
import { listeningAudio } from "@/lib/server/listening-audio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const user = await identity(req);
    const db = await readData(user.client, user.id);
    const id = req.nextUrl.searchParams.get("lessonId"),
      version = Number(req.nextUrl.searchParams.get("version")),
      clipId = req.nextUrl.searchParams.get("clipId");
    const staff = (l: (typeof db.lessons)[number]) =>
      user.role !== "student" &&
      (l.createdBy === user.id || user.role === "admin");
    const lesson = [...db.lessons.filter(staff), ...db.versions].find(
      (l) =>
        l.id === id &&
        l.version === version &&
        l.audio?.some((c) => c.id === clipId) &&
        (staff(l) ||
          (l.status === "published" &&
            (l.availability === "available" ||
              (!!l.availableAt && new Date(l.availableAt) <= new Date())) &&
            !db.lessons.some((d) => d.id === id && d.status === "archived"))),
    );
    if (!lesson || !clipId) throw new Error("This lesson is unavailable.");
    const bytes = await readClip(user.client, lesson.id, clipId);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await identity(req);
    guard(req, user.id, 40);
    if (Number(req.headers.get("content-length") || 0) > 5000)
      throw new Error("Lesson audio request is too large.");
    const raw = await req.text();
    if (raw.length > 5000)
      throw new Error("Lesson audio request is too large.");
    const body = JSON.parse(raw);
    if (
      typeof body.text !== "string" ||
      !body.text.trim() ||
      body.text.length > 700
    )
      throw new Error("Lesson audio phrases must contain 1–700 characters.");
    const text = body.text.trim();
    const db = await readData(user.client, user.id);
    const staff = (lesson: (typeof db.lessons)[number]) =>
      ["volunteer", "admin"].includes(user.role) &&
      (lesson.createdBy === user.id || user.role === "admin");
    const lesson = [...db.lessons.filter(staff), ...db.versions].find(
      (lesson) =>
        lesson.id === body.lessonId &&
        lesson.version === Number(body.version) &&
        (staff(lesson) ||
          (lesson.status === "published" &&
            (lesson.availability === "available" ||
              (!!lesson.availableAt &&
                new Date(lesson.availableAt) <= new Date())) &&
            !db.lessons.some(
              (current) =>
                current.id === lesson.id && current.status === "archived",
            ))),
    );
    if (!lesson || !lessonAudioTexts(lesson).includes(text))
      throw new Error("This lesson is unavailable.");
    const settings = await readSettings();
    if (!settings.ttsKey || settings.ttsProvider === "disabled")
      return NextResponse.json(
        { available: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    const bytes = await listeningAudio(text, settings);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
