import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getSessionUser, verifyCsrf, inboxMsg, tx } from "@/lib/auth-extra";
import { getSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

const j = (o: object, code = 200) => NextResponse.json(o, { status: code });

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return j({ status: "fail", message: "ไม่มีสิทธิ์เข้าถึง" }, 403);
  const form = await req.formData().catch(() => null);
  if (!form) return j({ status: "fail", message: "ข้อมูลไม่ถูกต้อง" }, 400);
  const csrf = String(form.get("csrf") || "");
  if (!(await verifyCsrf(req, csrf))) return j({ status: "fail", message: "หมดอายุ ลองอีกครั้ง" }, 403);

  const action = String(form.get("action") || "");
  const id = String(form.get("id") || "");
  const s = (k: string, d = "") => String(form.get(k) ?? d).trim();
  const n = (k: string, d = 0) => { const v = Number(form.get(k)); return Number.isFinite(v) ? v : d; };
  const b = (k: string) => form.get(k) === "true" || form.get(k) === "on" || form.get(k) === "1";

  try {
    switch (action) {
      case "cat_save": {
        const data = { name: s("name"), detail: s("detail"), image: s("image"), sortOrder: Math.floor(n("sortOrder")), active: b("active") };
        if (!data.name) return j({ status: "fail", message: "กรุณากรอกชื่อหมวด" });
        if (id) await db.category.update({ where: { id }, data });
        else await db.category.create({ data });
        return j({ status: "success" });
      }
      case "cat_del":
        await db.category.deleteMany({ where: { id } });
        return j({ status: "success" });
      case "prod_save": {
        const data = { categoryId: s("categoryId"), name: s("name"), detail: s("detail"), price: n("price"), image: s("image"), featured: b("featured"), active: b("active") };
        if (!data.name || !data.categoryId) return j({ status: "fail", message: "กรุณากรอกชื่อและเลือกหมวด" });
        if (id) await db.product.update({ where: { id }, data });
        else await db.product.create({ data });
        return j({ status: "success" });
      }
      case "prod_del":
        await db.product.deleteMany({ where: { id } });
        return j({ status: "success" });
      case "stock_add": {
        const lines = s("items").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
        if (!lines.length) return j({ status: "fail", message: "ไม่มีรายการไอเทม" });
        await db.productItem.createMany({ data: lines.map((payload) => ({ productId: id, payload })) });
        return j({ status: "success", added: lines.length });
      }
      case "app_save": {
        const data = { name: s("name"), price: n("price"), stock: Math.max(0, Math.floor(n("stock"))), image: s("image"), detail: s("detail"), active: b("active") };
        if (!data.name) return j({ status: "fail", message: "กรุณากรอกชื่อแอพ" });
        if (id) await db.appProduct.update({ where: { id }, data });
        else await db.appProduct.create({ data: { ...data, extId: Date.now() % 100000 } });
        return j({ status: "success" });
      }
      case "app_del":
        await db.appProduct.deleteMany({ where: { id } });
        return j({ status: "success" });
      case "topup_ok":
      case "topup_no": {
        const t = await db.topupRequest.findUnique({ where: { id }, include: { user: true } });
        if (!t) return j({ status: "fail", message: "ไม่พบรายการ" });
        if (t.status !== "pending") return j({ status: "fail", message: "รายการนี้ถูกดำเนินการแล้ว" });
        const approve = action === "topup_ok";
        const note = s("note");
        const credit = form.has("amount") && n("amount") > 0 ? n("amount") : t.amount;
        if (approve && (!Number.isFinite(credit) || credit <= 0 || credit > 1000000)) return j({ status: "fail", message: "จำนวนเงินไม่ถูกต้อง" }, 400);
        const processed = await db.$transaction(async (txc) => {
          const claimed = await txc.topupRequest.updateMany({
            where: { id, status: "pending" },
            data: { status: approve ? "approved" : "rejected", adminNote: note, processedAt: new Date() },
          });
          if (claimed.count !== 1) return false;
          if (approve && credit > 0) {
            await txc.user.update({ where: { id: t.userId }, data: { balance: { increment: credit }, points: { increment: Math.floor(credit / 10) } } });
            await txc.transaction.create({ data: { userId: t.userId, type: "topup", amount: credit, detail: `เติมเงินผ่าน ${t.method} (อนุมัติโดยแอดมิน)` } });
          }
          return true;
        });
        if (!processed) return j({ status: "fail", message: "รายการนี้ถูกดำเนินการแล้ว" }, 409);
        await inboxMsg(t.userId, approve ? "เติมเงินสำเร็จ" : "รายการเติมเงินถูกปฏิเสธ", approve ? `เติมเงิน ${credit} บาท สำเร็จ${note ? "\nหมายเหตุ: " + note : ""}` : `รายการเติมเงิน ${t.amount} บาท ถูกปฏิเสธ${note ? "\nหมายเหตุ: " + note : ""}`);
        return j({ status: "success" });
      }
      case "code_gen": {
        const amount = n("amount");
        const count = Math.min(100, Math.max(1, Math.floor(n("count", 1))));
        if (amount <= 0) return j({ status: "fail", message: "จำนวนเงินต้องมากกว่า 0" });
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
          const code = ("AHT" + randomBytes(5).toString("hex")).toUpperCase();
          await db.redeemCode.create({ data: { code, amount } });
          codes.push(code);
        }
        return j({ status: "success", codes });
      }
      case "code_del":
        await db.redeemCode.deleteMany({ where: { id, used: false } });
        return j({ status: "success" });
      case "rw_save": {
        const data = { name: s("name"), detail: s("detail"), image: s("image"), pointsCost: Math.floor(n("pointsCost")), stock: Math.max(0, Math.floor(n("stock"))), active: b("active") };
        if (!data.name) return j({ status: "fail", message: "กรุณากรอกชื่อรางวัล" });
        if (id) await db.rewardItem.update({ where: { id }, data });
        else await db.rewardItem.create({ data });
        return j({ status: "success" });
      }
      case "rw_del":
        await db.rewardItem.deleteMany({ where: { id } });
        return j({ status: "success" });
      case "wh_save": {
        const name = s("name");
        if (!name) return j({ status: "fail", message: "กรุณากรอกชื่อวงล้อ" });
        const prizes = s("prizes")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line, i) => {
            const [label, tv, weight, color] = line.split("|").map((x) => x.trim());
            const tmatch = (tv || "none:0").match(/^(balance|points|none):(-?[\d.]+)$/);
            return { label: label || "ช่อง " + (i + 1), type: tmatch ? tmatch[1] : "none", value: tmatch ? Number(tmatch[2]) : 0, weight: Math.max(0, Math.floor(Number(weight) || 10)), color: color || "#d4af37", sortOrder: i };
          });
        if (prizes.length < 2) return j({ status: "fail", message: "วงล้อต้องมีอย่างน้อย 2 ช่องรางวัล" });
        const wdata = { name, cost: Math.max(0, n("cost")), currency: s("currency", "balance") === "points" ? "points" : "balance", active: b("active") };
        if (id) {
          await db.wheel.update({ where: { id }, data: wdata });
          await db.wheelPrize.deleteMany({ where: { wheelId: id } });
          await db.wheelPrize.createMany({ data: prizes.map((p) => ({ ...p, wheelId: id })) });
        } else {
          const w = await db.wheel.create({ data: wdata });
          await db.wheelPrize.createMany({ data: prizes.map((p) => ({ ...p, wheelId: w.id })) });
        }
        return j({ status: "success" });
      }
      case "wh_del":
        await db.wheel.deleteMany({ where: { id } });
        return j({ status: "success" });
      case "user_save": {
        const data = { balance: n("balance"), points: Math.max(0, Math.floor(n("points"))), role: s("role", "user") === "admin" ? "admin" : "user" };
        await db.user.update({ where: { id }, data });
        return j({ status: "success" });
      }
      case "user_del": {
        const t = await db.user.findUnique({ where: { id } });
        if (!t || t.role === "admin") return j({ status: "fail", message: "ลบสมาชิกคนนี้ไม่ได้" });
        await db.user.delete({ where: { id } });
        return j({ status: "success" });
      }
      case "ann_add": {
        const text = s("text");
        if (!text) return j({ status: "fail", message: "กรอกข้อความประกาศ" });
        await db.announcement.create({ data: { text } });
        return j({ status: "success" });
      }
      case "ann_toggle": {
        const a = await db.announcement.findUnique({ where: { id } });
        if (!a) return j({ status: "fail", message: "ไม่พบประกาศ" });
        await db.announcement.update({ where: { id }, data: { active: !a.active } });
        return j({ status: "success" });
      }
      case "ann_del":
        await db.announcement.deleteMany({ where: { id } });
        return j({ status: "success" });
      case "settings_save": {
        const allowed = ["site_name", "site_title", "site_desc", "hero_lead", "foot_brand", "foot_copy", "foot_report_url", "foot_report_text", "contact_facebook_url", "contact_discord_url", "logo_url"];
        for (const k of allowed) {
          if (form.has(k)) await db.setting.upsert({ where: { key: k }, create: { key: k, value: String(form.get(k)) }, update: { value: String(form.get(k)) } });
        }
        return j({ status: "success" });
      }
      default:
        return j({ status: "fail", message: "คำสั่งไม่ถูกต้อง" }, 400);
    }
  } catch (e) {
    return j({ status: "fail", message: "เกิดข้อผิดพลาด: " + (e as Error).message }, 500);
  }
}

export async function GET() {
  const st = await getSettings();
  return j({ status: "success", settings: Object.keys(st).length });
}
