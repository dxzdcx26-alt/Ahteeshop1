import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getSessionUser, tx, inboxMsg } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: "fail", message: "กรุณาเข้าสู่ระบบก่อนเติมเงิน" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const method = String(form?.get("method") || "");

  if (method === "truemoney") {
    const code = String(form?.get("code") || "").trim();
    if (!code) return NextResponse.json({ status: "fail", message: "กรุณากรอกลิงก์ซองอั่งเปา" });
    const m = code.match(/code=([A-Za-z0-9]+)/);
    await db.topupRequest.create({ data: { userId: user.id, amount: 0, method: "truemoney", reference: code.slice(0, 500) } });
    await Promise.all([tx(user.id, "topup_request", 0, "แจ้งเติมเงิน TrueMoney ซองอั่งเปา")]);
    return NextResponse.json({ status: "success", message: "ส่งรายการเติมเงินแล้ว — รอทางร้านตรวจสอบและเติมเงินให้โดยเร็วที่สุด" });
  }

  if (method === "slip") {
    const amount = Number(form?.get("amount") || 0);
    const slip = form?.get("slip");
    if (!amount || amount <= 0) return NextResponse.json({ status: "fail", message: "กรุณาระบุจำนวนเงิน" });
    if (!slip || typeof slip === "string") return NextResponse.json({ status: "fail", message: "กรุณาแนบรูปสลิป" });
    const buf = Buffer.from(await (slip as File).arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return NextResponse.json({ status: "fail", message: "ไฟล์ใหญ่เกิน 5MB" });
    const ext = (slip as File).name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const fname = `slip_${user.id.slice(-6)}_${Date.now()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, fname), buf);
    await db.topupRequest.create({ data: { userId: user.id, amount, method: "slip", reference: "/uploads/" + fname } });
    await Promise.all([tx(user.id, "topup_request", amount, "แจ้งเติมเงินผ่านสลิป")]);
    return NextResponse.json({ status: "success", message: "ส่งสลิปแล้ว — รอทางร้านตรวจสอบและเติมเงินให้โดยเร็วที่สุด" });
  }

  if (method === "redeem") {
    const code = String(form?.get("code") || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ status: "fail", message: "กรุณากรอกโค้ด" });
    const rc = await db.redeemCode.findUnique({ where: { code } });
    if (!rc || rc.used) return NextResponse.json({ status: "fail", message: "โค้ดไม่ถูกต้องหรือถูกใช้ไปแล้ว" });
    await db.$transaction(async (txc) => {
      const claimed = await txc.redeemCode.updateMany({
        where: { code, used: false },
        data: { used: true, usedBy: user.username, usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error("used");
      await txc.user.update({ where: { id: user.id }, data: { balance: { increment: rc.amount } } });
      await txc.transaction.create({ data: { userId: user.id, type: "topup", amount: rc.amount, detail: `เติมเงินด้วยโค้ด ${code}` } });
    });
    await Promise.all([inboxMsg(user.id, "เติมเงินสำเร็จ", `เติมเงินด้วยโค้ด ${code} จำนวน ${rc.amount} บาท สำเร็จ`), tx(user.id, "topup", rc.amount, `โค้ด ${code}`)]);
    return NextResponse.json({ status: "success", message: `เติมเงินสำเร็จ +${rc.amount} บาท` });
  }

  return NextResponse.json({ status: "fail", message: "วิธีเติมเงินไม่ถูกต้อง" }, { status: 400 });
}
