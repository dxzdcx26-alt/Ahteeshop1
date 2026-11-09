import { NextRequest, NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await destroySession(req);
  const res = NextResponse.json({ status: true, message: "ออกจากระบบแล้ว" });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
  return res;
}
