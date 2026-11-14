import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getSettings } from "@/lib/site";

function pickWeighted<T extends { id: string; weight: number }>(prizes: T[]): T {
  const total = prizes.reduce((sum, prize) => sum + prize.weight, 0);
  if (!Number.isSafeInteger(total) || total <= 0 || total >= 2 ** 48) {
    throw new Error("WHEEL_INVALID_WEIGHTS");
  }
  let cursor = randomInt(total);
  for (const prize of prizes) {
    cursor -= prize.weight;
    if (cursor < 0) return prize;
  }
  throw new Error("WHEEL_INVALID_WEIGHTS");
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const [settings, prizes] = await Promise.all([
    getSettings(),
    db.wheelPrize.findMany({ where: { weight: { gt: 0 } }, orderBy: { sortOrder: "asc" } }),
  ]);
  return NextResponse.json({
    status: true,
    points: user.points,
    cost: Math.max(0, Number.parseInt(settings.wheelCostPoints || "0", 10) || 0),
    prizes: prizes.map((prize) => ({ id: prize.id, label: prize.label, color: prize.color })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const settings = await getSettings();
  const cost = Number.parseInt(settings.wheelCostPoints || "0", 10);
  if (!Number.isSafeInteger(cost) || cost < 0) {
    return NextResponse.json({ status: false, message: "ตั้งค่าค่าใช้จ่ายวงล้อไม่ถูกต้อง" }, { status: 503 });
  }

  const prizes = await db.wheelPrize.findMany({ where: { weight: { gt: 0 } }, orderBy: { sortOrder: "asc" } });
  if (prizes.length < 2) {
    return NextResponse.json({ status: false, message: "วงล้อยังไม่พร้อม" }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: { id: user.id, points: { gte: cost } },
        data: { points: { decrement: cost } },
      });
      if (debit.count !== 1) throw new Error("WHEEL_INSUFFICIENT_POINTS");

      const prize = pickWeighted(prizes);
      if (prize.type === "balance" && prize.value > 0) {
        await tx.user.update({ where: { id: user.id }, data: { balance: { increment: prize.value } } });
      } else if (prize.type === "points" && prize.value > 0) {
        await tx.user.update({ where: { id: user.id }, data: { points: { increment: prize.value } } });
      }

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "wheel",
          amount: prize.value,
          detail: prize.type === "none" ? "ไม่ได้รางวัล" : prize.label,
        },
      });
      const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      return { prize, updatedUser };
    });

    return NextResponse.json({
      status: true,
      index: prizes.findIndex((prize) => prize.id === result.prize.id),
      prize: { label: result.prize.label, type: result.prize.type, value: result.prize.value },
      message: result.prize.type === "none" ? result.prize.label :
        result.prize.type === "balance" ? `คุณได้รับ ${result.prize.value} บาท` :
        result.prize.type === "points" ? `คุณได้รับ ${result.prize.value} แต้ม` : result.prize.label,
      user: publicUser(result.updatedUser),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "WHEEL_INSUFFICIENT_POINTS") {
      return NextResponse.json({ status: false, message: "แต้มไม่เพียงพอ" }, { status: 400 });
    }
    if (code === "WHEEL_INVALID_WEIGHTS") {
      return NextResponse.json({ status: false, message: "การตั้งค่าน้ำหนักรางวัลไม่ถูกต้อง" }, { status: 409 });
    }
    console.error("[POST /api/wheel] Spin failed:", error);
    return NextResponse.json({ status: false, message: "สุ่มวงล้อไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
