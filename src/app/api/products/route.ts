import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return json({ status: false, message: "กรุณาเข้าสู่ระบบ" }, 401);
  }

  const params = req.nextUrl.searchParams;
  const rawPage = params.get("page") ?? "1";
  const rawLimit = params.get("limit") ?? "20";
  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return json(
      { status: false, message: "page ต้องเป็นจำนวนเต็มตั้งแต่ 1 และ limit ต้องอยู่ระหว่าง 1-100" },
      400
    );
  }

  const q = (params.get("q") ?? "").trim().slice(0, 100);
  const categoryId = (params.get("categoryId") ?? "").trim();

  const where = {
    active: true,
    category: { active: true },
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { detail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [total, products] = await db.$transaction([
      db.product.count({ where }),
      db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          detail: true,
          image: true,
          price: true,
          featured: true,
          createdAt: true,
          category: {
            select: { id: true, name: true },
          },
          _count: {
            select: { items: { where: { sold: false } } },
          },
        },
      }),
    ]);

    return json({
      status: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        detail: product.detail,
        image: product.image,
        price: product.price,
        featured: product.featured,
        stock: product._count.items,
        category: product.category,
        createdAt: product.createdAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/products] Failed to fetch products:", error);
    return json({ status: false, message: "ไม่สามารถดึงข้อมูลสินค้าได้" }, 500);
  }
}
