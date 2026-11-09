import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const items = await db.rewardItem.findMany({ where: { active: true }, orderBy: { pointsCost: "asc" } });
  return NextResponse.json({ status: true, points: user.points, items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const itemId = String(body.id || "");

  const item = await db.rewardItem.findUnique({ where: { id: itemId } });
  if (!item || !item.active) {
    return NextResponse.json({ status: false, message: "ไม่พบรางวัลนี้" }, { status: 404 });
  }
  if (item.stock < 1) {
    return NextResponse.json({ status: false, message: "รางวัลนี้หมด" }, { status: 400 });
  }
  if (user.points < item.pointsCost) {
    return NextResponse.json(
      { status: false, message: `แต้มไม่พอ ต้องการ ${item.pointsCost} แต้ม คุณมี ${user.points} แต้ม` },
      { status: 400 }
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.user.update({ where: { id: user.id }, data: { points: { decrement: item.pointsCost } } });
    await tx.rewardItem.update({ where: { id: item.id }, data: { stock: { decrement: 1 } } });
    await tx.transaction.create({
      data: { userId: user.id, type: "reward", amount: -item.pointsCost, detail: `แลก ${item.name}` },
    });
    return u;
  });

  return NextResponse.json({ status: true, message: `แลก ${item.name} สำเร็จ ติดต่อแอดมินเพื่อรับรางวัล`, user: publicUser(updated) });
}
