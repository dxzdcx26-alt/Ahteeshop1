import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const admin = await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: await bcrypt.hash("admin1234", 10),
      role: "admin",
      balance: 0,
      points: 0,
    },
  });

  const settings: Record<string, string> = {
    siteName: "Ahtee",
    siteTagline: "เติมเกมอัตโนมัติ 24 ชม.",
    heroBadge: "ระบบอัตโนมัติ 24 ชม.",
    heroLead: "Ahtee",
    footerText: "Ahtee — เติมเกมไว ปลอดภัย 24 ชม.",
    facebookUrl: "",
    discordUrl: "",
    contactNote: "ติดต่อเจ้าของร้านไม่ได้ / แจ้งปัญหาร้านค้าโกง",
    paymentInfo:
      "ธนาคาร: กสิกรไทย\nชื่อบัญชี: Ahtee Shop\nเลขบัญชี: 000-0-00000-0\n\nPromptPay: 0x0-000-0000",
    wheelCostPoints: "0",
    wheelFreeDaily: "1",
    appInfo:
      "แอพพรีเมี่ยม Ahtee — สมัครแพ็กเกจพรีเมี่ยมเพื่อรับส่วนลดพิเศษและสิทธิ์ในการใช้งานระบบก่อนใคร",
    appLink: "",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  await db.announcement.upsert({
    where: { id: "seed-ann" },
    update: { text: "ยินดีต้อนรับ" },
    create: { id: "seed-ann", text: "ยินดีต้อนรับ", active: true },
  });

  const prizes = await db.wheelPrize.count();
  if (prizes === 0) {
    await db.wheelPrize.createMany({
      data: [
        { label: "ขอบคุณ", type: "none", value: 0, weight: 40, color: "#14120e", sortOrder: 1 },
        { label: "5 บาท", type: "balance", value: 5, weight: 20, color: "#d4af37", sortOrder: 2 },
        { label: "10 แต้ม", type: "points", value: 10, weight: 15, color: "#14120e", sortOrder: 3 },
        { label: "20 บาท", type: "balance", value: 20, weight: 10, color: "#d4af37", sortOrder: 4 },
        { label: "50 แต้ม", type: "points", value: 50, weight: 5, color: "#14120e", sortOrder: 5 },
        { label: "100 บาท", type: "balance", value: 100, weight: 2, color: "#d4af37", sortOrder: 6 },
      ],
    });
  }

  console.log("Seed complete. Admin:", admin.username);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
