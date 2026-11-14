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
  const itemId = typeof body.id === "string" ? body.id.trim() : "";
  if (!itemId) return NextResponse.json({ status: false, message: "กรุณาเลือกรางวัล" }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const item = await tx.rewardItem.findUnique({ where: { id: itemId } });
      if (!item || !item.active) throw new Error("REWARD_NOT_FOUND");
      if (!Number.isSafeInteger(item.pointsCost) || item.pointsCost < 0) throw new Error("REWARD_INVALID_COST");

      const stock = await tx.rewardItem.updateMany({
        where: { id: item.id, active: true, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (stock.count !== 1) throw new Error("REWARD_OUT_OF_STOCK");

      const debit = await tx.user.updateMany({
        where: { id: user.id, points: { gte: item.pointsCost } },
        data: { points: { decrement: item.pointsCost } },
      });
      if (debit.count !== 1) throw new Error("REWARD_INSUFFICIENT_POINTS");

      await tx.transaction.create({
        data: { userId: user.id, type: "reward", amount: -item.pointsCost, detail: `แลก ${item.name}` },
      });
      const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      return { item, updatedUser };
    });
    return NextResponse.json({
      status: true,
      message: `แลก ${result.item.name} สำเร็จ ติดต่อแอดมินเพื่อรับรางวัล`,
      user: publicUser(result.updatedUser),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const known: Record<string, [string, number]> = {
      REWARD_NOT_FOUND: ["ไม่พบรางวัลนี้", 404],
      REWARD_INVALID_COST: ["แต้มที่ใช้แลกรางวัลไม่ถูกต้อง", 409],
      REWARD_OUT_OF_STOCK: ["รางวัลนี้หมดแล้ว", 409],
      REWARD_INSUFFICIENT_POINTS: ["แต้มไม่เพียงพอ", 400],
    };
    if (known[code]) {
      const [message, status] = known[code];
      return NextResponse.json({ status: false, message }, { status });
    }
    console.error("[POST /api/rewards] Redemption failed:", error);
    return NextResponse.json({ status: false, message: "แลกรางวัลไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
