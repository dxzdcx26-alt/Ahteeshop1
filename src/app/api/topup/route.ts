import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/site";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const [settings, topups] = await Promise.all([
    getSettings(),
    db.topupRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, method: true, reference: true, status: true, adminNote: true, createdAt: true, processedAt: true },
    }),
  ]);

  return NextResponse.json({
    status: true,
    balance: user.balance,
    paymentInfo: settings.paymentInfo || "",
    topups,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  const method = String(body.method || "promptpay").trim().toLowerCase();
  const reference = String(body.reference || "").trim();

  if (!Number.isFinite(amount) || amount < 1 || amount > 100000 || Math.round(amount * 100) !== amount * 100) {
    return NextResponse.json({ status: false, message: "กรุณาระบุจำนวนเงิน 1 - 100,000 บาท (ทศนิยมไม่เกิน 2 ตำแหน่ง)" }, { status: 400 });
  }
  if (!/^[a-z0-9_-]{1,32}$/.test(method)) {
    return NextResponse.json({ status: false, message: "ช่องทางชำระเงินไม่ถูกต้อง" }, { status: 400 });
  }
  if (!reference || reference.length > 128) {
    return NextResponse.json({ status: false, message: "กรุณาระบุเลขอ้างอิงที่ถูกต้อง (ไม่เกิน 128 ตัวอักษร)" }, { status: 400 });
  }

  try {
    const topup = await db.$transaction(async (tx) => {
      const duplicate = await tx.topupRequest.findFirst({
        where: { method, reference },
        select: { id: true },
      });
      if (duplicate) throw new Error("DUPLICATE_REFERENCE");
      return tx.topupRequest.create({
        data: { userId: user.id, amount, method, reference },
        select: { id: true, amount: true, method: true, reference: true, status: true, createdAt: true },
      });
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({
      status: true,
      message: "ส่งรายการเติมเงินเรียบร้อย รอเจ้าหน้าที่ตรวจสอบ",
      topup,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : "";
    if (message === "DUPLICATE_REFERENCE" || code === "P2034" || code === "P2002") {
      return NextResponse.json({ status: false, message: "เลขอ้างอิงนี้ถูกใช้ส่งรายการแล้ว" }, { status: 409 });
    }
    throw error;
  }
}
