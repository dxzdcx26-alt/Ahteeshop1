import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const items = await db.rewardItem.findMany({
    where: { active: true },
    orderBy: { pointsCost: "asc" },
    select: { id: true, name: true, detail: true, image: true, pointsCost: true, stock: true },
  });
  return NextResponse.json({ status: true, points: user.points, items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const itemId = typeof body.id === "string" ? body.id.trim() : "";
  if (!itemId) return NextResponse.json({ status: false, message: "กรุณาเลือกรางวัล" }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const item = await tx.rewardItem.findUnique({ where: { id: itemId } });
      if (!item || !item.active) throw new Error("REWARD_NOT_FOUND");
      if (!Number.isInteger(item.pointsCost) || item.pointsCost < 0) throw new Error("INVALID_REWARD_COST");

      const debited = await tx.user.updateMany({
        where: { id: user.id, points: { gte: item.pointsCost } },
        data: { points: { decrement: item.pointsCost } },
      });
      if (debited.count !== 1) throw new Error("INSUFFICIENT_POINTS");

      const reserved = await tx.rewardItem.updateMany({
        where: { id: item.id, active: true, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (reserved.count !== 1) throw new Error("REWARD_OUT_OF_STOCK");

      await tx.transaction.create({
        data: { userId: user.id, type: "reward", amount: -item.pointsCost, detail: `แลก ${item.name}` },
      });
      const updatedUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!updatedUser) throw new Error("USER_NOT_FOUND");
      return { itemName: item.name, updatedUser };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({
      status: true,
      message: `แลก ${result.itemName} สำเร็จ ติดต่อแอดมินเพื่อรับรางวัล`,
      user: publicUser(result.updatedUser),
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : "";
    if (message === "REWARD_NOT_FOUND") return NextResponse.json({ status: false, message: "ไม่พบรางวัลนี้" }, { status: 404 });
    if (message === "INVALID_REWARD_COST") return NextResponse.json({ status: false, message: "แต้มที่ใช้แลกรางวัลไม่ถูกต้อง" }, { status: 409 });
    if (message === "INSUFFICIENT_POINTS") return NextResponse.json({ status: false, message: "แต้มไม่เพียงพอ" }, { status: 400 });
    if (message === "REWARD_OUT_OF_STOCK" || code === "P2034") return NextResponse.json({ status: false, message: "รางวัลหมดหรือมีผู้แลกพร้อมกัน กรุณาลองใหม่" }, { status: 409 });
    throw error;
  }
}
