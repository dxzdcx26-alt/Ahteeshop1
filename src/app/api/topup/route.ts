import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/site";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const [settings, topups] = await Promise.all([
    getSettings(),
    db.topupRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return NextResponse.json({
    status: true,
    balance: user.balance,
    paymentInfo: settings.paymentInfo || "",
    topups,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = parseFloat(String(body.amount || ""));
  const method = String(body.method || "promptpay");
  const reference = String(body.reference || "").trim();

  if (!amount || amount < 1 || amount > 100000) {
    return NextResponse.json({ status: false, message: "กรุณาระบุจำนวนเงิน 1 - 100,000 บาท" }, { status: 400 });
  }
  if (!reference) {
    return NextResponse.json({ status: false, message: "กรุณาระบุเลขอ้างอิง / เลขสลิปโอนเงิน" }, { status: 400 });
  }

  const topup = await db.topupRequest.create({
    data: { userId: user.id, amount, method, reference },
  });

  return NextResponse.json({
    status: true,
    message: "ส่งรายการเติมเงินเรียบร้อย รอเจ้าหน้าที่ตรวจสอบ",
    topup,
  });
}
