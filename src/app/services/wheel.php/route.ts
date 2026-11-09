import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, verifyCsrf, inboxMsg, tx } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

function pickPrize(prizes: { id: string; label: string; type: string; value: number; weight: number }[]) {
  const total = prizes.reduce((s, p) => s + Math.max(0, p.weight), 0);
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= Math.max(0, p.weight);
    if (r <= 0) return p;
  }
  return prizes[prizes.length - 1];
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: "fail", message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const action = String(form?.get("action") || "spin");
  const csrf = String(form?.get("csrf") || "");
  if (!(await verifyCsrf(req, csrf))) return NextResponse.json({ status: "fail", message: "หมดอายุการใช้งาน กดรีเฟรชแล้วลองอีกครั้ง" }, { status: 403 });

  if (action !== "spin") return NextResponse.json({ status: "fail", message: "คำสั่งไม่ถูกต้อง" }, { status: 400 });

  const id = String(form?.get("id") || "");
  const wheel = await db.wheel.findUnique({ where: { id }, include: { prizes: true } });
  if (!wheel || !wheel.active || wheel.prizes.length < 2) return NextResponse.json({ status: "fail", message: "ไม่พบวงล้อนี้" });

  const fresh = await db.user.findUnique({ where: { id: user.id } });
  if (!fresh) return NextResponse.json({ status: "fail", message: "ไม่พบบัญชี" });
  if (wheel.currency === "points" ? fresh.points < wheel.cost : fresh.balance < wheel.cost)
    return NextResponse.json({ status: "fail", message: wheel.currency === "points" ? "แต้มไม่เพียงพอ" : "ยอดเงินไม่เพียงพอ" });

  const prize = pickPrize(wheel.prizes);
  const idx = wheel.prizes
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .findIndex((p) => p.id === prize.id);

  await db.$transaction(async (txc) => {
    if (wheel.currency === "points") await txc.user.update({ where: { id: fresh.id }, data: { points: { decrement: wheel.cost } } });
    else await txc.user.update({ where: { id: fresh.id }, data: { balance: { decrement: wheel.cost } } });
    if (prize.type === "balance" && prize.value > 0) await txc.user.update({ where: { id: fresh.id }, data: { balance: { increment: prize.value } } });
    if (prize.type === "points" && prize.value > 0) await txc.user.update({ where: { id: fresh.id }, data: { points: { increment: prize.value } } });
    await txc.wheelSpin.create({ data: { wheelId: wheel.id, userId: fresh.id, prize: prize.label, type: prize.type, value: prize.value } });
    await txc.transaction.create({
      data: { userId: fresh.id, type: "wheel", amount: wheel.currency === "balance" ? -(wheel.cost - (prize.type === "balance" ? prize.value : 0)) : 0, detail: `สุ่มวงล้อ ${wheel.name}: ${prize.label}` },
    });
  });

  const msg = prize.type === "none" || prize.value <= 0 ? `เสียใจด้วย คุณได้ "${prize.label}"` : `ยินดีด้วย! คุณได้ "${prize.label}" (+${prize.type === "balance" ? prize.value + " บาท" : prize.value + " แต้ม"})`;
  if (prize.type !== "none" && prize.value > 0) {
    await inboxMsg(user.id, `รางวัลวงล้อ: ${wheel.name}`, msg);
  }
  return NextResponse.json({ status: "success", index: Math.max(0, idx), prize: prize.label, type: prize.type, value: prize.value, message: msg });
}
