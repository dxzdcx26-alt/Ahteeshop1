import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { inboxMsg } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const sigHeader = req.headers.get("x-hubzell-signature") || req.headers.get("X-Hubzell-Signature") || "";
  const secret = process.env.HUBZELL_SECRET_KEY || "";
  if (sigHeader && secret) {
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (expected.toLowerCase() !== sigHeader.toLowerCase()) {
      console.warn("[hubzell-callback] invalid signature");
      return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
    }
  }

  const data = payload.data || payload;
  const clientRef: string = data.client_ref || data.clientRef || "";
  const status: string = (data.status || "").toUpperCase();
  const txnId: string = data.transaction_id || data.transactionId || "";
  const delivered: string =
    data.delivered_content ||
    data.deliveredContent ||
    ([data.cashcard_ref2, data.cashcard_pin].filter(Boolean).join(" / ") || "");
  const failReason: string = data.failure_reason || data.failureReason || payload.message || "";

  if (!clientRef) {
    console.warn("[hubzell-callback] no client_ref", payload);
    return NextResponse.json({ ok: true });
  }

  const order = await db.order.findFirst({ where: { hubzellClientRef: clientRef } });
  if (!order) {
    console.warn("[hubzell-callback] order not found for", clientRef);
    return NextResponse.json({ ok: true });
  }

  const newStatus =
    status === "SUCCESS"
      ? "success"
      : status === "FAILED" || status === "CANCELLED" || status === "REFUNDED"
        ? "failed"
        : status === "PENDING" || status === "SENT"
          ? "pending"
          : order.status;

  await db.order.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      hubzellStatus: status,
      hubzellTransactionId: txnId || order.hubzellTransactionId,
      payloads: delivered || order.payloads,
    },
  });

  if (status === "SUCCESS") {
    const body = delivered
      ? `คำสั่งซื้อ ${order.orderNo} สำเร็จ\n\nรายละเอียด:\n${delivered}`
      : `คำสั่งซื้อ ${order.orderNo} สำเร็จแล้ว`;
    await inboxMsg(order.userId, `เติมสำเร็จ: ${order.productName}`, body, delivered || order.orderNo);
  } else if (status === "FAILED" || status === "CANCELLED") {
    if (order.status !== "failed") {
      await db.$transaction([
        db.user.update({ where: { id: order.userId }, data: { balance: { increment: order.total } } }),
        db.transaction.create({
          data: {
            userId: order.userId,
            type: "refund",
            amount: order.total,
            detail: `คืนเงิน Order ${order.orderNo} (${failReason || status})`,
          },
        }),
      ]);
    }
    await inboxMsg(
      order.userId,
      `เติมไม่สำเร็จ: ${order.productName}`,
      `คำสั่งซื้อ ${order.orderNo} ไม่สำเร็จ\nเหตุผล: ${failReason || status}\nยอดเงินถูกคืนเข้ากระเป๋าแล้ว`,
      ""
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "hubzell-callback" });
}
