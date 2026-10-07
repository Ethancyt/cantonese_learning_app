import test from "node:test";
import assert from "node:assert/strict";
import { seedLessons, legacySeedLessons } from "../lib/seeds";
import { lessonSchema } from "../lib/schema";
import { upgradeCurriculum, Database } from "../lib/server/store";
import { reconcileSections } from "../lib/content/structure";
import { lessonAudioTexts } from "../lib/lesson-audio";
import { lessonCompleted } from "../lib/lesson-completion";
import { practicePhrases } from "../lib/content/practice-phrases";

test("numbered course covers the four EduHK units with complete vocabulary, contextual examples, and speaking targets", () => {
  const requiredTerms = [
    ["字典", "聲調", "詩", "史", "試", "時", "市", "事", "學生"],
    [
      "午安",
      "女士",
      "呢個",
      "香港",
      "英國",
      "美國",
      "圖書館",
      "我哋",
      "近排",
      "你呢",
    ],
    [
      "職業",
      "教書",
      "上網",
      "踢波",
      "卡拉OK",
      "結咗婚",
      "家姐",
      "細佬",
      "一齊",
      "鍾唔鍾意",
    ],
    [
      "唔該借借",
      "麻煩晒",
      "一路平安",
      "早唞",
      "搞錯",
      "講多次",
      "救命",
      "肚餓",
      "可唔可以",
    ],
  ];
  seedLessons.forEach((lesson, index) => {
    assert.match(lesson.title, new RegExp(`^Lesson ${index + 1} ·`));
    assert.equal(lesson.module!.unit, index + 1);
    assert.equal(
      lesson.module!.reference!.url,
      `https://www.eduhk.hk/cle/resources/cep/cantonese-survival-package/unit${index + 1}.html`,
    );
    assert.ok(lesson.vocabulary.length >= 30);
    assert.ok(lesson.exercises.length >= 25);
    const answerPositions = new Set(
      lesson.exercises
        .filter((exercise) => exercise.options.includes(exercise.answer))
        .map((exercise) => exercise.options.indexOf(exercise.answer)),
    );
    assert.ok(answerPositions.size > 1, "choice answers vary in position");
    assert.ok(
      lesson.module!.sections.every(
        (section) =>
          section.teachingPoints.length >= 3 && section.examples.length >= 2,
      ),
    );
    for (const term of requiredTerms[index])
      assert.ok(
        lesson.vocabulary.some((word) => word.traditional === term),
        term,
      );
    const linked = new Set(
      lesson.module!.sections.flatMap((section) => section.vocabularyIds),
    );
    for (const word of lesson.vocabulary) {
      assert.ok(
        linked.has(word.id),
        `${word.traditional} must appear in a lesson section`,
      );
      assert.match(word.jyutping, /^[a-z]+[1-6](?: [a-z]+[1-6])*$/);
    }
    const audio = lessonAudioTexts(lesson);
    assert.ok(
      audio.length <= 200,
      "a whole lesson fits the saved-audio workflow",
    );
    for (const exercise of lesson.exercises.filter(
      (exercise) => exercise.type === "speak",
    ))
      assert.ok(audio.includes(exercise.answer));
    assert.ok(
      practicePhrases(lesson).every((phrase) => phrase.traditional.length > 2),
    );
  });
});

test("version 2 progress, audio snapshots, and uploaded content survive the numbered curriculum upgrade", () => {
  const old = structuredClone(seedLessons[0]);
  old.version = 2;
  old.title = "Previous workshop journey";
  old.audio = [
    {
      id: "a".repeat(64),
      text: "你好",
      provider: "azure",
      voice: "zh-HK-HiuMaanNeural",
      model: "azure-neural",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];
  const workshop = {
    ...structuredClone(seedLessons[1]),
    id: "owned-workshop",
    createdBy: "volunteer",
    title: "Uploaded class",
  };
  const completion = {
    studentId: "student",
    lessonId: old.id,
    version: 2,
    timestamp: "2026-01-01T00:00:00Z",
  };
  const db: Database = {
    lessons: [old, workshop],
    versions: [structuredClone(old), structuredClone(workshop)],
    attempts: [],
    completions: [completion],
    sources: [],
    reports: [],
    generations: [],
  };
  const previous = structuredClone(old);
  upgradeCurriculum(db);
  upgradeCurriculum(db);
  assert.deepEqual(
    db.versions.find((lesson) => lesson.id === old.id && lesson.version === 2),
    previous,
  );
  assert.deepEqual(
    db.lessons.find((lesson) => lesson.id === workshop.id),
    workshop,
  );
  assert.deepEqual(db.completions, [completion]);
  const current = db.lessons.find((lesson) => lesson.id === old.id)!;
  assert.equal(current.version, 3);
  assert.equal(lessonCompleted(current, db.completions), false);
  assert.equal(lessonCompleted(previous, db.completions), true);
  assert.equal(
    lessonCompleted(current, [
      ...db.completions,
      { ...completion, version: 3 },
    ]),
    true,
  );
  assert.equal(
    db.versions.filter((lesson) => lesson.id === old.id && lesson.version === 3)
      .length,
    1,
  );
});
test("module sections cover activities once and reject dangling links", () => {
  for (const lesson of seedLessons) {
    assert.ok(lesson.module!.sections.length >= 6);
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
  assert.equal(db.lessons[0].version, seedLessons[0].version);
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
