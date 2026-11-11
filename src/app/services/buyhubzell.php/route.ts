import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, inboxMsg, orderNo } from "@/lib/auth-extra";
import { createOrder, getProduct, isConfigured } from "@/lib/hubzell";

export const dynamic = "force-dynamic";

function fail(message: string, code = 400) {
  return NextResponse.json({ status: "fail", message }, { status: code });
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return fail("ระบบเติมอัตโนมัติยังไม่พร้อม (ยังไม่ได้ตั้งค่า HubZell)");

  const user = await getSessionUser(req);
  if (!user) return fail("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("ข้อมูลไม่ถูกต้อง");

  const productId = String(form.get("id") || "");
  const serviceId = String(form.get("service_id") || "");
  if (!productId || !serviceId) return fail("ไม่พบสินค้าหรือแพ็กเกจ");

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) return fail("ไม่พบสินค้านี้ในระบบ");
  if (!product.hubzellServiceId && !product.hubzellProductId) {
    return fail("สินค้านี้ยังไม่ได้ผูกกับระบบเติมอัตโนมัติ");
  }

  const input: Record<string, string> = {};
  form.forEach((val, key) => {
    if (key.startsWith("input_") || key === "uid" || key === "server_id" || key === "player_id") {
      const k = key.startsWith("input_") ? key.slice(6) : key;
      input[k] = String(val).trim();
    }
  });
  const inputJson = form.get("input");
  if (inputJson && typeof inputJson === "string") {
    try {
      Object.assign(input, JSON.parse(inputJson));
    } catch {
      /* ignore */
    }
  }

  if (Object.keys(input).length === 0) return fail("กรุณากรอกข้อมูลบัญชีเกม / เบอร์โทร");

  const detail = await getProduct(product.hubzellProductId || product.hubzellServiceId);
  if (detail.status !== 0 || !detail.data) {
    return fail(detail.message || "ไม่สามารถดึงข้อมูลสินค้าจากผู้ให้บริการได้");
  }
  const svc = detail.data.services.find((s) => s.id === serviceId);
  if (!svc) return fail("ไม่พบแพ็กเกจที่เลือก");
  if (!svc.service_available) return fail("แพ็กเกจนี้หมดชั่วคราว กรุณาลองใหม่ภายหลัง");

  const price = svc.price;
  const clientRef = `HZ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);

  const txResult = await db.$transaction(async (txc) => {
    const fresh = await txc.user.findUnique({ where: { id: user.id } });
    if (!fresh) return { err: "ไม่พบบัญชีผู้ใช้" };
    if (fresh.balance < price) return { err: "ยอดเงินไม่เพียงพอ กรุณาเติมเงิน" };

    await txc.user.update({ where: { id: fresh.id }, data: { balance: { decrement: price } } });
    const order = await txc.order.create({
      data: {
        orderNo: orderNo(),
        userId: fresh.id,
        productId: product.id,
        productName: `${product.name} - ${svc.name}`,
        quantity: 1,
        unitPrice: price,
        total: price,
        payloads: "",
        status: "pending",
        hubzellClientRef: clientRef,
        hubzellStatus: "PENDING",
      },
    });
    await txc.transaction.create({
      data: {
        userId: fresh.id,
        type: "buy",
        amount: -price,
        detail: `สั่งซื้อ ${product.name} (${svc.name}) via HubZell`,
      },
    });
    return { order };
  });

  if (txResult.err) return fail(txResult.err);
  const order = txResult.order!;

  const hz = await createOrder({
    service_id: serviceId,
    input,
    client_ref: clientRef,
  });

  if (hz.status !== 0 || !hz.data) {
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { balance: { increment: price } } }),
      db.order.update({
        where: { id: order.id },
        data: { status: "failed", hubzellStatus: hz.code || "FAILED", payloads: hz.message },
      }),
      db.transaction.create({
        data: {
          userId: user.id,
          type: "refund",
          amount: price,
          detail: `คืนเงิน Order ${order.orderNo}: ${hz.message}`,
        },
      }),
    ]);
    return fail(hz.message || "สั่งซื้อไม่สำเร็จ");
  }

  const st = hz.data.status;
  const delivered = (hz.data as any).delivered_content || "";

  if (st === "SUCCESS") {
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "success",
        hubzellStatus: "SUCCESS",
        hubzellTransactionId: hz.data.transaction_id || "",
        payloads: delivered,
      },
    });
    await inboxMsg(
      user.id,
      `เติมสำเร็จ: ${product.name}`,
      `รายการ: ${product.name} - ${svc.name}\nยอดชำระ: ${price} บาท\n\n${delivered || "ดำเนินการสำเร็จ"}`,
      delivered || order.orderNo
    );
    return NextResponse.json({
      status: "success",
      salt: "prize",
      message: `สั่งซื้อสำเร็จ ${price} บาท — ของถูกส่งให้ที่กล่องข้อความ`,
    });
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      hubzellStatus: st,
      hubzellTransactionId: hz.data.transaction_id || "",
    },
  });
  await inboxMsg(
    user.id,
    `กำลังดำเนินการ: ${product.name}`,
    `คำสั่งซื้อ ${order.orderNo} กำลังดำเนินการ\nแพ็กเกจ: ${svc.name}\nยอดชำระ: ${price} บาท\nจะแจ้งผลอีกครั้งเมื่อเสร็จ`,
    ""
  );
  return NextResponse.json({
    status: "success",
    salt: "prize",
    message: `รับออเดอร์แล้ว กำลังดำเนินการ — ติดตามผลที่กล่องข้อความ`,
  });
}
