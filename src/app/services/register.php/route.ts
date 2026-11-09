import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE, inboxMsg, tx } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const user = String(form?.get("user") || "").trim();
  const pass = String(form?.get("pass") || "");
  const pass2 = String(form?.get("pass2") || "");
  const json = (status: string, message: string) => NextResponse.json({ status, message });

  if (!user || !pass || !pass2) return json("fail", "กรุณากรอกข้อมูลให้ครบถ้วน");
  if (user.length < 3 || user.length > 24) return json("fail", "ชื่อผู้ใช้ต้องมี 3-24 ตัวอักษร");
  if (!/^[a-zA-Z0-9_.-]+$/.test(user)) return json("fail", "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z A-Z 0-9 _ . -");
  if (pass.length < 6) return json("fail", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
  if (pass !== pass2) return json("fail", "รหัสผ่านไม่ตรงกัน");
  const exists = await db.user.findUnique({ where: { username: user } });
  if (exists) return json("fail", "มีชื่อผู้ใช้นี้อยู่ในระบบแล้ว");

  const hash = await bcrypt.hash(pass, 10);
  const u = await db.user.create({ data: { username: user, password: hash } });
  await Promise.all([
    tx(u.id, "register", 0, "สมัครสมาชิก"),
    inboxMsg(u.id, "ยินดีต้อนรับ", `ยินดีต้อนรับสู่ระบบ ${user} ขอให้สนุกกับการใช้บริการ`),
  ]);
  const { token, expiresAt } = await createSession(u.id);
  const res = json("success", "สมัครสมาชิกสำเร็จ");
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", expires: expiresAt, path: "/" });
  return res;
}
