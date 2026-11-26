import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { workshopOne } from "@/lib/content/workshop-one";
import { speakingTarget } from "@/lib/speaking-target";
import { failure, guard } from "@/lib/server/security";
import { readSettings } from "@/lib/server/settings";
import { assessSpeaking } from "@/lib/server/speech";

declare global {
  interface CloudflareEnv {
    VISITOR_PRONUNCIATION?: {
      limit(options: { key: string }): Promise<{ success: boolean }>;
    };
  }
}

export const runtime = "nodejs";
const maxRequestBytes = 1024 * 1024;

async function recordingForm(req: NextRequest) {
  const contentType = req.headers.get("content-type");
  if (!req.body || !contentType?.startsWith("multipart/form-data")) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxRequestBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new Response(new Uint8Array(Buffer.concat(chunks)), {
    headers: { "Content-Type": contentType },
  })
    .formData()
    .catch(() => null);
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get("origin"))
      throw new Error("Cross-site requests are not allowed.");
    const client = req.headers.get("cf-connecting-ip") || "local";
    guard(req, `visitor-pronunciation:${client}`, 20);
    if (Number(req.headers.get("content-length") || 0) > maxRequestBytes)
      return NextResponse.json(
        { error: "Recording is too large." },
        { status: 413 },
      );
    const form = await recordingForm(req);
    const target =
      form?.get("lessonId") === workshopOne.id &&
      form.get("version") === String(workshopOne.version)
        ? speakingTarget(
            workshopOne,
            String(form.get("exerciseId") || ""),
            String(form.get("vocabularyId") || ""),
          )
        : null;
    const audio = form?.get("audio");
    if (!target || !(audio instanceof File) || audio.type !== "audio/wav")
      return NextResponse.json(
        { error: "Use a recording from a Workshop 1 pronunciation activity." },
        { status: 400 },
      );

    let limiter: CloudflareEnv["VISITOR_PRONUNCIATION"];
    try {
      limiter = getCloudflareContext().env.VISITOR_PRONUNCIATION;
    } catch {
      // The application guard above also covers local Next.js runs.
    }
    if (limiter && !(await limiter.limit({ key: client })).success)
      throw new Error("Too many requests. Please try again in a minute.");

    const settings = await readSettings();
    if (settings.speechProvider !== "azure" || !settings.speechKey)
      return NextResponse.json(
        {
          available: false,
          message:
            "Pronunciation scoring is unavailable. You can still listen to your recording.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    const feedback = await assessSpeaking(audio, settings, target);
    return NextResponse.json(
      { available: true, ...feedback },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
