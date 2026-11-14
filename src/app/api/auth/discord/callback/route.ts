import { randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth-extra";
export const dynamic = "force-dynamic";
const OAUTH_STATE_COOKIE = "ahtee_discord_oauth_state";
type DiscordToken = { access_token: string; token_type: string; expires_in: number; refresh_token?: string; scope: string };
type DiscordUser = { id: string; username: string; global_name?: string | null; discriminator?: string; email?: string | null; avatar?: string | null };

function loginRedirect(origin: string, reason: string, secure: boolean) {
  const response = NextResponse.redirect(origin + "/?page=login&discord=" + reason);
  response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/api/auth/discord/callback", expires: new Date(0) });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const err = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state") || "";
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value || "";
  const origin = req.nextUrl.origin;
  const secure = req.nextUrl.protocol === "https:";
  if (err || !code) return loginRedirect(origin, "error", secure);
  if (!state || !stateCookie || state.length !== stateCookie.length || !timingSafeEqual(Buffer.from(state), Buffer.from(stateCookie))) {
    return loginRedirect(origin, "state", secure);
  }
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return loginRedirect(origin, "config", secure);
  const redirectUri = process.env.DISCORD_REDIRECT_URI || origin + "/api/auth/discord/callback";
  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      cache: "no-store",
    });
    if (!tokenRes.ok) {
      console.error("discord token exchange failed", tokenRes.status);
      return loginRedirect(origin, "token", secure);
    }
    const token = await tokenRes.json() as DiscordToken;
    const userRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: token.token_type + " " + token.access_token }, cache: "no-store" });
    if (!userRes.ok) return loginRedirect(origin, "user", secure);
    const dUser = await userRes.json() as DiscordUser;
    let user = await db.user.findFirst({ where: { OR: [{ discordId: dUser.id }, { username: "dc_" + dUser.id }] } });
    if (!user) {
      const base = (dUser.global_name || dUser.username || "user").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "").slice(0, 16) || "user";
      let username = base;
      let n = 0;
      while (await db.user.findUnique({ where: { username } })) { n += 1; username = (base + n).slice(0, 20); }
      const randomPass = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
      user = await db.user.create({ data: { username, password: randomPass, discordId: dUser.id, role: "user" } });
    } else if (!user.discordId) {
      user = await db.user.update({ where: { id: user.id }, data: { discordId: dUser.id } });
    }
    const session = await createSession(user.id);
    const response = NextResponse.redirect(origin + "/?page=home&discord=ok");
    response.cookies.set(SESSION_COOKIE, session.token, { httpOnly: true, sameSite: "lax", secure, expires: session.expiresAt, path: "/" });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/api/auth/discord/callback", expires: new Date(0) });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("discord oauth callback failed", error instanceof Error ? error.message : "unknown");
    return loginRedirect(origin, "error", secure);
  }
}