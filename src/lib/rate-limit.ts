import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function getClientAddress(req: NextRequest): string {
  // Vercel supplies x-real-ip. Use the first forwarded address only as a fallback.
  return req.headers.get("x-real-ip")?.trim()
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

/**
 * PostgreSQL-backed fixed-window rate limit. The upsert is atomic across
 * concurrent Vercel instances; no process-local memory is used.
 * Fails closed (503) if the limiter store is unavailable.
 */
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs = FIFTEEN_MINUTES,
  identity = "",
): Promise<NextResponse | null> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const expiresAt = new Date(now.getTime() + windowMs);
  const rawKey = [scope, getClientAddress(req), identity].join(":");
  const key = createHash("sha256").update(rawKey).digest("hex");

  try {
    const rows = await db.$queryRaw<Array<{ count: number; windowStartedAt: Date }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "windowStartedAt", "expiresAt")
      VALUES (${key}, 1, ${now}, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" <= ${windowStart} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" <= ${windowStart} THEN ${now}
          ELSE "RateLimitBucket"."windowStartedAt"
        END,
        "expiresAt" = ${expiresAt}
      RETURNING "count", "windowStartedAt"
    `;
    if (Math.random() < 0.01) {
      await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => {});
    }

    const current = Number(rows[0]?.count ?? 0);
    const startedAt = rows[0]?.windowStartedAt ?? now;
    const retryAfter = Math.max(1, Math.ceil((startedAt.getTime() + windowMs - now.getTime()) / 1000));

    if (current <= limit) return null;

    return NextResponse.json(
      { status: false, message: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { status: false, message: "ระบบป้องกันคำขอไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" },
      { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } },
    );
  }
}
