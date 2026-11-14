import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE, inboxMsg, tx } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const username = String(form?.get("user") || "").trim();
  const password = String(form?.get("pass") || "");
  const password2 = String(form?.get("pass2") || "");
  const json = (status: string, message: string, code = 200) => NextResponse.json({ status, message }, { status: code });

  if (!username || !password || !password2) return json("fail", "กรุณากรอกข้อมูลให้ครบถ้วน", 400);
  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) return json("fail", "ชื่อผู้ใช้ต้องมี 3-24 ตัวอักษรและใช้ a-z A-Z 0-9 _ . -", 400);
  if (password.length < 6 || password.length > 128) return json("fail", "รหัสผ่านต้องมีความยาว 6-128 ตัวอักษร", 400);
  if (password !== password2) return json("fail", "รหัสผ่านไม่ตรงกัน", 400);

  try {
    const user = await db.user.create({ data: { username, password: await bcrypt.hash(password, 10) } });
    await db.$transaction([
      db.transaction.create({ data: { userId: user.id, type: "register", amount: 0, detail: "สมัครสมาชิก" } }),
      db.inboxMessage.create({ data: { userId: user.id, title: "ยินดีต้อนรับ", body: `ยินดีต้อนรับสู่ระบบ ${username} ขอให้สนุกกับการใช้บริการ` } }),
    ]);
    const { token, expiresAt } = await createSession(user.id);
    const res = json("success", "สมัครสมาชิกสำเร็จ");
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", expires: expiresAt, path: "/",
    });
    return res;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return json("fail", "มีชื่อผู้ใช้นี้อยู่ในระบบแล้ว", 409);
    }
    console.error("[POST /services/register.php] Failed:", error);
    return json("fail", "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่", 500);
  }
}
