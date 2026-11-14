import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, publicUser, SESSION_COOKIE, isSameOriginRequest } from "@/lib/auth";\nimport { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ status: false, message: "คำขอข้ามเว็บไซต์ถูกปฏิเสธ" }, { status: 403 });\n  const ipLimit = await enforceRateLimit(req, "auth-login-ip", 30);\n  if (ipLimit) return ipLimit;
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");\n    const accountLimit = await enforceRateLimit(req, "auth-login-account", 8, 15 * 60 * 1000, username.toLowerCase());\n    if (accountLimit) return accountLimit;

    if (!username || !password) {
      return NextResponse.json({ status: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ status: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json({ status: true, message: "เข้าสู่ระบบสำเร็จ", user: publicUser(user) });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ status: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
