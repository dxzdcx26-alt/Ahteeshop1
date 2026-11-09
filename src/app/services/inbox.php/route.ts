import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getUnread, verifyCsrf } from "@/lib/auth-extra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ unread: 0 }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const action = String(form?.get("action") || "");
  const csrf = String(form?.get("csrf") || "");
  if (!(await verifyCsrf(req, csrf))) return NextResponse.json({ unread: await getUnread(user.id), error: "csrf" }, { status: 403 });

  const id = String(form?.get("id") || "");
  if (action === "read" && id) {
    await db.inboxMessage.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  } else if (action === "read_all") {
    await db.inboxMessage.updateMany({ where: { userId: user.id }, data: { read: true } });
  } else if (action === "delete" && id) {
    await db.inboxMessage.deleteMany({ where: { id, userId: user.id } });
  }
  return NextResponse.json({ unread: await getUnread(user.id) });
}
