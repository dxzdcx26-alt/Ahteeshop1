import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";

class PurchaseError extends Error {
  constructor(public code: "NOT_FOUND" | "OUT_OF_STOCK" | "INSUFFICIENT_BALANCE" | "INVALID_PRICE") {
    super(code);
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productId = typeof body.id === "string" ? body.id.trim() : "";
  const count = Number(body.count ?? 1);
  if (!productId || !Number.isSafeInteger(count) || count < 1 || count > 99) {
    return NextResponse.json({ status: false, message: "ข้อมูลสินค้า/จำนวนไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.active) throw new PurchaseError("NOT_FOUND");
      if (!Number.isFinite(product.price) || product.price < 0) throw new PurchaseError("INVALID_PRICE");

      const total = product.price * count;
      if (!Number.isFinite(total)) throw new PurchaseError("INVALID_PRICE");

      const items = await tx.productItem.findMany({
        where: { productId: product.id, sold: false },
        take: count,
        orderBy: { createdAt: "asc" },
        select: { id: true, payload: true },
      });
      if (items.length !== count) throw new PurchaseError("OUT_OF_STOCK");

      // Conditional updates prevent two concurrent requests from selling the same stock
      // or spending the same wallet balance. Any failed guard rolls the transaction back.
      const stock = await tx.productItem.updateMany({
        where: { id: { in: items.map((item) => item.id) }, sold: false },
        data: { sold: true },
      });
      if (stock.count !== count) throw new PurchaseError("OUT_OF_STOCK");

      const debit = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: total } },
        data: { balance: { decrement: total } },
      });
      if (debit.count !== 1) throw new PurchaseError("INSUFFICIENT_BALANCE");

      const payloads = items.map((item) => item.payload).join("\n");
      const orderNo = "ORD" + Date.now().toString(36).toUpperCase() + randomBytes(4).toString("hex").toUpperCase();
      await tx.transaction.create({
        data: { userId: user.id, type: "buy", amount: -total, detail: `ซื้อ ${product.name} x${count}` },
      });
      const order = await tx.order.create({
        data: {
          orderNo, userId: user.id, productId: product.id, productName: product.name,
          quantity: count, unitPrice: product.price, total, payloads, status: "success",
        },
      });
      const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      return { order, payloads, updatedUser, productName: product.name, count };
    });

    return NextResponse.json({
      status: true,
      message: `ซื้อสำเร็จ ${result.productName} x${result.count}`,
      order: { orderNo: result.order.orderNo, payloads: result.payloads },
      user: publicUser(result.updatedUser),
    });
  } catch (error) {
    if (error instanceof PurchaseError) {
      const messages = {
        NOT_FOUND: ["ไม่พบสินค้านี้", 404],
        OUT_OF_STOCK: ["สินค้าไม่เพียงพอ กรุณาลองใหม่", 409],
        INSUFFICIENT_BALANCE: ["ยอดเงินไม่เพียงพอ", 400],
        INVALID_PRICE: ["ราคาสินค้าไม่ถูกต้อง กรุณาติดต่อร้านค้า", 409],
      } as const;
      const [message, status] = messages[error.code];
      return NextResponse.json({ status: false, message }, { status });
    }
    console.error("[POST /api/buy] Purchase failed:", error);
    return NextResponse.json({ status: false, message: "ทำรายการไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
