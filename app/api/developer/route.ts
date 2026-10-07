import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  hasDeveloper,
  initializeDeveloper,
  checkPassword,
  developerSession,
  validDeveloperSession,
  readSettings,
  redactedSettings,
  saveSettings,
} from "@/lib/server/settings";
import { guard } from "@/lib/server/security";
import {
  testService,
  initializeDatabase,
  provisionAccount,
  previewLessonVoice,
} from "@/lib/server/developer-services";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookie = "developer_session";
function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
function bootstrapAllowed(req: NextRequest) {
  return (
    process.env.LOCAL_DEVELOPER_SETUP === "true" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(req.nextUrl.hostname)
  );
}
async function authorized(req: NextRequest) {
  return validDeveloperSession(req.cookies.get(cookie)?.value);
}
export async function GET(req: NextRequest) {
  const authenticated = await authorized(req);
  return json({
    initialized: await hasDeveloper(),
    bootstrapAllowed: bootstrapAllowed(req),
    authenticated,
    ...(authenticated
      ? { settings: redactedSettings(await readSettings()) }
      : {}),
  });
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (
      !origin ||
      new URL(origin).host !== req.headers.get("host") ||
      !req.headers.get("content-type")?.startsWith("application/json")
    )
      return json({ error: "Use the developer page on this website." }, 403);
    if (
      new URL(origin).protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(req.nextUrl.hostname)
    )
      return json(
        { error: "Use HTTPS for developer setup outside localhost." },
        403,
      );
    if (Number(req.headers.get("content-length") || 0) > 20000)
      return json({ error: "Setup request is too large." }, 413);
    const text = await req.text();
    if (text.length > 20000)
      return json({ error: "Setup request is too large." }, 413);
    const body = JSON.parse(text);
    if (body.action === "initialize" || body.action === "login") {
      guard(req, "developer-login", 8);
      const { password } = z
        .object({ password: z.string().min(1).max(128) })
        .parse(body);
      if (body.action === "initialize") {
        if (!bootstrapAllowed(req))
          return json(
            {
              error:
                "First-time setup is available only from the local developer server. Start it with npm run dev.",
            },
            403,
          );
        await initializeDeveloper(password);
      } else if (!(await checkPassword(password)))
        return json({ error: "Developer password is incorrect." }, 401);
      const response = json({ ok: true });
      response.cookies.set(cookie, await developerSession(), {
        httpOnly: true,
        sameSite: "strict",
        secure: new URL(origin).protocol === "https:",
        path: "/",
        maxAge: 8 * 60 * 60,
      });
      return response;
    }
    if (!(await authorized(req)))
      return json({ error: "Developer sign in required." }, 401);
    guard(req, "developer-console", 40);
    if (body.action === "logout") {
      const response = json({ ok: true });
      response.cookies.delete(cookie);
      return response;
    }
    if (body.action === "save")
      return json({
        settings: await saveSettings(
          z.record(z.unknown()).parse(body.settings),
        ),
        message: "Settings saved. Changes are active immediately.",
      });
    const settings = await readSettings();
    if (body.action === "test") {
      const service = z
        .enum(["ai", "speech", "tts", "supabase", "database"])
        .parse(body.service);
      return json(
        service === "tts"
          ? await previewLessonVoice(settings)
          : { message: await testService(settings, service) },
      );
    }
    if (body.action === "database") {
      if (body.confirm !== true)
        return json({ error: "Confirm database initialization first." }, 400);
      return json({ message: await initializeDatabase(settings) });
    }
    if (body.action === "account") {
      const account = z
        .object({
          email: z.string().email().max(254),
          password: z.string().min(12).max(128),
          role: z.enum(["student", "volunteer", "admin"]),
        })
        .parse(body);
      return json({
        message: await provisionAccount(
          settings,
          account.email,
          account.password,
          account.role,
        ),
      });
    }
    return json({ error: "Unknown setup action." }, 400);
  } catch (e) {
    // Provider and database errors can include credentials; never log or return raw errors.
    const message = e instanceof Error ? e.message : "";
    const safe =
      /^(Add |Use |Developer account already|Developer sign in|Connect to a Supabase|Existing database tables|Speech transcription|Lesson audio|AI connection test failed|Speech connection test failed|Supabase connection test failed|Account creation failed|Account role could not|Unknown service setting)/.test(
        message,
      );
    return json(
      {
        error: safe
          ? message
          : "Setup could not complete. Check your connection details, provider access, and database permissions.",
      },
      400,
    );
  }
}
