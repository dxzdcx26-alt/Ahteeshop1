import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { isSameOriginRequest } from "../src/lib/auth";

describe("same-origin mutation protection", () => {
  test("accepts requests from the application origin", () => {
    const req = new NextRequest("https://shop.example/api/buy", {
      headers: { origin: "https://shop.example", "sec-fetch-site": "same-origin" },
    });
    expect(isSameOriginRequest(req)).toBe(true);
  });

  test("rejects a foreign Origin header", () => {
    const req = new NextRequest("https://shop.example/api/buy", {
      headers: { origin: "https://attacker.example" },
    });
    expect(isSameOriginRequest(req)).toBe(false);
  });

  test("rejects cross-site Fetch Metadata even without Origin", () => {
    const req = new NextRequest("https://shop.example/api/buy", {
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(isSameOriginRequest(req)).toBe(false);
  });

  test("allows non-browser clients that send neither Origin nor Fetch Metadata", () => {
    const req = new NextRequest("https://shop.example/api/buy");
    expect(isSameOriginRequest(req)).toBe(true);
  });
});

describe("API security wiring", () => {
  const guardedRoutes = [
    "src/app/api/admin/route.ts",
    "src/app/api/buy/route.ts",
    "src/app/api/rewards/route.ts",
    "src/app/api/wheel/route.ts",
    "src/app/api/topup/route.ts",
    "src/app/api/auth/login/route.ts",
    "src/app/api/auth/register/route.ts",
    "src/app/api/auth/logout/route.ts",
  ];

  for (const path of guardedRoutes) {
    test(`${path} checks request origin before mutation`, () => {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("isSameOriginRequest(req)");
    });
  }

  test("Discord OAuth callback requires a state cookie and query state", () => {
    const source = readFileSync("src/app/api/auth/discord/callback/route.ts", "utf8");
    expect(source).toContain("timingSafeEqual");
    expect(source).toContain("OAUTH_STATE_COOKIE");
    expect(source).toContain('where: { discordId: dUser.id }');
    expect(source).not.toContain('username: "dc_" + dUser.id');
  });

  test("top-up approval is claimed only while pending", () => {
    const source = readFileSync("src/app/api/admin/route.ts", "utf8");
    expect(source).toContain('where: { id, status: "pending" }');
    expect(source).toContain("claimed.count !== 1");
  });
});


describe("authentication rate-limit wiring", () => {
  test("login applies both IP and account-scoped limits", () => {
    const source = readFileSync("src/app/api/auth/login/route.ts", "utf8");
    expect(source).toContain('enforceRateLimit(req, "auth-login-ip", 30)');
    expect(source).toContain('enforceRateLimit(req, "auth-login-account", 8');
  });

  test("registration applies an IP-scoped limit", () => {
    const source = readFileSync("src/app/api/auth/register/route.ts", "utf8");
    expect(source).toContain('enforceRateLimit(req, "auth-register-ip", 5');
  });

  test("rate limiter uses an atomic PostgreSQL upsert and fails closed", () => {
    const source = readFileSync("src/lib/rate-limit.ts", "utf8");
    expect(source).toContain('ON CONFLICT ("key") DO UPDATE');
    expect(source).toContain('status: 429');
    expect(source).toContain('status: 503');
  });
});
