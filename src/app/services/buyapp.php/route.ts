import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, verifyCsrf, inboxMsg, orderNo } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: "fail", message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ status: "fail", message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const csrf = String(form.get("csrf") || "");
  if (!(await verifyCsrf(req, csrf))) return NextResponse.json({ status: "fail", message: "หมดอายุ ลองอีกครั้ง" }, { status: 403 });

  const id = String(form.get("id") || "").trim();
  if (!id) return NextResponse.json({ status: "fail", message: "กรุณาเลือกสินค้า" }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const app = await tx.appProduct.findFirst({ where: { OR: [{ id }, { extId: Number(id) || -1 }] } });
      if (!app || !app.active) throw new Error("APP_NOT_FOUND");
      if (!Number.isFinite(app.price) || app.price < 0) throw new Error("APP_INVALID_PRICE");

      const stock = await tx.appProduct.updateMany({
        where: { id: app.id, active: true, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (stock.count !== 1) throw new Error("APP_OUT_OF_STOCK");

      const debit = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: app.price } },
        data: { balance: { decrement: app.price } },
      });
      if (debit.count !== 1) throw new Error("APP_INSUFFICIENT_BALANCE");

      const no = orderNo("APP");
      const payload = app.detail || "";
      await tx.appOrder.create({
        data: { orderNo: no, userId: user.id, appId: app.id, appName: app.name, total: app.price, payload, status: "success" },
      });
      await tx.transaction.create({
        data: { userId: user.id, type: "buyapp", amount: -app.price, detail: `ซื้อแอพ ${app.name}` },
      });
      return { no, app, payload };
    });

    await inboxMsg(
      user.id,
      `สั่งซื้อสำเร็จ: ${result.app.name}`,
      `รายการ: ${result.app.name}\nยอดชำระ: ${result.app.price} บาท\nOrder: ${result.no}\n\nข้อมูลที่ได้รับ:\n${result.payload || "ติดต่อร้านเพื่อรับข้อมูล"}`,
      result.payload
    );
    return NextResponse.json({ status: "success", message: `สั่งซื้อ ${result.app.name} สำเร็จ — ข้อมูลถูกส่งไปที่กล่องข้อความและหน้า แอพ Premium` });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const known: Record<string, [string, number]> = {
      APP_NOT_FOUND: ["ไม่พบแอพนี้", 404],
      APP_INVALID_PRICE: ["ราคาสินค้าไม่ถูกต้อง กรุณาติดต่อร้านค้า", 409],
      APP_OUT_OF_STOCK: ["สินค้าหมดแล้ว", 409],
      APP_INSUFFICIENT_BALANCE: ["ยอดเงินไม่เพียงพอ กรุณาเติมเงิน", 400],
    };
    if (known[code]) {
      const [message, status] = known[code];
      return NextResponse.json({ status: "fail", message }, { status });
    }
    console.error("[POST /services/buyapp.php] Purchase failed:", error);
    return NextResponse.json({ status: "fail", message: "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
