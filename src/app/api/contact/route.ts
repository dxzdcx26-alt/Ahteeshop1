import { NextResponse } from "next/server";
import { getSettings } from "@/lib/site";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    status: true,
    facebookUrl: settings.facebookUrl || "",
    discordUrl: settings.discordUrl || "",
  });
}
