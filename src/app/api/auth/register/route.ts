import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, publicUser, SESSION_COOKIE, isSameOriginRequest } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ status: false, message: "คำขอข้ามเว็บไซต์ถูกปฏิเสธ" }, { status: 403 });
  const ipLimit = await enforceRateLimit(req, "auth-register-ip", 5, 60 * 60 * 1000);
  if (ipLimit) return ipLimit;
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const password2 = String(body.password2 || "");

    if (!username || !password) {
      return NextResponse.json({ status: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { status: false, message: "ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข หรือ _ ความยาว 3-20 ตัวอักษร" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json({ status: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    if (password !== password2) {
      return NextResponse.json({ status: false, message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" }, { status: 400 });
    }

    const exists = await db.user.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json({ status: false, message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 400 });
    }

    const user = await db.user.create({
      data: { username, password: await bcrypt.hash(password, 10) },
    });
    await db.transaction.create({
      data: { userId: user.id, type: "system", amount: 0, detail: "สมัครสมาชิก" },
    });

    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json({ status: true, message: "สมัครสมาชิกสำเร็จ", user: publicUser(user) });
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
