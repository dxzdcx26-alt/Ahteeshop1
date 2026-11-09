import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, inboxMsg, tx, orderNo } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

// success → {status:"success", salt:"prize", message}  / fail → 4xx {status:"fail", message}
function fail(message: string, code = 400) {
  return NextResponse.json({ status: "fail", message }, { status: code });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("กรุณาเข้าสู่ระบบก่อนสั่งซื้อสินค้า", 401);

  const form = await req.formData().catch(() => null);
  const id = String(form?.get("id") || "");
  const count = Math.max(1, Math.floor(Number(form?.get("count") || 1)));
  if (!id) return fail("ไม่พบสินค้า");

  const product = await db.product.findUnique({ where: { id } });
  if (!product || !product.active) return fail("ไม่พบสินค้านี้ในระบบ");

  const result = await db.$transaction(async (txc) => {
    const items = await txc.productItem.findMany({ where: { productId: product.id, sold: false }, take: count });
    if (items.length < count) return { err: "สินค้าเหลือไม่พอ (คงเหลือ " + items.length + " ชิ้น)" };
    const fresh = await txc.user.findUnique({ where: { id: user.id } });
    if (!fresh) return { err: "ไม่พบบัญชีผู้ใช้" };
    const total = Math.round(product.price * count * 100) / 100;
    if (fresh.balance < total) return { err: "ยอดเงินไม่เพียงพอ กรุณาเติมเงิน" };
    await txc.user.update({ where: { id: fresh.id }, data: { balance: { decrement: total } } });
    const payloads = items.map((i) => i.payload);
    await txc.productItem.updateMany({ where: { id: { in: items.map((i) => i.id) } }, data: { sold: true } });
    const order = await txc.order.create({
      data: { orderNo: orderNo(), userId: fresh.id, productId: product.id, productName: product.name, quantity: count, unitPrice: product.price, total, payloads: payloads.join("\n"), status: "success" },
    });
    await txc.transaction.create({ data: { userId: fresh.id, type: "buy", amount: -total, detail: `ซื้อ ${product.name} x${count}` } });
    return { order, payloads, total };
  });

  if (result.err) return fail(result.err);
  const payloadTxt = result.payloads!.join("\n");
  await Promise.all([
    inboxMsg(user.id, `สั่งซื้อสำเร็จ: ${product.name} x${count}`, `รายการ: ${product.name} x${count}\nยอดชำระ: ${result.total} บาท\n\nของที่ได้รับ:\n${payloadTxt}`, payloadTxt),
    tx(user.id, "order", -result.total!, `Order ${result.order!.orderNo}`),
  ]);
  return NextResponse.json({ status: "success", salt: "prize", message: `สั่งซื้อ ${product.name} x${count} สำเร็จ ราคา ${result.total} บาท — ของถูกส่งให้ที่กล่องข้อความและประวัติการซื้อ` });
}
