import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-extra";
import { getBalance, isConfigured } from "@/lib/hubzell";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ status: "fail", message: "admin only" }, { status: 403 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ status: "fail", message: "ยังไม่ได้ตั้ง HUBZELL_API_KEY / SECRET" }, { status: 400 });
  }
  const currency = req.nextUrl.searchParams.get("currency") || "THB";
  const res = await getBalance(currency);
  return NextResponse.json(res);
}
