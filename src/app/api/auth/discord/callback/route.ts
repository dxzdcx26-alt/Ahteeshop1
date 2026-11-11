import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

type DiscordToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  email?: string | null;
  avatar?: string | null;
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const err = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;

  if (err || !code) {
    return NextResponse.redirect(`${origin}/?page=login&discord=error`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?page=login&discord=config`);
  }

  const redirectUri =
    process.env.DISCORD_REDIRECT_URI || `${origin}/api/auth/discord/callback`;

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      console.error("discord token", await tokenRes.text());
      return NextResponse.redirect(`${origin}/?page=login&discord=token`);
    }
    const token = (await tokenRes.json()) as DiscordToken;

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `${token.token_type} ${token.access_token}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/?page=login&discord=user`);
    }
    const dUser = (await userRes.json()) as DiscordUser;

    let user = await db.user.findFirst({
      where: { OR: [{ discordId: dUser.id }, { username: `dc_${dUser.id}` }] },
    });

    if (!user) {
      const base =
        (dUser.global_name || dUser.username || "user")
          .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "")
          .slice(0, 16) || "user";
      let username = base;
      let n = 0;
      while (await db.user.findUnique({ where: { username } })) {
        n += 1;
        username = `${base}${n}`.slice(0, 20);
      }
      const randomPass = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
      user = await db.user.create({
        data: {
          username,
          password: randomPass,
          discordId: dUser.id,
          role: "user",
        },
      });
    } else if (!user.discordId) {
      user = await db.user.update({
        where: { id: user.id },
        data: { discordId: dUser.id },
      });
    }

    const { token: sessionToken, expiresAt } = await createSession(user.id);
    const res = NextResponse.redirect(`${origin}/?page=home&discord=ok`);
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https"),
      expires: expiresAt,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("discord oauth", e);
    return NextResponse.redirect(`${origin}/?page=login&discord=error`);
  }
}
