import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ status: false, message: "ไม่ได้รับอนุญาต" }, { status: 403 });

  const [members, categories, products, orders, topups, announcements, settings, wheel, rewards, soldCount, itemsTotal] =
    await Promise.all([
      db.user.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, username: true, role: true, balance: true, points: true, createdAt: true } }),
      db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
      db.product.findMany({ orderBy: { createdAt: "desc" }, include: { category: true, _count: { select: { items: { where: { sold: false } } } } } }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      db.topupRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { username: true } } } }),
      db.announcement.findMany({ orderBy: { createdAt: "desc" } }),
      (await import("@/lib/site")).getSettings(),
      db.wheelPrize.findMany({ orderBy: { sortOrder: "asc" } }),
      db.rewardItem.findMany({ orderBy: { pointsCost: "asc" } }),
      db.productItem.count({ where: { sold: true } }),
      db.productItem.count(),
    ]);

  return NextResponse.json({
    status: true,
    members,
    categories,
    products,
    orders,
    topups,
    announcements,
    settings,
    wheel,
    rewards,
    items: { sold: soldCount, total: itemsTotal },
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ status: false, message: "ไม่ได้รับอนุญาต" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  try {
    switch (action) {
      case "category.save": {
        const data = {
          name: String(body.name || "").trim(),
          detail: String(body.detail || ""),
          image: String(body.image || ""),
          sortOrder: parseInt(String(body.sortOrder || "0"), 10) || 0,
        };
        if (!data.name) return NextResponse.json({ status: false, message: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });
        if (body.id) await db.category.update({ where: { id: String(body.id) }, data });
        else await db.category.create({ data });
        return NextResponse.json({ status: true, message: "บันทึกหมวดหมู่แล้ว" });
      }
      case "category.delete":
        await db.category.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ status: true, message: "ลบหมวดหมู่แล้ว" });

      case "product.save": {
        const data = {
          categoryId: String(body.categoryId || ""),
          name: String(body.name || "").trim(),
          detail: String(body.detail || ""),
          image: String(body.image || ""),
          price: parseFloat(String(body.price || "0")) || 0,
          featured: Boolean(body.featured),
          active: body.active === undefined ? true : Boolean(body.active),
        };
        if (!data.name || !data.categoryId)
          return NextResponse.json({ status: false, message: "กรุณาระบุชื่อสินค้าและหมวดหมู่" }, { status: 400 });
        if (body.id) await db.product.update({ where: { id: String(body.id) }, data });
        else await db.product.create({ data });
        return NextResponse.json({ status: true, message: "บันทึกสินค้าแล้ว" });
      }
      case "product.delete":
        await db.product.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ status: true, message: "ลบสินค้าแล้ว" });

      case "stock.add": {
        const productId = String(body.productId || "");
        const payloads = String(body.payloads || "")
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (!productId || payloads.length === 0)
          return NextResponse.json({ status: false, message: "กรุณาระบุรหัสสินค้าอย่างน้อย 1 บรรทัด" }, { status: 400 });
        await db.productItem.createMany({ data: payloads.map((payload) => ({ productId, payload })) });
        return NextResponse.json({ status: true, message: `เพิ่มสต๊อก ${payloads.length} ชิ้นแล้ว` });
      }

      case "topup.process": {
        const id = String(body.id || "");
        const approve = Boolean(body.approve);
        const t = await db.topupRequest.findUnique({ where: { id } });
        if (!t || t.status !== "pending")
          return NextResponse.json({ status: false, message: "รายการนี้ถูกดำเนินการแล้ว" }, { status: 400 });
        await db.$transaction(async (tx) => {
          await tx.topupRequest.update({
            where: { id },
            data: { status: approve ? "approved" : "rejected", processedAt: new Date(), adminNote: String(body.note || "") },
          });
          if (approve) {
            await tx.user.update({ where: { id: t.userId }, data: { balance: { increment: t.amount } } });
            await tx.transaction.create({
              data: { userId: t.userId, type: "topup", amount: t.amount, detail: `เติมเงิน ${t.amount} บาท` },
            });
          }
        });
        return NextResponse.json({ status: true, message: approve ? "อนุมัติเติมเงินแล้ว" : "ปฏิเสธรายการแล้ว" });
      }

      case "announcement.save": {
        const text = String(body.text || "").trim();
        if (body.id) {
          await db.announcement.update({ where: { id: String(body.id) }, data: { text, active: Boolean(body.active) } });
        } else if (text) {
          await db.announcement.create({ data: { text } });
        }
        return NextResponse.json({ status: true, message: "บันทึกประกาศแล้ว" });
      }
      case "announcement.delete":
        await db.announcement.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ status: true, message: "ลบประกาศแล้ว" });

      case "settings.save": {
        const entries = (body.settings || {}) as Record<string, string>;
        for (const [key, value] of Object.entries(entries)) {
          await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
        }
        return NextResponse.json({ status: true, message: "บันทึกการตั้งค่าแล้ว" });
      }

      case "wheel.save": {
        const prizes = (body.prizes || []) as { id?: string; label: string; type: string; value: number; weight: number; color: string; sortOrder: number }[];
        for (const [i, p] of prizes.entries()) {
          const data = {
            label: String(p.label || "").trim(),
            type: String(p.type || "none"),
            value: parseFloat(String(p.value || "0")) || 0,
            weight: Math.max(0, parseInt(String(p.weight || "10"), 10) || 0),
            color: String(p.color || "#d4af37"),
            sortOrder: i + 1,
          };
          if (!data.label) continue;
          if (p.id) await db.wheelPrize.update({ where: { id: p.id }, data });
          else await db.wheelPrize.create({ data });
        }
        return NextResponse.json({ status: true, message: "บันทึกวงล้อแล้ว" });
      }
      case "wheel.delete":
        await db.wheelPrize.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ status: true, message: "ลบรางวัลแล้ว" });

      case "reward.save": {
        const data = {
          name: String(body.name || "").trim(),
          detail: String(body.detail || ""),
          image: String(body.image || ""),
          pointsCost: parseInt(String(body.pointsCost || "0"), 10) || 0,
          stock: parseInt(String(body.stock || "0"), 10) || 0,
        };
        if (!data.name) return NextResponse.json({ status: false, message: "กรุณาระบุชื่อรางวัล" }, { status: 400 });
        if (body.id) await db.rewardItem.update({ where: { id: String(body.id) }, data });
        else await db.rewardItem.create({ data });
        return NextResponse.json({ status: true, message: "บันทึกรางวัลแล้ว" });
      }
      case "reward.delete":
        await db.rewardItem.delete({ where: { id: String(body.id) } });
        return NextResponse.json({ status: true, message: "ลบรางวัลแล้ว" });

      default:
        return NextResponse.json({ status: false, message: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ status: false, message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
