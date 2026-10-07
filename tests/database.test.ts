import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { curriculumSQL } from "../scripts/seed-supabase";
import { seedLessons, legacySeedLessons } from "../lib/seeds";
test("PostgreSQL migration, ownership policies, approval, immutable versions and answer integrity", async (t) => {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(
    `create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,name text,bucket_id text);alter table storage.objects enable row level security;create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;`,
  );
  const sql = await readFile("supabase/schema.sql", "utf8");
  await pg.exec(
    sql.replace(
      "create extension if not exists pgcrypto;",
      "-- gen_random_uuid is built into this PostgreSQL runtime.",
    ),
  );
  const legacy = legacySeedLessons[0];
  await pg.query(
    "insert into lessons(id,created_by,status,version,payload) values($1,null,'published',1,$2)",
    [legacy.id, JSON.stringify(legacy)],
  );
  await pg.query(
    "insert into published_versions(lesson_id,version,payload) values($1,1,$2)",
    [legacy.id, JSON.stringify(legacy)],
  );
  const modulesSQL = await readFile(
    "supabase/migrations/002_learning_modules.sql",
    "utf8",
  );
  await pg.exec(modulesSQL);
  await pg.exec(curriculumSQL());
  await pg.exec(modulesSQL);
  await pg.exec(curriculumSQL());
  assert.equal(
    (await pg.query("select * from learning_modules")).rows.length,
    4,
  );
  assert.equal(
    (await pg.query("select * from module_sections")).rows.length,
    seedLessons.reduce(
      (count, lesson) => count + lesson.module!.sections.length,
      0,
    ),
  );
  assert.equal(
    (await pg.query("select * from published_versions")).rows.length,
    5,
  );
  assert.deepEqual(
    (
      await pg.query<{ payload: unknown }>(
        "select payload from published_versions where lesson_id='start' and version=1",
      )
    ).rows[0].payload,
    legacy,
  );
  const invalid = structuredClone(seedLessons[0]);
  invalid.module!.sections[0].exerciseIds.reverse();
  await assert.rejects(
    () =>
      pg.query("update lessons set payload=$1 where id='start'", [
        JSON.stringify(invalid),
      ]),
    /every activity in order/,
  );
  await pg.exec(
    "grant usage on schema public,auth,storage to authenticated;grant select,insert,update,delete on all tables in schema public to authenticated;",
  );
  const volunteer = "11111111-1111-4111-8111-111111111111",
    student = "22222222-2222-4222-8222-222222222222";
  await pg.query("insert into auth.users values($1),($2)", [
    volunteer,
    student,
  ]);
  await pg.query("update profiles set role='volunteer' where id=$1", [
    volunteer,
  ]);
  const lesson = structuredClone(seedLessons[1]);
  lesson.id = "db-test";
  lesson.version = 1;
  lesson.createdBy = volunteer;
  lesson.status = "ai_generated";
  for (const v of lesson.vocabulary) v.id = "db-" + v.id;
  for (const e of lesson.exercises) e.id = "db-" + e.id;
  for (const section of lesson.module!.sections) {
    section.exerciseIds = section.exerciseIds.map((id) => "db-" + id);
    section.vocabularyIds = section.vocabularyIds.map((id) => "db-" + id);
  }
  await pg.exec("set role authenticated");
  await pg.query("select set_config('app.uid',$1,false)", [volunteer]);
  await pg.query(
    "insert into lessons(id,created_by,status,version,payload) values($1,$2,$3,1,$4)",
    [lesson.id, volunteer, lesson.status, JSON.stringify(lesson)],
  );
  await assert.rejects(
    () => pg.query("select publish_lesson('db-test')"),
    /approval required/,
  );
  lesson.status = "approved";
  await pg.query(
    "update lessons set status='approved',payload=$1 where id='db-test'",
    [JSON.stringify(lesson)],
  );
  await pg.query("select publish_lesson('db-test')");
  const immutable = await pg.query(
    "update published_versions set payload=payload || '{\"title\":\"silently changed\"}'::jsonb where lesson_id='db-test' returning version",
  );
  assert.equal(immutable.rows.length, 0);
  assert.equal(
    (
      await pg.query<{ count: string }>(
        "select count(*) from published_versions where lesson_id='db-test'",
      )
    ).rows[0].count,
    1,
  );
  await pg.query("select set_config('app.uid',$1,false)", [student]);
  await assert.rejects(
    () =>
      pg
        .query("update profiles set role='admin' where id=$1 returning id", [
          student,
        ])
        .then((r) => {
          if (!r.rows.length) throw new Error("no permitted rows");
        }),
    /no permitted rows|policy/,
  );
  await assert.rejects(
    () => pg.query("select publish_lesson('db-test')"),
    /approval required/,
  );
  const e = lesson.exercises.find((e) => e.type === "listen_choose")!;
  const id = "33333333-3333-4333-8333-333333333333";
  const payload = {
    id,
    studentId: student,
    lessonId: "spoof",
    version: 1,
    exerciseId: "spoof",
    correct: true,
    answer: "Wrong",
    tags: ["spoof"],
    timestamp: "2000-01-01",
    attemptCount: 1,
  };
  await pg.query(
    "insert into student_attempts(id,student_id,lesson_id,version,exercise_id,correct,payload) values($1,$2,$3,1,$4,true,$5)",
    [id, student, lesson.id, e.id, JSON.stringify(payload)],
  );
  const attempt = (
    await pg.query<{ correct: boolean; payload: any }>(
      "select correct,payload from student_attempts",
    )
  ).rows[0];
  assert.equal(attempt.correct, false);
  assert.equal(attempt.payload.lessonId, "db-test");
  assert.equal(attempt.payload.exerciseId, e.id);
  assert.deepEqual(attempt.payload.tags, e.tags);
  await assert.rejects(
    () =>
      pg.query("insert into lesson_completions values($1,$2,1,$3,now())", [
        student,
        lesson.id,
        JSON.stringify({}),
      ]),
    /Finish each activity/,
  );
  await pg.query("select set_config('app.uid',$1,false)", [volunteer]);
  assert.equal(
    (await pg.query("select * from student_attempts")).rows.length,
    0,
  );
  const analytics = (
    await pg.query<{ workshop_analytics: any }>("select workshop_analytics()")
  ).rows[0].workshop_analytics;
  assert.equal(analytics.students, 1);
  await pg.exec("reset role");
  assert.equal(
    (await pg.query("select * from student_mastery where word=$1", [e.tags[0]]))
      .rows.length,
    1,
  );
});
