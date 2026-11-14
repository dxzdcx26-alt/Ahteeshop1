import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getSettings } from "@/lib/site";

function pickWeighted<T extends { weight: number }>(prizes: T[]): T {
  const total = prizes.reduce((sum, prize) => sum + prize.weight, 0);
  let value = randomInt(total);
  for (const prize of prizes) {
    value -= prize.weight;
    if (value < 0) return prize;
  }
  return prizes[prizes.length - 1];
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const settings = await getSettings();
  const cost = Number.parseInt(settings.wheelCostPoints || "0", 10);
  const prizes = await db.wheelPrize.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, color: true },
  });

  return NextResponse.json({
    status: true,
    points: user.points,
    cost: Number.isInteger(cost) && cost >= 0 ? cost : 0,
    prizes,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const settings = await getSettings();
  const cost = Number.parseInt(settings.wheelCostPoints || "0", 10);
  if (!Number.isInteger(cost) || cost < 0) {
    return NextResponse.json({ status: false, message: "ตั้งค่าค่าใช้จ่ายวงล้อไม่ถูกต้อง" }, { status: 503 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const prizes = await tx.wheelPrize.findMany({ orderBy: { sortOrder: "asc" } });
      if (prizes.length < 2 || prizes.some((p) => !Number.isInteger(p.weight) || p.weight <= 0 || !Number.isFinite(p.value) || p.value < 0)) {
        throw new Error("WHEEL_NOT_READY");
      }
      const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
      if (!Number.isSafeInteger(totalWeight) || totalWeight <= 0) throw new Error("WHEEL_NOT_READY");

      const debited = await tx.user.updateMany({
        where: { id: user.id, points: { gte: cost } },
        data: { points: { decrement: cost } },
      });
      if (debited.count !== 1) throw new Error("INSUFFICIENT_POINTS");

      const prize = pickWeighted(prizes);
      let message = prize.label;
      if (prize.type === "balance" && prize.value > 0) {
        await tx.user.update({ where: { id: user.id }, data: { balance: { increment: prize.value } } });
        message = `คุณได้รับ ${prize.value} บาท`;
      } else if (prize.type === "points" && prize.value > 0) {
        const points = Math.floor(prize.value);
        if (points > 0) {
          await tx.user.update({ where: { id: user.id }, data: { points: { increment: points } } });
          message = `คุณได้รับ ${points} แต้ม`;
        }
      }

      await tx.wheelSpin.create({
        data: {
          wheelId: prize.wheelId,
          userId: user.id,
          prize: prize.label,
          type: prize.type,
          value: prize.value,
        },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "wheel",
          amount: prize.type === "none" ? 0 : prize.value,
          detail: prize.type === "none" ? "ไม่ได้รางวัล" : prize.label,
        },
      });

      const updatedUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!updatedUser) throw new Error("USER_NOT_FOUND");
      return { prize, message, updatedUser };
    }, { isolationLevel: "Serializable" });

    const prizes = await db.wheelPrize.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true } });
    return NextResponse.json({
      status: true,
      index: prizes.findIndex((prize) => prize.id === result.prize.id),
      prize: { label: result.prize.label, type: result.prize.type, value: result.prize.value },
      message: result.message,
      user: publicUser(result.updatedUser),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : "";
    if (message === "WHEEL_NOT_READY") return NextResponse.json({ status: false, message: "วงล้อยังไม่พร้อม" }, { status: 503 });
    if (message === "INSUFFICIENT_POINTS") return NextResponse.json({ status: false, message: "แต้มไม่เพียงพอ" }, { status: 400 });
    if (code === "P2034") return NextResponse.json({ status: false, message: "มีรายการหมุนพร้อมกัน กรุณาลองใหม่" }, { status: 409 });
    throw error;
  }
}
