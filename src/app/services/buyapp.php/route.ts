import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, verifyCsrf, inboxMsg, orderNo } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: "fail", message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const csrf = String(form?.get("csrf") || "");
  if (!(await verifyCsrf(req, csrf))) return NextResponse.json({ status: "fail", message: "หมดอายุ ลองอีกครั้ง" }, { status: 403 });

  const id = String(form?.get("id") || "");
  const app = await db.appProduct.findFirst({ where: { OR: [{ id }, { extId: Number(id) || -1 }] } });
  if (!app || !app.active) return NextResponse.json({ status: "fail", message: "ไม่พบแอพนี้" });
  if (app.stock <= 0) return NextResponse.json({ status: "fail", message: "สินค้าหมด" });

  const fresh = await db.user.findUnique({ where: { id: user.id } });
  if (!fresh) return NextResponse.json({ status: "fail", message: "ไม่พบบัญชี" });
  if (fresh.balance < app.price) return NextResponse.json({ status: "fail", message: "ยอดเงินไม่เพียงพอ กรุณาเติมเงิน" });

  const payload = app.detail || "";
  const no = orderNo("APP");
  await db.$transaction(async (txc) => {
    const still = await txc.appProduct.findUnique({ where: { id: app.id } });
    if (!still || still.stock <= 0) throw new Error("out");
    await txc.appProduct.update({ where: { id: app.id }, data: { stock: { decrement: 1 } } });
    await txc.user.update({ where: { id: fresh.id }, data: { balance: { decrement: app.price } } });
    await txc.appOrder.create({ data: { orderNo: no, userId: fresh.id, appId: app.id, appName: app.name, total: app.price, payload, status: "success" } });
    await txc.transaction.create({ data: { userId: fresh.id, type: "buyapp", amount: -app.price, detail: `ซื้อแอพ ${app.name}` } });
  });
  await inboxMsg(user.id, `สั่งซื้อสำเร็จ: ${app.name}`, `รายการ: ${app.name}\nยอดชำระ: ${app.price} บาท\nOrder: ${no}\n\nข้อมูลที่ได้รับ:\n${payload || "ติดต่อร้านเพื่อรับข้อมูล"}`, payload);
  return NextResponse.json({ status: "success", message: `สั่งซื้อ ${app.name} สำเร็จ — ข้อมูลถูกส่งไปที่กล่องข้อความและหน้า แอพ Premium` });
}
