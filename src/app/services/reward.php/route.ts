import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, verifyCsrf, inboxMsg } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: "fail", message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const csrf = String(form?.get("csrf") || "");
  if (!(await verifyCsrf(req, csrf))) return NextResponse.json({ status: "fail", message: "หมดอายุ ลองอีกครั้ง" }, { status: 403 });

  const id = String(form?.get("id") || "");
  const rw = await db.rewardItem.findUnique({ where: { id } });
  if (!rw || !rw.active) return NextResponse.json({ status: "fail", message: "ไม่พบรางวัลนี้" });
  if (rw.stock <= 0) return NextResponse.json({ status: "fail", message: "รางวัลหมด" });

  const fresh = await db.user.findUnique({ where: { id: user.id } });
  if (!fresh) return NextResponse.json({ status: "fail", message: "ไม่พบบัญชี" });
  if (fresh.points < rw.pointsCost) return NextResponse.json({ status: "fail", message: `แต้มไม่เพียงพอ (ต้องการ ${rw.pointsCost} แต้ม)` });

  await db.$transaction(async (txc) => {
    const still = await txc.rewardItem.findUnique({ where: { id } });
    if (!still || still.stock <= 0) throw new Error("out");
    await txc.rewardItem.update({ where: { id }, data: { stock: { decrement: 1 } } });
    await txc.user.update({ where: { id: fresh.id }, data: { points: { decrement: rw.pointsCost } } });
  });
  await inboxMsg(user.id, `แลกรางวัลสำเร็จ: ${rw.name}`, `คุณแลก ${rw.name} ด้วย ${rw.pointsCost} แต้ม สำเร็จ\n${rw.detail ? "รายละเอียด: " + rw.detail : ""}\nติดต่อรับรางวัลได้ที่ทางร้าน`);
  return NextResponse.json({ status: "success", message: `แลก ${rw.name} สำเร็จ รายละเอียดถูกส่งไปที่กล่องข้อความ` });
}
