import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { status: "fail", message: "ยังไม่ได้ตั้ง DISCORD_CLIENT_ID" },
      { status: 500 }
    );
  }

  const origin = req.nextUrl.origin;
  const redirectUri =
    process.env.DISCORD_REDIRECT_URI || `${origin}/api/auth/discord/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
}
