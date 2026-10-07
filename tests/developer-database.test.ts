import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { applyLearningDatabase } from "../lib/server/developer-services";
test("developer database button installs atomically and upgrades without duplicating modules", async (t) => {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(
    `create role authenticated;create role anon;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,name text,bucket_id text);alter table storage.objects enable row level security;create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;`,
  );
  const query = async (sql: string) => {
    const results = await pg.exec(
      sql.replace(
        "create extension if not exists pgcrypto;",
        "-- built-in UUID support",
      ),
    );
    return { rows: (results.at(-1)?.rows as Record<string, unknown>[]) || [] };
  };
  await applyLearningDatabase(query);
  const original = (
    await pg.query("select * from published_versions order by lesson_id")
  ).rows;
  await applyLearningDatabase(query);
  assert.deepEqual(
    (await pg.query("select * from published_versions order by lesson_id"))
      .rows,
    original,
  );
  assert.equal(
    (await pg.query("select * from module_sections")).rows.length,
    16,
  );
  await pg.exec("set role anon");
  assert.equal(
    (await pg.query("select * from published_versions")).rows.length,
    0,
  );
  await pg.exec("reset role");
  await pg.exec("drop table published_versions cascade");
  await assert.rejects(() => applyLearningDatabase(query), /do not match/);
  assert.equal(
    (await pg.query("select * from module_sections")).rows.length,
    16,
  );
});
