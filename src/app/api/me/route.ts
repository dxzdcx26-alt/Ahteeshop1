import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: true, user: null });
  return NextResponse.json({ status: true, user: publicUser(user) });
}
