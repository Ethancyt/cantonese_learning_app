import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyze, generate, grounded } from "@/lib/ai/lesson-generator";
import { analysisSchema, lessonSchema } from "@/lib/schema";
import { extract, sourceFromText } from "@/lib/server/extraction";
import {
  identity,
  requireVolunteer,
  guard,
  failure,
} from "@/lib/server/security";
import {
  readData,
  saveSource,
  saveLesson,
  publishLesson,
  saveGeneration,
} from "@/lib/server/repository";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(req: NextRequest) {
  try {
    const user = await identity(req);
    requireVolunteer(user);
    guard(req, user.id, 15);
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      if (Number(req.headers.get("content-length") || 0) > 6 * 1024 * 1024)
        throw new Error("File is too large.");
      const form = await req.formData();
      const file = form.get("file");
      const source =
        file instanceof File
          ? await extract(file, user.id)
          : sourceFromText(
              String(form.get("filename") || "Pasted workshop"),
              String(form.get("text") || ""),
              user.id,
            );
      await saveSource(user.client, source);
      const result = await analyze(source);
      return NextResponse.json({ source, ...result });
    }
    const b = await req.json();
    const db = await readData(user.client, user.id);
    if (b.action === "analyze") {
      const source = db.sources.find(
        (s) =>
          s.id === b.sourceId &&
          (s.createdBy === user.id || user.role === "admin"),
      );
      if (!source) throw new Error("Source not found.");
      return NextResponse.json({ source, ...(await analyze(source)) });
    }
    if (b.action === "generate") {
      const settings = z
        .object({
          types: z
            .array(
              z.enum([
                "flashcard",
                "multiple_choice",
                "match",
                "listen_choose",
                "sentence_order",
                "fill_blank",
                "speak",
                "conversation_choice",
                "scenario",
                "ai_roleplay",
              ]),
            )
            .min(1),
          level: z.enum(["beginner", "intermediate", "advanced"]),
          minutes: z.number().int().min(5).max(15),
          age: z.enum(["Children", "Teenagers", "Adults"]),
          references: z.boolean(),
        })
        .parse(b.settings);
      const source = db.sources.find(
        (s) =>
          s.id === b.sourceId &&
          (s.createdBy === user.id || user.role === "admin"),
      );
      if (!source) throw new Error("Source not found.");
      const analysis = grounded(analysisSchema.parse(b.analysis), source);
      const result = await generate(
        source,
        analysis,
        settings,
        db.versions.filter((l) => l.status === "published"),
      );
      await saveLesson(user.client, result.lesson);
      await saveGeneration(user.client, {
        sourceId: source.id,
        lessonId: result.lesson.id,
        mode: result.mode,
        createdBy: user.id,
      });
      return NextResponse.json(result);
    }
    const existing = db.lessons.find(
      (l) => l.id === b.lesson?.id || l.id === b.lessonId,
    );
    if (!existing || (existing.createdBy !== user.id && user.role !== "admin"))
      throw new Error("Draft not found.");
    if (b.action === "revise") {
      if (existing.status !== "published")
        throw new Error("Only published lessons need a new version.");
      const draft = {
        ...existing,
        status: "under_review" as const,
        version: existing.version + 1,
        updatedAt: new Date().toISOString(),
      };
      await saveLesson(user.client, draft);
      return NextResponse.json({ lesson: draft });
    }
    if (b.action === "archive") {
      if (
        user.role !== "admin" &&
        !(!user.client && existing.createdBy === user.id)
      )
        throw new Error("Admin access required.");
      const archived = {
        ...existing,
        status: "archived" as const,
        updatedAt: new Date().toISOString(),
      };
      await saveLesson(user.client, archived);
      return NextResponse.json({ lesson: archived });
    }
    if (b.action === "save" || b.action === "approve") {
      if (["published", "archived"].includes(existing.status))
        throw new Error("Create a new draft before editing published content.");
      const lesson = lessonSchema.parse({
        ...b.lesson,
        id: existing.id,
        version: existing.version,
        createdBy: existing.createdBy,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
        status: b.action === "approve" ? "approved" : "under_review",
      });
      await saveLesson(user.client, lesson);
      return NextResponse.json({ lesson });
    }
    if (b.action === "publish") {
      if (existing.status !== "approved")
        throw new Error("Approve the draft before publishing.");
      return NextResponse.json({
        lesson: await publishLesson(user.client, existing),
      });
    }
    throw new Error("Unknown studio action.");
  } catch (e) {
    return failure(e);
  }
}
