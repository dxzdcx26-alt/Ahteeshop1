import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const username = String(form?.get("user") || "").trim();
  const password = String(form?.get("pass") || "");
  const json = (status: string, message: string, code = 200) => NextResponse.json({ status, message }, { status: code });
  if (!username || !password) return json("fail", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", 400);
  const user = await db.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) return json("fail", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
  const { token, expiresAt } = await createSession(user.id);
  const res = json("success", "เข้าสู่ระบบสำเร็จ");
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", expires: expiresAt, path: "/",
  });
  return res;
}
