import { NextResponse } from "next/server";
import { readSettings, publicConfiguration } from "@/lib/server/settings";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(
      publicConfiguration(
        await readSettings(),
        process.env.LOCAL_DEVELOPER_SETUP === "true",
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Service configuration is invalid. Open Developer setup to update it.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
