import { readSettings, hasDeveloper, validateEndpoints } from "./settings";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const windows = new Map<string, { count: number; until: number }>();
export async function identity(req: NextRequest) {
  const settings = await readSettings();
  if (settings.mode === "supabase") {
    validateEndpoints(settings);
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) throw new Error("Sign in to continue.");
    const client = createClient(settings.supabaseUrl, settings.supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new Error("Sign in to continue.");
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    return { id: data.user.id, role: profile?.role || "student", client };
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.APP_MODE !== "demo" &&
    process.env.LOCAL_DEVELOPER_SETUP !== "true" &&
    !(await hasDeveloper())
  )
    throw new Error(
      "Set APP_MODE=demo for an isolated demo, or configure Supabase authentication.",
    );
  const jar = await cookies();
  let id = jar.get("demo_user")?.value;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = crypto.randomUUID();
    jar.set("demo_user", id, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return {
    id,
    role: jar.get("demo_role")?.value === "volunteer" ? "volunteer" : "student",
    client: null,
  };
}
export function requireVolunteer(user: { role: string }) {
  if (!["volunteer", "admin"].includes(user.role))
    throw new Error("Volunteer access is required.");
}
export function guard(req: NextRequest, id: string, limit = 40) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host"))
    throw new Error("Cross-site requests are not allowed.");
  const now = Date.now();
  if (windows.size > 10000)
    for (const [key, v] of windows) if (v.until < now) windows.delete(key);
  const key = `${id}:${req.nextUrl.pathname}`;
  const window = windows.get(key);
  if (!window || window.until < now)
    windows.set(key, { count: 1, until: now + 60000 });
  else if (++window.count > limit)
    throw new Error("Too many requests. Please try again in a minute.");
}
export function failure(e: unknown) {
  const message = e instanceof Error ? e.message : "Something went wrong.";
  console.error("Request failed:", message.slice(0, 300));
  const safe =
    /Generated analysis|Generated lesson|Speech transcription|Lesson audio|Sign in|Volunteer access|Cross-site|Too many|Set APP_MODE|Demo generation supports|Demo extraction needs|Files must|Use PDF|No readable text|Please split|Vocabulary is not grounded|Approve this draft|Finish each activity|File is too large|Document expands|Invalid PDF|Invalid document|This lesson is unavailable/.test(
      message,
    )
      ? message
      : "We could not finish that request. Check the material or try again.";
  return NextResponse.json(
    { error: safe },
    {
      status: /Sign in/.test(message)
        ? 401
        : /Volunteer|Cross-site/.test(message)
          ? 403
          : /Too many/.test(message)
            ? 429
            : 400,
    },
  );
}
