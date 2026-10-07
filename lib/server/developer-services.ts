import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { Settings } from "./settings";
import { CompatibleProvider } from "../ai/provider";
import { transcribeAudio } from "./speech";
import { synthesize } from "./lesson-audio";
import { curriculumSQL } from "../../scripts/seed-supabase";

function database(settings: Settings) {
  if (!settings.databaseUrl)
    throw new Error("Add the database connection string first.");
  const url = new URL(settings.databaseUrl);
  const local =
    process.env.LOCAL_DEVELOPER_SETUP === "true" &&
    ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  const project = settings.supabaseUrl
    ? new URL(settings.supabaseUrl).hostname.split(".")[0]
    : "";
  if (
    !local &&
    (!project ||
      !(
        url.hostname === `db.${project}.supabase.co` ||
        (url.hostname.endsWith(".pooler.supabase.com") &&
          decodeURIComponent(url.username) === `postgres.${project}`)
      ))
  )
    throw new Error(
      "Use the session-pooler or direct database connection string for this Supabase project.",
    );
  for (const name of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(name);
  return new Client({
    connectionString: url.toString(),
    ssl: local ? false : { rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000,
  });
}
export async function testService(
  settings: Settings,
  service: "ai" | "speech" | "tts" | "supabase" | "database",
) {
  if (service === "ai") {
    if (!settings.aiKey) throw new Error("Add an AI API key first.");
    const result = await new CompatibleProvider(settings).json(
      'Reply with JSON {"connected":true}. This is a connection test.',
      { test: true },
    );
    if (!result || typeof result !== "object")
      throw new Error("AI connection test failed.");
    return "AI generation connected. This test uses a small provider request.";
  }
  if (service === "tts") {
    await synthesize("你好，歡迎學廣東話。", settings);
    return "Lesson audio connected. A short Cantonese voice clip was generated for this test.";
  }
  if (service === "speech") {
    if (!settings.speechKey) throw new Error("Add a speech API key first.");
    // A short silent WAV verifies authentication and the transcription endpoint without learner audio.
    const wav = Buffer.alloc(44 + 32000);
    wav.write("RIFF");
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(16000, 24);
    wav.writeUInt32LE(32000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(32000, 40);
    await transcribeAudio(
      new File([wav], "connection-test.wav", { type: "audio/wav" }),
      settings,
    );
    return "Speech transcription connected. The test used one second of silence.";
  }
  if (service === "supabase") {
    if (!settings.supabaseUrl || !settings.supabaseKey)
      throw new Error("Add the Supabase URL and public key first.");
    const response = await fetch(
      new URL("/auth/v1/settings", settings.supabaseUrl),
      {
        headers: { apikey: settings.supabaseKey },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      throw new Error(
        "Supabase connection test failed. Check the project URL and public key.",
      );
    const client = createClient(settings.supabaseUrl, settings.supabaseKey, {
      auth: { persistSession: false },
    });
    const { error } = await client
      .from("published_versions")
      .select("lesson_id")
      .limit(1);
    return error
      ? "Supabase Auth connected. Initialize the database before switching to connected accounts."
      : "Supabase Auth and lesson tables are reachable.";
  }
  const client = database(settings);
  try {
    await client.connect();
    await client.query("select 1");
    return "Database connection successful.";
  } finally {
    await client.end();
  }
}
export async function applyLearningDatabase(
  runSQL: (sql: string) => Promise<{ rows: Record<string, unknown>[] }>,
) {
  try {
    await runSQL("begin");
    await runSQL(
      "select pg_advisory_xact_lock(hashtext('little-hong-kong-setup'))",
    );
    const { rows } = await runSQL(
      "select to_regclass('public.lessons') as lessons, to_regclass('public.profiles') as profiles, to_regclass('public.published_versions') as versions, to_regclass('auth.users') as auth",
    );
    if (!rows[0].auth)
      throw new Error(
        "Connect to a Supabase database with Authentication enabled.",
      );
    if (rows[0].lessons && (!rows[0].profiles || !rows[0].versions))
      throw new Error(
        "Existing database tables do not match this app. Choose a dedicated Supabase project.",
      );
    if (!rows[0].lessons)
      await runSQL(
        await readFile(path.join(process.cwd(), "supabase/schema.sql"), "utf8"),
      );
    const modules = await readFile(
      path.join(process.cwd(), "supabase/migrations/002_learning_modules.sql"),
      "utf8",
    );
    const strip = (sql: string) =>
      sql.replace(/^\s*(begin|commit);\s*$/gim, "");
    await runSQL(strip(modules));
    await runSQL(
      await readFile(
        path.join(process.cwd(), "supabase/migrations/003_lesson_audio.sql"),
        "utf8",
      ),
    );
    await runSQL(strip(curriculumSQL()));
    // Supabase defaults may vary; explicit grants let RLS govern authenticated access.
    await runSQL(
      "grant usage on schema public to authenticated; grant select,insert,update,delete on public.profiles,public.workshops,public.journeys,public.source_materials,public.source_chunks,public.lessons,public.published_versions,public.vocabulary,public.exercises,public.lesson_exercises,public.student_attempts,public.lesson_completions,public.student_mastery,public.ai_generations,public.content_reports,public.learning_modules,public.module_sections to authenticated; grant select on public.published_versions to anon;",
    );
    await runSQL("commit");
    return "Database ready: tables, access policies, and four learning modules installed. Existing published versions and learner records are preserved.";
  } catch (e) {
    await runSQL("rollback").catch(() => {});
    throw e;
  }
}
export async function initializeDatabase(settings: Settings) {
  const client = database(settings);
  try {
    await client.connect();
    return await applyLearningDatabase((sql) => client.query(sql));
  } finally {
    await client.end();
  }
}
export async function provisionAccount(
  settings: Settings,
  email: string,
  password: string,
  role: "student" | "volunteer" | "admin",
) {
  if (!settings.supabaseUrl || !settings.serviceKey)
    throw new Error(
      "Add the Supabase project URL and secret/service-role key first.",
    );
  const admin = createClient(settings.supabaseUrl, settings.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user)
    throw new Error(
      "Account creation failed. Check the secret key, email, password, and whether the email already exists.",
    );
  const assigned = await admin
    .from("profiles")
    .update({ role })
    .eq("id", data.user.id)
    .select("id")
    .single();
  if (assigned.error) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(
      "Account role could not be assigned. Initialize the database first.",
    );
  }
  return "Account created. This person can now sign in from the learning website.";
}
