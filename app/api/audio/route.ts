import { NextRequest, NextResponse } from "next/server";
import { identity, failure } from "@/lib/server/security";
import { readData } from "@/lib/server/repository";
import { readClip } from "@/lib/server/lesson-audio";
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
