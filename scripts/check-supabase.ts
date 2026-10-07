import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  const endpoint = new URL(url);
  if (
    endpoint.protocol !== "https:" &&
    endpoint.hostname !== "localhost" &&
    endpoint.hostname !== "127.0.0.1"
  )
    throw new Error("Use an HTTPS project URL.");
  const result = await fetch(new URL("/auth/v1/settings", endpoint), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!result.ok)
    throw new Error(
      "Supabase Auth could not be reached with this project URL and public key.",
    );
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client
    .from("published_versions")
    .select("lesson_id")
    .limit(1);
  if (error)
    throw new Error(
      "Auth is reachable but the lesson table is unavailable. Apply the appropriate setup SQL and check API table permissions.",
    );
  console.log(
    "Supabase Auth and the lesson table are reachable. Sign in with a test student and volunteer to validate account permissions and module data.",
  );
  if (process.env.APP_MODE !== "supabase")
    console.log(
      "Set APP_MODE=supabase and restart the app to use this connection.",
    );
}
main().catch((e) => {
  console.error(
    e instanceof Error && !/fetch failed/.test(e.message)
      ? e.message
      : "Could not reach Supabase. Check the network and project configuration.",
  );
  process.exitCode = 1;
});
