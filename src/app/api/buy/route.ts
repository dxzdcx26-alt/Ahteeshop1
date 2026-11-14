import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productId = typeof body.id === "string" ? body.id.trim() : "";
  const countValue = Number(body.count ?? 1);
  if (!productId || !Number.isInteger(countValue) || countValue < 1 || countValue > 99) {
    return NextResponse.json({ status: false, message: "ข้อมูลสินค้าไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.active) throw new Error("PRODUCT_NOT_FOUND");
      if (!Number.isFinite(product.price) || product.price < 0) throw new Error("INVALID_PRODUCT_PRICE");

      const total = product.price * countValue;
      if (!Number.isFinite(total) || total <= 0) throw new Error("INVALID_TOTAL");

      const items = await tx.productItem.findMany({
        where: { productId: product.id, sold: false },
        take: countValue,
        orderBy: { createdAt: "asc" },
        select: { id: true, payload: true },
      });
      if (items.length !== countValue) throw new Error("INSUFFICIENT_STOCK");

      // Reserve the exact rows conditionally so concurrent buyers cannot sell them twice.
      const reserved = await tx.productItem.updateMany({
        where: { id: { in: items.map((item) => item.id) }, sold: false },
        data: { sold: true },
      });
      if (reserved.count !== countValue) throw new Error("STOCK_RACE");

      // Debit only if the current database balance still covers the purchase.
      const debited = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: total } },
        data: { balance: { decrement: total } },
      });
      if (debited.count !== 1) throw new Error("INSUFFICIENT_BALANCE");

      const updatedUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!updatedUser) throw new Error("USER_NOT_FOUND");

      const payloads = items.map((item) => item.payload).join("\n");
      const orderNo = "ORD" + Date.now().toString(36).toUpperCase() + randomBytes(5).toString("hex").toUpperCase();
      const order = await tx.order.create({
        data: {
          orderNo,
          userId: user.id,
          productId: product.id,
          productName: product.name,
          quantity: countValue,
          unitPrice: product.price,
          total,
          payloads,
          status: "success",
        },
        select: { orderNo: true },
      });
      await tx.transaction.create({
        data: { userId: user.id, type: "buy", amount: -total, detail: `ซื้อ ${product.name} x${countValue}` },
      });

      return { order, payloads, updatedUser, productName: product.name };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({
      status: true,
      message: `ซื้อสำเร็จ ${result.productName} x${countValue}`,
      order: { orderNo: result.order.orderNo, payloads: result.payloads },
      user: publicUser(result.updatedUser),
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : "";
    if (message === "PRODUCT_NOT_FOUND") return NextResponse.json({ status: false, message: "ไม่พบสินค้านี้" }, { status: 404 });
    if (message === "INSUFFICIENT_STOCK") return NextResponse.json({ status: false, message: "สินค้าไม่เพียงพอ" }, { status: 409 });
    if (message === "INSUFFICIENT_BALANCE") return NextResponse.json({ status: false, message: "ยอดเงินไม่เพียงพอ" }, { status: 400 });
    if (message === "INVALID_PRODUCT_PRICE" || message === "INVALID_TOTAL") return NextResponse.json({ status: false, message: "ราคาสินค้าไม่ถูกต้อง" }, { status: 409 });
    if (message === "STOCK_RACE" || code === "P2034" || code === "P2002") {
      return NextResponse.json({ status: false, message: "มีรายการซื้อพร้อมกัน กรุณาลองใหม่" }, { status: 409 });
    }
    throw error;
  }
}
