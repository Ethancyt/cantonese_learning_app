import test from "node:test";
import assert from "node:assert/strict";
import { seedLessons, legacySeedLessons } from "../lib/seeds";
import { lessonSchema } from "../lib/schema";
import { upgradeCurriculum, Database } from "../lib/server/store";
import { reconcileSections } from "../lib/content/structure";
test("module sections cover activities once and reject dangling links", () => {
  for (const lesson of seedLessons) {
    assert.equal(lesson.module!.sections.length, 4);
    assert.deepEqual(
      lesson.module!.sections.flatMap((s) => s.exerciseIds),
      lesson.exercises.map((e) => e.id),
    );
    const invalid = structuredClone(lesson);
    invalid.module!.sections[0].vocabularyIds.push("missing");
    assert.equal(lessonSchema.safeParse(invalid).success, false);
  }
});
test("curriculum upgrade preserves old snapshots, attempts and workshop edits", () => {
  const db: Database = {
    lessons: structuredClone(legacySeedLessons),
    versions: structuredClone(legacySeedLessons),
    sources: [],
    attempts: [
      {
        id: "attempt",
        studentId: "student",
        lessonId: "start",
        version: 1,
        exerciseId: legacySeedLessons[0].exercises[0].id,
        answer: "reviewed",
        correct: false,
        tags: [],
        timestamp: "2026-01-01",
        attemptCount: 1,
      },
    ],
    completions: [],
    reports: [],
    generations: [],
  };
  const original = structuredClone(db);
  db.lessons[3].status = "under_review";
  upgradeCurriculum(db);
  upgradeCurriculum(db);
  assert.equal(db.lessons[0].version, 2);
  assert.equal(db.lessons[3].version, 1);
  assert.deepEqual(
    db.versions.filter((l) => l.version === 1),
    original.versions,
  );
  assert.deepEqual(db.attempts, original.attempts);
  assert.equal(db.versions.length, 7);
});
test("reviewer edits retain complete section membership", () => {
  const lesson = structuredClone(seedLessons[0]);
  lesson.exercises.splice(0, 1);
  lesson.exercises.push({ ...lesson.exercises[0], id: "added" });
  const edited = reconcileSections(lesson);
  assert.ok(lessonSchema.safeParse(edited).success);
  assert.equal(edited.module!.sections.at(-1)!.exerciseIds.at(-1), "added");
});
