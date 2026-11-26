import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { seedLessons, legacySeedLessons } from "../lib/seeds";
import { curriculumModules } from "../lib/content/modules";
import { lessonSchema, type Source } from "../lib/schema";
import { upgradeCurriculum, type Database } from "../lib/server/store";
import { reconcileSections } from "../lib/content/structure";
import { lessonAudioTexts } from "../lib/lesson-audio";
import { speakingTarget } from "../lib/speaking-target";
import { lessonCompleted } from "../lib/lesson-completion";
import { progress } from "../lib/progress";
import { demoMaterial } from "./helpers/studio-material";

const [workshop, workshopTwo] = seedLessons;

test("Workshop 1 covers the source topics with Yale readings and working learner references", async () => {
  assert.match(workshop.workshop, /13 November 2026/);
  const module = workshop.module!;
  assert.equal(module.romanisation, "yale");
  assert.deepEqual(
    module.sections.map((s) => s.title),
    [
      "Greetings",
      "Pronunciation and tones",
      "Names and surnames",
      "Countries and origins",
      "Hong Kong places and MTR stations",
      "Where you live",
      "Introduce yourself",
      "Workshop review",
    ],
  );
  assert.deepEqual(
    module.sections.flatMap((s) => s.exerciseIds),
    workshop.exercises.map((e) => e.id),
  );
  assert.deepEqual(
    new Set(module.sections.flatMap((s) => s.vocabularyIds)),
    new Set(workshop.vocabulary.map((w) => w.id)),
  );
  const wordByText = new Map(
    workshop.vocabulary.map((word) => [word.traditional, word.jyutping]),
  );
  assert.equal(wordByText.get("你好"), "Néih hóu");
  assert.equal(wordByText.get("你住喺邊度呀？"), "Néih jyuh hái bīn douh a?");
  assert.deepEqual(
    ["詩", "史", "試", "時", "市", "事"].map((word) => wordByText.get(word)),
    ["sī", "sí", "si", "sìh", "síh", "sih"],
  );
  for (const section of module.sections)
    for (const line of section.dialogue)
      assert.match(line.speaker, /\(fictional\)/);
  assert.equal(module.references!.length, 2);
  for (const { url } of module.references!)
    assert.match(await readFile(`public${url}`, "utf8"), /13 November 2026/);
  const audio = lessonAudioTexts(workshop);
  assert.ok(audio.length <= 200);
  assert.ok(audio.includes("市") && audio.includes("我住喺沙田。"));
});

test("Workshop 2 includes source examples, a study reference and all learner exercise formats", async () => {
  assert.equal(workshopTwo.id, "workshop-2026-11-20");
  assert.equal(workshopTwo.module?.unit, 2);
  assert.equal(workshopTwo.module?.romanisation, "yale");
  assert.deepEqual(
    new Set(workshopTwo.exercises.map((exercise) => exercise.type)),
    new Set([
      "flashcard",
      "match",
      "multiple_choice",
      "listen_choose",
      "sentence_order",
      "fill_blank",
      "speak",
      "conversation_choice",
    ]),
  );
  const audio = lessonAudioTexts(workshopTwo);
  assert.ok(audio.length <= 200);
  for (const text of [
    "一億零一百零三萬四千五百零二",
    "九二八六",
    "三千二百蚊",
    "一杯凍奶茶，少甜少冰。",
  ])
    assert.ok(audio.includes(text), text);
  const reference = await readFile(
    `public${workshopTwo.module!.references![0].url}`,
    "utf8",
  );
  assert.match(reference, /20 November 2026/);
  assert.match(reference, /Workshop practice menu/);
});

test("personal speaking practice accepts learner-chosen details without a fixed audio or grading target", () => {
  const personal = workshop.exercises.filter((e) => e.personalPractice);
  assert.deepEqual(
    personal.map((e) => e.personalPractice!.length),
    [1, 3],
  );
  for (const exercise of personal) {
    assert.equal(exercise.answer, "");
    assert.equal(speakingTarget(workshop, exercise.id), null);
    assert.equal(lessonAudioTexts(workshop).includes(exercise.prompt), false);
    assert.doesNotMatch(
      JSON.stringify(exercise.personalPractice),
      /Amina|Daniel/,
    );
  }
  const invalid = structuredClone(workshop);
  invalid.module!.references![0].url = "javascript:alert(1)";
  assert.equal(lessonSchema.safeParse(invalid).success, false);
});

test("curriculum retirement preserves old snapshots, attempts, XP, submissions and staff content", () => {
  const legacySource: Source = {
    id: "original-cafe",
    filename: "Workshop Demo — 茶餐廳",
    text: demoMaterial,
    chunks: [],
    createdBy: "volunteer",
    createdAt: workshop.createdAt,
  };
  const staffLesson = {
    ...structuredClone(workshop),
    id: "staff-workshop",
    createdBy: "volunteer",
    sourceMaterialId: "staff-source",
  };
  const cafe = {
    ...staffLesson,
    id: "old-cafe",
    sourceMaterialId: legacySource.id,
  };
  const old = curriculumModules[0];
  const db: Database = {
    lessons: structuredClone([...curriculumModules, staffLesson, cafe]),
    versions: structuredClone([
      ...legacySeedLessons,
      ...curriculumModules,
      staffLesson,
      cafe,
    ]),
    sources: [
      legacySource,
      {
        ...legacySource,
        id: "staff-source",
        text: "An original staff workshop.",
      },
    ],
    attempts: [
      {
        id: "attempt",
        studentId: "student",
        lessonId: old.id,
        version: old.version,
        exerciseId: old.exercises[0].id,
        answer: "reviewed",
        correct: true,
        tags: [],
        timestamp: workshop.createdAt,
        attemptCount: 1,
      },
    ],
    completions: [
      {
        studentId: "student",
        lessonId: old.id,
        version: old.version,
        timestamp: workshop.createdAt,
      },
    ],
    reports: [],
    generations: [],
  };
  const original = structuredClone(db);
  upgradeCurriculum(db);
  upgradeCurriculum(db);
  assert.deepEqual(
    db.lessons.filter((l) => l.status === "published").map((l) => l.id),
    [staffLesson.id, workshop.id, workshopTwo.id],
  );
  assert.deepEqual(db.versions, [...original.versions, workshop, workshopTwo]);
  assert.deepEqual(db.sources, original.sources);
  assert.deepEqual(db.attempts, original.attempts);
  assert.deepEqual(db.completions, original.completions);
  assert.equal(
    progress(db.attempts, db.completions).xp,
    progress(original.attempts, original.completions).xp,
  );
  assert.equal(lessonCompleted(workshop, db.completions), false);
  assert.equal(lessonCompleted(old, db.completions), true);
});

test("module sections reject dangling links and reviewer edits keep activities in order", () => {
  const invalid = structuredClone(workshop);
  invalid.module!.sections[0].vocabularyIds.push("missing");
  assert.equal(lessonSchema.safeParse(invalid).success, false);
  const edited = structuredClone(workshop);
  edited.exercises.splice(0, 1);
  edited.exercises.push({ ...edited.exercises[0], id: "added" });
  const reconciled = reconcileSections(edited);
  assert.ok(lessonSchema.safeParse(reconciled).success);
  assert.equal(reconciled.module!.sections.at(-1)!.exerciseIds.at(-1), "added");
});
