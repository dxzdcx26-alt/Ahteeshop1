import { afterAll, describe, expect, test } from "bun:test";
import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "../src/lib/db";
import { SESSION_COOKIE } from "../src/lib/auth";
import { POST as buy } from "../src/app/api/buy/route";
import { POST as topup } from "../src/app/api/topup/route";
import { POST as adminPost } from "../src/app/api/admin/route";
import { POST as redeemReward } from "../src/app/api/rewards/route";
import { GET as listProducts } from "../src/app/api/products/route";

const userIds: string[] = [];
const categoryIds: string[] = [];
const rewardIds: string[] = [];

async function createUser(role = "user", balance = 0, points = 0) {
  const user = await db.user.create({
    data: {
      username: `it_${randomUUID().replaceAll("-", "").slice(0, 16)}`,
      password: "integration-test-hash",
      role,
      balance,
      points,
    },
  });
  userIds.push(user.id);
  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  return { user, token };
}

function apiRequest(path: string, token: string, body?: unknown) {
  return new NextRequest(`https://shop.example${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      origin: "https://shop.example",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      cookie: `${SESSION_COOKIE}=${token}`,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("commerce API integration (ephemeral CI PostgreSQL)", () => {
  test("public product listing returns persisted active products and pagination", async () => {
    const category = await db.category.create({ data: { name: `IT ${randomUUID()}` } });
    categoryIds.push(category.id);
    const product = await db.product.create({
      data: { categoryId: category.id, name: "Integration Product", price: 12.5, active: true },
    });

    const response = await listProducts(new NextRequest("https://shop.example/api/products?limit=5"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.some((item: { id: string }) => item.id === product.id)).toBe(true);
    expect(payload.pagination.limit).toBe(5);
  });

  test("concurrent purchases reserve stock and debit only one buyer", async () => {
    const category = await db.category.create({ data: { name: `IT ${randomUUID()}` } });
    categoryIds.push(category.id);
    const product = await db.product.create({
      data: { categoryId: category.id, name: "Single Stock Product", price: 25, active: true },
    });
    await db.productItem.create({ data: { productId: product.id, payload: "test-credential" } });
    const buyerA = await createUser("user", 100);
    const buyerB = await createUser("user", 100);

    const responses = await Promise.all([
      buy(apiRequest("/api/buy", buyerA.token, { id: product.id, count: 1 })),
      buy(apiRequest("/api/buy", buyerB.token, { id: product.id, count: 1 })),
    ]);
    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 409]);

    const [stock, orders, buyers] = await Promise.all([
      db.productItem.findMany({ where: { productId: product.id } }),
      db.order.findMany({ where: { productId: product.id } }),
      db.user.findMany({ where: { id: { in: [buyerA.user.id, buyerB.user.id] } } }),
    ]);
    expect(stock).toHaveLength(1);
    expect(stock[0].sold).toBe(true);
    expect(orders).toHaveLength(1);
    expect(buyers.reduce((sum, user) => sum + user.balance, 0)).toBe(175);
    expect(await db.transaction.count({ where: { userId: { in: [buyerA.user.id, buyerB.user.id] }, type: "buy" } })).toBe(1);
  });

  test("top-up submission rejects a duplicate payment reference", async () => {
    const customer = await createUser();
    const reference = `IT-${randomUUID()}`;
    const body = { amount: 35.5, method: "promptpay", reference };

    const first = await topup(apiRequest("/api/topup", customer.token, body));
    const duplicate = await topup(apiRequest("/api/topup", customer.token, body));
    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(409);
    expect(await db.topupRequest.count({ where: { method: "promptpay", reference } })).toBe(1);
    expect((await db.user.findUniqueOrThrow({ where: { id: customer.user.id } })).balance).toBe(0);
  });

  test("concurrent admin approval credits a pending top-up exactly once", async () => {
    const customer = await createUser();
    const admin = await createUser("admin");
    const pending = await db.topupRequest.create({
      data: { userId: customer.user.id, amount: 75, method: "promptpay", reference: `IT-${randomUUID()}` },
    });

    const responses = await Promise.all([
      adminPost(apiRequest("/api/admin", admin.token, { action: "topup.process", id: pending.id, approve: true })),
      adminPost(apiRequest("/api/admin", admin.token, { action: "topup.process", id: pending.id, approve: true })),
    ]);
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 400 || response.status === 409)).toHaveLength(1);
    expect((await db.user.findUniqueOrThrow({ where: { id: customer.user.id } })).balance).toBe(75);
    expect(await db.transaction.count({ where: { userId: customer.user.id, type: "topup" } })).toBe(1);
    expect((await db.topupRequest.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe("approved");
  });

  test("concurrent reward redemption cannot overspend points or stock", async () => {
    const customer = await createUser("user", 0, 50);
    const reward = await db.rewardItem.create({
      data: { name: `IT Reward ${randomUUID()}`, pointsCost: 20, stock: 1, active: true },
    });
    rewardIds.push(reward.id);

    const responses = await Promise.all([
      redeemReward(apiRequest("/api/rewards", customer.token, { id: reward.id })),
      redeemReward(apiRequest("/api/rewards", customer.token, { id: reward.id })),
    ]);
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.some((response) => response.status === 400 || response.status === 409)).toBe(true);
    expect((await db.user.findUniqueOrThrow({ where: { id: customer.user.id } })).points).toBe(30);
    expect((await db.rewardItem.findUniqueOrThrow({ where: { id: reward.id } })).stock).toBe(0);
    expect(await db.transaction.count({ where: { userId: customer.user.id, type: "reward" } })).toBe(1);
  });
});

afterAll(async () => {
  if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } });
  if (categoryIds.length) await db.category.deleteMany({ where: { id: { in: categoryIds } } });
  if (rewardIds.length) await db.rewardItem.deleteMany({ where: { id: { in: rewardIds } } });
  await db.$disconnect();
});
