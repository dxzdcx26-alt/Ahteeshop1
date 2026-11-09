import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ status: true, q, products: [] });

  const products = await db.product.findMany({
    where: {
      active: true,
      name: { contains: q },
    },
    include: { _count: { select: { items: { where: { sold: false } } } } },
    take: 40,
  });

  return NextResponse.json({
    status: true,
    q,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      price: p.price,
      stock: p._count.items,
    })),
  });
}
