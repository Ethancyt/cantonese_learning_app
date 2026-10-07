import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { seedLessons } from "../lib/seeds";

test("private audio storage hides drafts, protects immutable files and serves published versions", async (t) => {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(
    `create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),name text unique,bucket_id text);alter table storage.objects enable row level security;create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;`,
  );
  await pg.exec(
    (await readFile("supabase/schema.sql", "utf8")).replace(
      "create extension if not exists pgcrypto;",
      "",
    ),
  );
  const migration = await readFile(
    "supabase/migrations/003_lesson_audio.sql",
    "utf8",
  );
  await pg.exec(migration);
  await pg.exec(migration);
  assert.equal(
    (
      await pg.query<{ public: boolean }>(
        "select public from storage.buckets where id='lesson-audio'",
      )
    ).rows[0].public,
    false,
  );
  const owner = "11111111-1111-4111-8111-111111111111",
    student = "22222222-2222-4222-8222-222222222222",
    other = "33333333-3333-4333-8333-333333333333";
  await pg.query("insert into auth.users values($1),($2),($3)", [
    owner,
    student,
    other,
  ]);
  await pg.query("update profiles set role='volunteer' where id in ($1,$2)", [
    owner,
    other,
  ]);
  const lesson = structuredClone(seedLessons[1]);
  lesson.id = "private-audio";
  lesson.createdBy = owner;
  lesson.status = "under_review";
  lesson.version = 1;
  const id = "a".repeat(64),
    nextId = "b".repeat(64);
  lesson.audio = [
    {
      id,
      text: "你好",
      provider: "azure",
      voice: "zh-HK-HiuMaanNeural",
      model: "azure-neural",
      createdAt: new Date().toISOString(),
    },
  ];
  await pg.exec(
    "grant usage on schema public,auth,storage to authenticated;grant select,insert,update,delete on all tables in schema public,storage to authenticated;set role authenticated;",
  );
  await pg.query("select set_config('app.uid',$1,false)", [owner]);
  await pg.query(
    "insert into lessons(id,created_by,status,version,payload) values($1,$2,$3,1,$4)",
    [lesson.id, owner, lesson.status, JSON.stringify(lesson)],
  );
  await pg.query(
    "insert into storage.objects(name,bucket_id) values($1,'lesson-audio')",
    [`${lesson.id}/${id}.mp3`],
  );
  assert.equal(
    (await pg.query("select * from storage.objects")).rows.length,
    1,
  );
  for (const user of [student, other]) {
    await pg.query("select set_config('app.uid',$1,false)", [user]);
    assert.equal(
      (await pg.query("select * from storage.objects")).rows.length,
      0,
    );
    await assert.rejects(
      () =>
        pg.query(
          "insert into storage.objects(name,bucket_id) values($1,'lesson-audio')",
          [`${lesson.id}/${nextId}.mp3`],
        ),
      /policy/,
    );
  }
  await pg.query("select set_config('app.uid',$1,false)", [owner]);
  assert.equal(
    (await pg.query("update storage.objects set name='changed' returning id"))
      .rows.length,
    0,
  );
  assert.equal(
    (await pg.query("delete from storage.objects returning id")).rows.length,
    0,
  );
  lesson.status = "approved";
  await pg.query(
    "update lessons set status='approved',payload=$1 where id=$2",
    [JSON.stringify(lesson), lesson.id],
  );
  await pg.query("select publish_lesson($1)", [lesson.id]);
  await pg.query("select set_config('app.uid',$1,false)", [student]);
  assert.equal(
    (await pg.query("select * from storage.objects")).rows.length,
    1,
  );
  await pg.query("select set_config('app.uid',$1,false)", [owner]);
  await assert.rejects(
    () =>
      pg.query(
        "insert into storage.objects(name,bucket_id) values($1,'lesson-audio')",
        [`${lesson.id}/${nextId}.mp3`],
      ),
    /policy/,
  );
  lesson.status = "under_review";
  lesson.version = 2;
  lesson.audio = [{ ...lesson.audio[0], id: nextId, text: "早晨" }];
  await pg.query(
    "update lessons set status='under_review',version=2,payload=$1 where id=$2",
    [JSON.stringify(lesson), lesson.id],
  );
  await pg.query(
    "insert into storage.objects(name,bucket_id) values($1,'lesson-audio')",
    [`${lesson.id}/${nextId}.mp3`],
  );
  await pg.query("select set_config('app.uid',$1,false)", [student]);
  assert.deepEqual(
    (await pg.query("select name from storage.objects")).rows,
    [{ name: `${lesson.id}/${id}.mp3` }],
    "student sees the original published clip, not a new draft clip",
  );
  lesson.status = "approved";
  lesson.availability = "scheduled";
  lesson.availableAt = "2099-01-01T00:00:00.000Z";
  await pg.query("select set_config('app.uid',$1,false)", [owner]);
  await pg.query(
    "update lessons set status='approved',payload=$1 where id=$2",
    [JSON.stringify(lesson), lesson.id],
  );
  await pg.query("select publish_lesson($1)", [lesson.id]);
  await pg.query("select set_config('app.uid',$1,false)", [student]);
  assert.equal(
    (await pg.query("select * from storage.objects")).rows.length,
    1,
    "scheduled new version remains private",
  );
  await pg.exec("reset role");
  await pg.query(
    "update lessons set status='archived',payload=jsonb_set(payload,'{status}','\"archived\"') where id=$1",
    [lesson.id],
  );
  await pg.exec("set role authenticated");
  assert.equal(
    (await pg.query("select * from storage.objects")).rows.length,
    0,
    "archived lessons hide their stored clips",
  );
});
