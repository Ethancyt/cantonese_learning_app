import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { identity, guard, failure } from "@/lib/server/security";
import { readData } from "@/lib/server/repository";
import { roleplay } from "@/lib/ai/roleplay";
export async function POST(req: NextRequest) {
  try {
    const user = await identity(req);
    guard(req, user.id, 12);
    const b = z
      .object({
        lessonId: z.string(),
        version: z.number(),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(300),
            }),
          )
          .max(10),
      })
      .parse(await req.json());
    const db = await readData(user.client, user.id);
    const lesson = db.versions.find(
      (l) =>
        l.id === b.lessonId &&
        l.version === b.version &&
        l.status === "published",
    );
    if (
      !lesson ||
      db.lessons.some((l) => l.id === lesson.id && l.status === "archived") ||
      (lesson.availability === "scheduled" &&
        (!lesson.availableAt || new Date(lesson.availableAt) > new Date()))
    )
      throw new Error("This lesson is unavailable.");
    return NextResponse.json(await roleplay(lesson, b.messages));
  } catch (e) {
    return failure(e);
  }
}
