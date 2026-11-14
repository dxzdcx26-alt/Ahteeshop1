import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = (params.get("q") || "").trim().slice(0, 100);
  const categoryId = (params.get("categoryId") || "").trim().slice(0, 64);
  const page = boundedInt(params.get("page"), 1, 1, 100000);
  const limit = boundedInt(params.get("limit"), 20, 1, 50);
  const minPriceRaw = params.get("minPrice");
  const maxPriceRaw = params.get("maxPrice");
  const minPrice = minPriceRaw === null ? undefined : Number(minPriceRaw);
  const maxPrice = maxPriceRaw === null ? undefined : Number(maxPriceRaw);

  if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    return NextResponse.json({ status: false, message: "ช่วงราคาไม่ถูกต้อง" }, { status: 400 });
  }

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {}),
    ...(params.get("featured") === "true" ? { featured: true } : {}),
    ...(params.get("inStock") === "true" ? { items: { some: { sold: false } } } : {}),
  };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        categoryId: true,
        name: true,
        detail: true,
        image: true,
        price: true,
        featured: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        _count: { select: { items: { where: { sold: false } } } },
      },
    }),
  ]);

  return NextResponse.json({
    status: true,
    data: products.map(({ _count, ...product }) => ({ ...product, stock: _count.items })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
