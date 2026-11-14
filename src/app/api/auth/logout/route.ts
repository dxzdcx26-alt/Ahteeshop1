import { NextRequest, NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE, isSameOriginRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ status: false, message: "คำขอข้ามเว็บไซต์ถูกปฏิเสธ" }, { status: 403 });
  await destroySession(req);
  const res = NextResponse.json({ status: true, message: "ออกจากระบบแล้ว" });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0) });
  return res;
}
