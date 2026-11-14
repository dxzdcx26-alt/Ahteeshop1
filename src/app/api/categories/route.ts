import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      detail: true,
      image: true,
      _count: { select: { products: { where: { active: true } } } },
    },
  });

  return NextResponse.json({
    status: true,
    data: categories.map(({ _count, ...category }) => ({
      ...category,
      productCount: _count.products,
    })),
  });
}
