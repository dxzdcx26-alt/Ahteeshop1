import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

export type SessionUser = {
  id: string;
  username: string;
  role: string;
  balance: number;
  points: number;
};

export const SESSION_COOKIE = "ahtee_session";

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function getUserByToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    balance: session.user.balance,
    points: session.user.points,
  };
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)ahtee_session=([^;]+)/);
  return getUserByToken(m ? decodeURIComponent(m[1]) : null);
}

export async function getUnread(userId: string): Promise<number> {
  return db.inboxMessage.count({ where: { userId, read: false } });
}

export function csrfFor(token: string): string {
  return createHash("sha256").update("csrf:" + token).digest("hex");
}

export async function verifyCsrf(req: Request, csrf: unknown): Promise<boolean> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)ahtee_session=([^;]+)/);
  if (!m) return false;
  return csrf === csrfFor(decodeURIComponent(m[1]));
}

export async function inboxMsg(userId: string, title: string, body: string, raw = "") {
  await db.inboxMessage.create({ data: { userId, title, body, raw } });
}

export async function tx(userId: string, type: string, amount: number, detail: string) {
  await db.transaction.create({ data: { userId, type, amount, detail } });
}

export function orderNo(prefix = "ORD"): string {
  return prefix + Date.now().toString(36).toUpperCase() + randomBytes(2).toString("hex").toUpperCase();
}

export async function destroySession(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)ahtee_session=([^;]+)/);
  if (!m) return;
  await db.session.deleteMany({ where: { token: decodeURIComponent(m[1]) } });
}

export function publicUser(u: {
  id: string;
  username: string;
  role: string;
  balance: number;
  points: number;
}): SessionUser {
  return { id: u.id, username: u.username, role: u.role, balance: u.balance, points: u.points };
}
