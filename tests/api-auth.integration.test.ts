import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { db } from "../src/lib/db";
import { POST as login } from "../src/app/api/auth/login/route";
import { POST as register } from "../src/app/api/auth/register/route";

const createdUserIds: string[] = [];

function request(path: string, body: unknown, ip: string) {
  return new NextRequest(`https://shop.example${path}`, {
    method: "POST",
    headers: {
      origin: "https://shop.example",
      "content-type": "application/json",
      "x-real-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("authentication API integration (ephemeral CI PostgreSQL)", () => {
  test("register creates user, transaction and session through the API handler", async () => {
    const username = `it_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const response = await register(request("/api/auth/register", {
      username,
      password: "TestPass123!",
      password2: "TestPass123!",
    }, ip));

    expect(response.status).toBe(200);
    const user = await db.user.findUnique({ where: { username }, include: { transactions: true, sessions: true } });
    expect(user).not.toBeNull();
    expect(user?.transactions.some((item) => item.detail === "สมัครสมาชิก")).toBe(true);
    expect(user?.sessions.length).toBe(1);
    if (user) createdUserIds.push(user.id);
  });

  test("login verifies a real password and creates a persisted session", async () => {
    const username = `it_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const user = await db.user.create({
      data: { username, password: await bcrypt.hash("CorrectPass123!", 4) },
    });
    createdUserIds.push(user.id);
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

    const response = await login(request("/api/auth/login", {
      username,
      password: "CorrectPass123!",
    }, ip));

    expect(response.status).toBe(200);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(1);
  });

  test("login returns 429 after the per-IP/account attempt limit", async () => {
    const username = `it_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const user = await db.user.create({
      data: { username, password: await bcrypt.hash("CorrectPass123!", 4) },
    });
    createdUserIds.push(user.id);
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await login(request("/api/auth/login", {
        username,
        password: "WrongPass123!",
      }, ip));
      expect(response.status).toBe(401);
    }

    const limited = await login(request("/api/auth/login", {
      username,
      password: "WrongPass123!",
    }, ip));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).not.toBeNull();
    expect(limited.headers.get("cache-control")).toBe("no-store");
  });

  test("registration applies an IP rate limit", async () => {
    const ip = `192.0.2.${Math.floor(Math.random() * 200) + 1}`;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await register(request("/api/auth/register", {}, ip));
      expect(response.status).toBe(400);
    }
    const limited = await register(request("/api/auth/register", {}, ip));
    expect(limited.status).toBe(429);
  });
});

afterAll(async () => {
  if (createdUserIds.length) {
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  // CI uses an isolated ephemeral schema; clear limiter rows created by these tests.
  await db.rateLimitBucket.deleteMany({});
  await db.$disconnect();
});
