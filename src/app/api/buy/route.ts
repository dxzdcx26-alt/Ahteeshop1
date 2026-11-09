import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productId = String(body.id || "");
  const count = Math.max(1, Math.min(99, parseInt(String(body.count || "1"), 10) || 1));

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { items: { where: { sold: false } } } } },
  });
  if (!product || !product.active) {
    return NextResponse.json({ status: false, message: "ไม่พบสินค้านี้" }, { status: 404 });
  }
  if (product._count.items < count) {
    return NextResponse.json(
      { status: false, message: `สินค้าไม่เพียงพอ (เหลือ ${product._count.items} ชิ้น)` },
      { status: 400 }
    );
  }
  const total = product.price * count;
  if (user.balance < total) {
    return NextResponse.json(
      { status: false, message: `ยอดเงินไม่เพียงพอ ต้องการ ${total} บาท คุณมี ${user.balance} บาท` },
      { status: 400 }
    );
  }

  const items = await db.productItem.findMany({
    where: { productId: product.id, sold: false },
    take: count,
    orderBy: { createdAt: "asc" },
  });

  const orderNo = "ORD" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100);
  const payloads = items.map((i) => i.payload).join("\n");

  const order = await db.$transaction(async (tx) => {
    for (const item of items) {
      await tx.productItem.update({ where: { id: item.id }, data: { sold: true } });
    }
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: total } },
    });
    await tx.transaction.create({
      data: { userId: user.id, type: "buy", amount: -total, detail: `ซื้อ ${product.name} x${count}` },
    });
    return tx.order.create({
      data: {
        orderNo,
        userId: user.id,
        productId: product.id,
        productName: product.name,
        quantity: count,
        unitPrice: product.price,
        total,
        payloads,
        status: "success",
      },
    }).then(async (o) => ({ o, updated }));
  });

  return NextResponse.json({
    status: true,
    message: `ซื้อสำเร็จ ${product.name} x${count}`,
    order: { orderNo: order.o.orderNo, payloads },
    user: publicUser(order.updated),
  });
}
