import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveAnnouncements, getSettings } from "@/lib/site";

export async function GET() {
  const [settings, announcements, members, categories, featured, soldAgg] = await Promise.all([
    getSettings(),
    getActiveAnnouncements(),
    db.user.count(),
    db.category.count({ where: { active: true } }),
    db.product.findMany({
      where: { active: true, featured: true },
      include: { _count: { select: { items: { where: { sold: false } } } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    db.order.aggregate({ _sum: { quantity: true } }),
  ]);

  const categoriesList = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });

  const stock = await db.productItem.count({ where: { sold: false } });

  return NextResponse.json({
    status: true,
    settings: {
      siteName: settings.siteName || "AhteeShop",
      siteTagline: settings.siteTagline || "",
      heroBadge: settings.heroBadge || "",
      heroLead: settings.heroLead || "",
      footerText: settings.footerText || "",
      facebookUrl: settings.facebookUrl || "",
      discordUrl: settings.discordUrl || "",
      contactNote: settings.contactNote || "",
    },
    announcements,
    stats: {
      members,
      categories,
      productsReady: stock,
      sold: soldAgg._sum.quantity || 0,
    },
    categories: categoriesList.map((c) => ({
      id: c.id,
      name: c.name,
      detail: c.detail,
      image: c.image,
      productCount: c._count.products,
    })),
    featured: featured.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      price: p.price,
      stock: p._count.items,
    })),
  });
}
