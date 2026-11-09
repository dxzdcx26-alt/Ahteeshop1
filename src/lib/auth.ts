import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "ahtee_session";

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function destroySession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return;
  await db.session.deleteMany({ where: { token } });
}

export function publicUser(u: {
  id: string;
  username: string;
  role: string;
  balance: number;
  points: number;
}) {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    balance: u.balance,
    points: u.points,
  };
}
