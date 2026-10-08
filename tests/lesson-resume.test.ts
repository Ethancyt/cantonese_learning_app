import test from "node:test";
import assert from "node:assert/strict";
import { seedLessons } from "../lib/seeds";
import type { Attempt, Completion } from "../lib/schema";
import { lessonActivityProgress, lessonToContinue } from "../lib/lesson-resume";

function attempt(
  lessonIndex: number,
  exerciseIndex = 0,
  timestamp = "2026-10-08T01:00:00Z",
): Attempt {
  const lesson = seedLessons[lessonIndex];
  return {
    id: `attempt-${lessonIndex}-${exerciseIndex}`,
    studentId: "learner",
    lessonId: lesson.id,
    version: lesson.version,
    exerciseId: lesson.exercises[exerciseIndex].id,
    answer: "reviewed",
    correct: true,
    tags: [],
    attemptCount: 1,
    timestamp,
  };
}

test("continue selects the most recently practised unfinished lesson", () => {
  const attempts = [attempt(0), attempt(2, 0, "2026-10-08T02:00:00Z")];
  assert.equal(
    lessonToContinue(seedLessons, attempts, [])?.id,
    seedLessons[2].id,
  );
  const completions: Completion[] = [
    {
      studentId: "learner",
      lessonId: seedLessons[2].id,
      version: seedLessons[2].version,
      timestamp: "2026-10-08T03:00:00Z",
    },
  ];
  assert.equal(
    lessonToContinue(seedLessons, attempts, completions)?.id,
    seedLessons[0].id,
  );
});

test("continue ignores attempts from an older revision and removed activities", () => {
  const stale = { ...attempt(2), version: seedLessons[2].version - 1 };
  const removed = { ...attempt(1), exerciseId: "removed-exercise" };
  assert.equal(
    lessonToContinue(seedLessons, [stale, removed], [])?.id,
    seedLessons[0].id,
  );
});

test("progress counts distinct current activities and resumes the first unpractised activity", () => {
  const first = attempt(0);
  const second = attempt(0, 1);
  const attempts = [
    first,
    first,
    second,
    { ...first, exerciseId: "removed" },
    { ...first, version: 0 },
  ];
  const progress = lessonActivityProgress(seedLessons[0], attempts);
  assert.equal(progress.explored, 2);
  assert.equal(progress.nextIndex, 2);
  assert.equal(
    progress.percent,
    Math.round(200 / seedLessons[0].exercises.length),
  );
  const finished = lessonActivityProgress(
    seedLessons[0],
    seedLessons[0].exercises.map((_, i) => attempt(0, i)),
  );
  assert.equal(finished.percent, 100);
  assert.equal(finished.nextIndex, -1);
});

test("continue handles fresh learners, empty libraries, and all lessons completed", () => {
  assert.equal(lessonToContinue(seedLessons, [], [])?.id, seedLessons[0].id);
  assert.equal(lessonToContinue([], [], []), null);
  const completions = seedLessons.map((lesson) => ({
    studentId: "learner",
    lessonId: lesson.id,
    version: lesson.version,
    timestamp: "2026-10-08T03:00:00Z",
  }));
  assert.equal(lessonToContinue(seedLessons, [], completions), null);
});
