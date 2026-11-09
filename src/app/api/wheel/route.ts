import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getSettings } from "@/lib/site";

function pickWeighted<T extends { id: string; weight: number }>(prizes: T[]): T {
  const total = prizes.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return prizes[prizes.length - 1];
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const [settings, prizes, spins] = await Promise.all([
    getSettings(),
    db.wheelPrize.findMany({ orderBy: { sortOrder: "asc" } }),
    db.transaction.count({ where: { userId: user.id, type: "wheel", detail: { not: "ไม่ได้รางวัล" } } }),
  ]);

  return NextResponse.json({
    status: true,
    points: user.points,
    cost: parseInt(settings.wheelCostPoints || "0", 10),
    prizes: prizes.map((p) => ({ id: p.id, label: p.label, color: p.color })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const settings = await getSettings();
  const cost = parseInt(settings.wheelCostPoints || "0", 10);

  const prizes = await db.wheelPrize.findMany({ orderBy: { sortOrder: "asc" } });
  if (prizes.length < 2) {
    return NextResponse.json({ status: false, message: "วงล้อยังไม่พร้อม" }, { status: 400 });
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: { points: { decrement: cost } },
    });
    const prize = pickWeighted(prizes);

    let message = prize.label;
    if (prize.type === "balance" && prize.value > 0) {
      await tx.user.update({ where: { id: user.id }, data: { balance: { increment: prize.value } } });
      message = `คุณได้รับ ${prize.value} บาท`;
    } else if (prize.type === "points" && prize.value > 0) {
      await tx.user.update({ where: { id: user.id }, data: { points: { increment: prize.value } } });
      message = `คุณได้รับ ${prize.value} แต้ม`;
    }

    await tx.transaction.create({
      data: { userId: user.id, type: "wheel", amount: prize.value, detail: prize.type === "none" ? "ไม่ได้รางวัล" : prize.label },
    });

    return { u, prize, message };
  });

  const index = prizes.findIndex((p) => p.id === updated.prize.id);

  return NextResponse.json({
    status: true,
    index,
    prize: { label: updated.prize.label, type: updated.prize.type, value: updated.prize.value },
    message: updated.message,
    user: publicUser(updated.u),
  });
}
