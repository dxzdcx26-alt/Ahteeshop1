import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Reset store data to the pristine state (like the reference site):
 *  1 member (admin), 0 categories, 0 products, clean orders/topups. */
async function main() {
  await db.order.deleteMany({});
  await db.topupRequest.deleteMany({});
  await db.transaction.deleteMany({});
  await db.productItem.deleteMany({});
  await db.product.deleteMany({});
  await db.category.deleteMany({});
  await db.session.deleteMany({});
  await db.user.deleteMany({ where: { role: { not: "admin" } } });
  const admin = await db.user.findFirst({ where: { role: "admin" } });
  if (admin) {
    await db.user.update({ where: { id: admin.id }, data: { balance: 0, points: 0 } });
  }
  const members = await db.user.count();
  console.log("Reset complete. members:", members);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
