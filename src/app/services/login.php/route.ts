import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const user = String(form?.get("user") || "").trim();
  const pass = String(form?.get("pass") || "");
  const json = (status: string, message: string, code = 200) => NextResponse.json({ status, message }, { status: code });

  if (!user || !pass) return json("fail", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
  const u = await db.user.findUnique({ where: { username: user } });
  if (!u || !(await bcrypt.compare(pass, u.password))) return json("fail", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

  const { token, expiresAt } = await createSession(u.id);
  const res = json("success", "เข้าสู่ระบบสำเร็จ");
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", expires: expiresAt, path: "/" });
  return res;
}
