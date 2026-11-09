import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: { where: { sold: false } } } } },
      },
    },
  });

  return NextResponse.json({
    status: true,
    balance: user.balance,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      detail: c.detail,
      image: c.image,
      products: c.products.map((p) => ({
        id: p.id,
        name: p.name,
        detail: p.detail,
        image: p.image,
        price: p.price,
        stock: p._count.items,
      })),
    })),
  });
}
