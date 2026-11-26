import { NextRequest, NextResponse } from "next/server";
import { failure, guard } from "@/lib/server/security";
import { readSettings } from "@/lib/server/settings";
import {
  publicWorkshopAudioTexts,
  workshopListeningAudio,
} from "@/lib/server/workshop-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";
  // This endpoint can play only the bundled public curriculum, never uploaded
  // material, learner text, or private lesson clips.
  if (!publicWorkshopAudioTexts.has(text))
    return NextResponse.json(
      { error: "Workshop audio is unavailable for this phrase." },
      { status: 404 },
    );
  try {
    guard(
      req,
      `public-workshop-audio:${req.headers.get("cf-connecting-ip") || "local"}`,
      60,
    );
    const settings = await readSettings();
    if (!settings.ttsKey || settings.ttsProvider === "disabled")
      return NextResponse.json(
        { available: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    const bytes = await workshopListeningAudio(
      text,
      settings,
      req.nextUrl.origin,
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
