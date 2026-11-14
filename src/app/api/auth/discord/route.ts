import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const OAUTH_STATE_COOKIE = "ahtee_discord_oauth_state";
export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) return NextResponse.json({ status: "fail", message: "ยังไม่ได้ตั้ง DISCORD_CLIENT_ID" }, { status: 500 });
  const origin = req.nextUrl.origin;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || origin + "/api/auth/discord/callback";
  const state = randomBytes(32).toString("hex");
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "identify email", prompt: "consent", state });
  const response = NextResponse.redirect("https://discord.com/api/oauth2/authorize?" + params.toString());
  response.cookies.set(OAUTH_STATE_COOKIE, state, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/auth/discord/callback", maxAge: 600 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}