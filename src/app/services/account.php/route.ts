import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: "fail", message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const action = String(form?.get("action") || "");

  if (action === "cpass") {
    const oldP = String(form?.get("old") || "");
    const newP = String(form?.get("new") || "");
    const newP2 = String(form?.get("new2") || "");
    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u || !(await bcrypt.compare(oldP, u.password))) return NextResponse.json({ status: "fail", message: "รหัสผ่านเดิมไม่ถูกต้อง" });
    if (newP.length < 6) return NextResponse.json({ status: "fail", message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
    if (newP !== newP2) return NextResponse.json({ status: "fail", message: "รหัสผ่านใหม่ไม่ตรงกัน" });
    await db.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newP, 10) } });
    return NextResponse.json({ status: "success", message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  }

  return NextResponse.json({ status: "fail", message: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
}
