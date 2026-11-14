import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const page = boundedInt(params.get("page"), 1, 1, 100000);
  const limit = boundedInt(params.get("limit"), 20, 1, 50);
  const [total, orders] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        orderNo: true,
        productId: true,
        productName: true,
        quantity: true,
        unitPrice: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    status: true,
    data: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
