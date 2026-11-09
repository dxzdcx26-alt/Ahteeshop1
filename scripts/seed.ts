// Seed real data: admin account, site settings (exact values from the original site),
// the real premium-app catalog captured from the target site, and the homepage announcement.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const db = new PrismaClient();

const SETTINGS: Record<string, string> = {
  site_name: "Ahtee",
  site_title: "Ahtee | เติมเกมอัตโนมัติ 24 ชม.",
  site_desc: "Ahtee",
  hero_lead: "Ahtee",
  foot_brand: "Ahtee — เติมเกมไว ปลอดภัย 24 ชม.",
  foot_copy: "2023 spaceXnet Cloud, All right reserved.",
  foot_report_url: "https://discord.gg/dfnxcloud",
  foot_report_text: "ติดต่อเจ้าของร้านไม่ได้ / แจ้งปัญหาร้านค้าโกง",
  contact_facebook_url: "",
  contact_discord_url: "",
  logo_url: "",
};

async function main() {
  // settings
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }

  // announcement shown in the homepage ticker (real value from the original)
  const annCount = await db.announcement.count();
  if (annCount === 0) {
    await db.announcement.create({ data: { text: "ยินดีต้อนรับ", active: true } });
  }

  // admin account
  const admin = await db.user.findUnique({ where: { username: "admin" } });
  if (!admin) {
    await db.user.create({
      data: {
        username: "admin",
        password: await bcrypt.hash("admin1234", 10),
        role: "admin",
      },
    });
    console.log("created admin/admin1234");
  }

  // real premium-app catalog captured from the target site (public catalog data)
  const catalog: { id: string; name: string; price: string; stock: number; img: string }[] = JSON.parse(
    readFileSync("/home/z/my-project/target/app_catalog.json", "utf-8")
  );
  for (const item of catalog) {
    const extId = Number(item.id);
    if (!Number.isFinite(extId)) continue;
    const price = Number(String(item.price).replace(/[^0-9.]/g, "")) || 0;
    await db.appProduct.upsert({
      where: { extId },
      create: { extId, name: item.name, image: item.img, price, stock: item.stock, detail: "", active: true },
      update: { name: item.name, image: item.img, price, stock: item.stock },
    });
  }
  console.log("catalog items:", catalog.length);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
