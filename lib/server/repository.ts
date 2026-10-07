import { SupabaseClient } from "@supabase/supabase-js";
import { snapshot, transact, Database } from "./store";
import { Lesson, Source, Attempt, Completion } from "../schema";
type Client = SupabaseClient | null;
export async function readData(
  client: Client,
  studentId: string,
): Promise<Database> {
  if (!client) return snapshot();
  const results = await Promise.all([
    client.from("lessons").select("payload"),
    client.from("published_versions").select("payload"),
    client.from("source_materials").select("payload"),
    client
      .from("student_attempts")
      .select("payload")
      .eq("student_id", studentId),
    client
      .from("lesson_completions")
      .select("payload")
      .eq("student_id", studentId),
  ]);
  for (const r of results) if (r.error) throw r.error;
  return {
    lessons: results[0].data!.map((x) => x.payload),
    versions: results[1].data!.map((x) => x.payload),
    sources: results[2].data!.map((x) => x.payload),
    attempts: results[3].data!.map((x) => x.payload),
    completions: results[4].data!.map((x) => x.payload),
    reports: [],
    generations: [],
  };
}
export async function saveSource(client: Client, source: Source) {
  if (!client)
    return transact((db) => {
      db.sources.push(source);
    });
  const { error } = await client.from("source_materials").insert({
    id: source.id,
    created_by: source.createdBy,
    filename: source.filename,
    payload: source,
  });
  if (error) throw error;
}
export async function saveLesson(client: Client, lesson: Lesson) {
  if (!client)
    return transact((db) => {
      const index = db.lessons.findIndex((l) => l.id === lesson.id);
      if (index < 0) db.lessons.push(lesson);
      else db.lessons[index] = lesson;
    });
  const { error } = await client.from("lessons").upsert({
    id: lesson.id,
    created_by: lesson.createdBy,
    status: lesson.status,
    version: lesson.version,
    payload: lesson,
  });
  if (error) throw error;
}
export async function publishLesson(client: Client, lesson: Lesson) {
  if (!client)
    return transact((db) => {
      const stored = db.lessons.find((l) => l.id === lesson.id);
      if (!stored || stored.status !== "approved")
        throw new Error("Approve this draft before publishing.");
      const published = {
        ...stored,
        status: "published" as const,
        updatedAt: new Date().toISOString(),
      };
      db.versions.push(structuredClone(published));
      db.lessons[db.lessons.findIndex((l) => l.id === lesson.id)] = published;
      return published;
    });
  const { data, error } = await client.rpc("publish_lesson", {
    lesson_id: lesson.id,
  });
  if (error) throw error;
  return data as Lesson;
}
export async function saveAttempt(client: Client, attempt: Attempt) {
  if (!client)
    return transact((db) => {
      if (!db.attempts.some((a) => a.id === attempt.id)) {
        attempt.attemptCount =
          db.attempts.filter(
            (a) =>
              a.studentId === attempt.studentId &&
              a.exerciseId === attempt.exerciseId &&
              a.lessonId === attempt.lessonId &&
              a.version === attempt.version,
          ).length + 1;
        db.attempts.push(attempt);
      }
      return attempt;
    });
  const { error } = await client.from("student_attempts").insert({
    id: attempt.id,
    student_id: attempt.studentId,
    lesson_id: attempt.lessonId,
    version: attempt.version,
    exercise_id: attempt.exerciseId,
    correct: attempt.correct,
    payload: attempt,
  });
  if (error) throw error;
  return attempt;
}
export async function saveCompletion(client: Client, c: Completion) {
  if (!client)
    return transact((db) => {
      if (
        !db.completions.some(
          (x) =>
            x.studentId === c.studentId &&
            x.lessonId === c.lessonId &&
            x.version === c.version,
        )
      )
        db.completions.push(c);
    });
  const { error } = await client.from("lesson_completions").upsert(
    {
      student_id: c.studentId,
      lesson_id: c.lessonId,
      version: c.version,
      payload: c,
    },
    { onConflict: "student_id,lesson_id,version", ignoreDuplicates: true },
  );
  if (error) throw error;
}
export async function report(
  client: Client,
  data: Database["reports"][number],
) {
  if (!client)
    return transact((db) => {
      db.reports.push(data);
    });
  const { error } = await client.from("content_reports").insert({
    id: data.id,
    student_id: data.studentId,
    lesson_id: data.lessonId,
    reason: data.reason,
  });
  if (error) throw error;
}

export async function saveGeneration(
  client: Client,
  item: { sourceId: string; lessonId: string; mode: string; createdBy: string },
) {
  if (!client)
    return transact((db) => {
      db.generations.push({
        id: crypto.randomUUID(),
        sourceId: item.sourceId,
        lessonId: item.lessonId,
        mode: item.mode,
        timestamp: new Date().toISOString(),
      });
    });
  const { error } = await client.from("ai_generations").insert({
    created_by: item.createdBy,
    source_material_id: item.sourceId,
    lesson_id: item.lessonId,
    provider_mode: item.mode,
  });
  if (error) throw error;
}
