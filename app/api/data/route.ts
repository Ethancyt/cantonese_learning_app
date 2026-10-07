import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { identity, guard, failure } from "@/lib/server/security";
import {
  readData,
  saveAttempt,
  saveCompletion,
  report,
  saveSource,
} from "@/lib/server/repository";
import { isCorrect, normalize } from "@/lib/schema";
import { progress, mastery } from "@/lib/progress";
import { publicLesson } from "@/lib/presentation";
import { demoMaterial } from "@/lib/seeds";
import { sourceFromText } from "@/lib/server/extraction";
export const runtime = "nodejs";
function visible(l: { availability: string; availableAt?: string }) {
  return (
    l.availability === "available" ||
    (!!l.availableAt && new Date(l.availableAt) <= new Date())
  );
}
export async function GET(req: NextRequest) {
  try {
    const user = await identity(req);
    const db = await readData(user.client, user.id);
    const attempts = db.attempts.filter((a) => a.studentId === user.id),
      completions = db.completions.filter((c) => c.studentId === user.id);
    const latest = new Map<string, (typeof db.lessons)[number]>();
    for (const l of db.versions.filter(
      (l) => l.status === "published" && visible(l),
    ))
      if (!latest.has(l.id) || latest.get(l.id)!.version < l.version)
        latest.set(l.id, l);
    let hostedAnalytics = null;
    if (user.client && user.role !== "student") {
      const result = await user.client.rpc("workshop_analytics");
      if (result.error) throw result.error;
      hostedAnalytics = result.data;
    }
    const published = [...latest.values()].filter(
      (l) => !db.lessons.some((d) => d.id === l.id && d.status === "archived"),
    );
    // Hosted query results have no implicit order; put the numbered course first.
    published.sort((a, b) =>
      a.createdBy === "system"
        ? b.createdBy === "system"
          ? (a.module?.unit || 0) - (b.module?.unit || 0)
          : -1
        : b.createdBy === "system"
          ? 1
          : 0,
    );
    return NextResponse.json({
      lessons: published.map(publicLesson),
      drafts:
        user.role === "student"
          ? []
          : db.lessons.filter(
              (l) => user.role === "admin" || l.createdBy === user.id,
            ),
      history:
        user.role === "student"
          ? []
          : db.versions.filter(
              (l) => user.role === "admin" || l.createdBy === user.id,
            ),
      sources:
        user.role === "student"
          ? []
          : db.sources.filter(
              (s) => user.role === "admin" || s.createdBy === user.id,
            ),
      attempts,
      completions,
      stats: progress(attempts, completions),
      mastery: mastery(attempts),
      role: user.role,
      mode: user.client ? "supabase" : "demo",
      analytics:
        user.role === "student"
          ? null
          : hostedAnalytics || {
              students: new Set(db.attempts.map((a) => a.studentId)).size,
              attempts: db.attempts.length,
              completion: db.attempts.length
                ? Math.round(
                    (new Set(
                      db.completions.map((c) => `${c.studentId}:${c.lessonId}`),
                    ).size /
                      Math.max(
                        1,
                        new Set(
                          db.attempts.map(
                            (a) => `${a.studentId}:${a.lessonId}`,
                          ),
                        ).size,
                      )) *
                      100,
                  )
                : 0,
              averageAttempts: db.attempts.length
                ? +(
                    db.attempts.length /
                    Math.max(
                      1,
                      new Set(
                        db.attempts.map(
                          (a) => `${a.studentId}:${a.exerciseId}`,
                        ),
                      ).size,
                    )
                  ).toFixed(1)
                : 0,
              difficult: mastery(db.attempts).slice(0, 3),
            },
    });
  } catch (e) {
    return failure(e);
  }
}
const actionSchema = z.object({
  action: z.enum(["role", "attempt", "complete", "report"]),
  role: z.enum(["student", "volunteer"]).optional(),
  lessonId: z.string().optional(),
  version: z.number().int().optional(),
  exerciseId: z.string().optional(),
  answer: z.string().max(2000).optional(),
  attemptId: z.string().uuid().optional(),
  reason: z.string().min(1).max(1000).optional(),
});
export async function POST(req: NextRequest) {
  try {
    const user = await identity(req);
    guard(req, user.id, 100);
    const b = actionSchema.parse(await req.json());
    if (b.action === "role") {
      if (user.client)
        throw new Error("Roles are managed by an administrator.");
      const jar = await cookies();
      jar.set("demo_role", b.role || "student", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      if (b.role === "volunteer") {
        const existing = await readData(null, user.id);
        if (
          !existing.sources.some(
            (s) =>
              s.createdBy === user.id &&
              s.filename === "Workshop Demo — 茶餐廳",
          )
        ) {
          await saveSource(
            null,
            sourceFromText("Workshop Demo — 茶餐廳", demoMaterial, user.id),
          );
        }
      }
      return NextResponse.json({ ok: true });
    }
    const db = await readData(user.client, user.id);
    const lesson = db.versions.find(
      (l) =>
        l.id === b.lessonId &&
        l.version === b.version &&
        l.status === "published" &&
        visible(l),
    );
    if (
      !lesson ||
      db.lessons.some((l) => l.id === lesson.id && l.status === "archived")
    )
      throw new Error("This lesson is unavailable.");
    if (b.action === "report") {
      await report(user.client, {
        id: crypto.randomUUID(),
        studentId: user.id,
        lessonId: lesson.id,
        reason: b.reason || "Please review this content.",
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "complete") {
      const answered = new Set(
        db.attempts
          .filter(
            (a) =>
              a.studentId === user.id &&
              a.lessonId === lesson.id &&
              a.version === lesson.version,
          )
          .map((a) => a.exerciseId),
      );
      if (lesson.exercises.some((e) => !answered.has(e.id)))
        throw new Error("Finish each activity before completing the journey.");
      await saveCompletion(user.client, {
        studentId: user.id,
        lessonId: lesson.id,
        version: lesson.version,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }
    const e = lesson.exercises.find((x) => x.id === b.exerciseId);
    if (!e) throw new Error("Unknown activity.");
    const answer = b.answer || "";
    let correct = isCorrect(e, answer);
    if (e.type === "match")
      correct = normalize(answer) === normalize(JSON.stringify(e.pairs));
    if (["flashcard", "speak", "ai_roleplay"].includes(e.type)) correct = false;
    const previous = db.attempts.filter(
      (a) =>
        a.studentId === user.id &&
        a.lessonId === lesson.id &&
        a.version === lesson.version &&
        a.exerciseId === e.id,
    );
    const attempt = await saveAttempt(user.client, {
      id: b.attemptId || crypto.randomUUID(),
      studentId: user.id,
      lessonId: lesson.id,
      version: lesson.version,
      exerciseId: e.id,
      answer,
      correct,
      tags: ["flashcard", "speak", "ai_roleplay"].includes(e.type)
        ? []
        : e.tags,
      timestamp: new Date().toISOString(),
      attemptCount: previous.length + 1,
    });
    return NextResponse.json({
      correct: attempt.correct,
      explanation: e.explanation,
    });
  } catch (e) {
    return failure(e);
  }
}
