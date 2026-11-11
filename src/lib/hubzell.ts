/**
 * HubZell Gateway API client
 * Docs: https://shop.hubzell.com/docs
 * Base: https://gateway.hubzell.com/api/v1
 */
import crypto from "crypto";

const BASE = process.env.HUBZELL_BASE_URL || "https://gateway.hubzell.com";
const API_KEY = process.env.HUBZELL_API_KEY || "";
const SECRET_KEY = process.env.HUBZELL_SECRET_KEY || "";

export type HubzellStatus =
  | "PENDING"
  | "SENT"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export interface HubzellEnvelope<T = unknown> {
  status: 0 | 1;
  code: string;
  message: string;
  data: T | null;
  trace_id?: string;
}

export interface HubzellBalance {
  reseller: string;
  currency: string | null;
  available: number | null;
  hold: number | null;
  balances: { currency: string; available: number; hold: number }[];
}

export interface HubzellProductInput {
  name: string;
  type: "string" | "select";
  validation?: string;
  example?: string;
  options?: { name: string; value: string }[];
}

export interface HubzellService {
  id: string;
  price: number;
  list_price: number;
  discount_percent: number;
  name: string;
  service_available: boolean;
}

export interface HubzellProductDetail {
  category: string;
  product_id: string;
  product_name: string;
  currency: string;
  inputs: HubzellProductInput[];
  services: HubzellService[];
}

export interface HubzellOrderResult {
  status: HubzellStatus;
  transaction_id: string | null;
  service_id: string;
  input: Record<string, string>;
  client_ref: string;
  currency: string;
  total_amount: number;
  balance: number;
  delivered_content?: string;
  failure_reason?: string;
}

function sign(method: string, path: string, timestamp: string, rawBody: string): string {
  const signingString = `${method}\n${path}\n${timestamp}\n${rawBody}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(signingString).digest("hex");
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: object,
  query?: Record<string, string>
): Promise<HubzellEnvelope<T>> {
  if (!API_KEY || !SECRET_KEY) {
    return {
      status: 1,
      code: "MISSING_CREDENTIALS",
      message: "HUBZELL_API_KEY / HUBZELL_SECRET_KEY ยังไม่ได้ตั้งค่า",
      data: null,
    };
  }

  const rawBody = body ? JSON.stringify(body) : "";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign(method, path, timestamp, rawBody);

  let url = `${BASE}${path}`;
  if (query && Object.keys(query).length) {
    const qs = new URLSearchParams(query).toString();
    url += (url.includes("?") ? "&" : "?") + qs;
  }

  const headers: Record<string, string> = {
    "X-Api-Key": API_KEY,
    "X-Timestamp": timestamp,
    "X-Signature": signature,
  };
  if (body) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? rawBody : undefined,
      cache: "no-store",
    });
    const json = (await res.json()) as HubzellEnvelope<T>;
    return json;
  } catch (e: any) {
    return {
      status: 1,
      code: "INTERNAL_ERROR",
      message: e?.message || "Network error",
      data: null,
    };
  }
}

export async function getBalance(currency?: string) {
  return request<HubzellBalance>(
    "GET",
    "/api/v1/balance",
    undefined,
    currency ? { currency } : undefined
  );
}

export async function getCategories(currency?: string) {
  return request<{ items: { code: string; name: string; currency: string }[] }>(
    "GET",
    "/api/v1/categories",
    undefined,
    currency ? { currency } : undefined
  );
}

export async function getProducts(opts?: { category?: string; currency?: string }) {
  const q: Record<string, string> = {};
  if (opts?.category) q.category = opts.category;
  if (opts?.currency) q.currency = opts.currency;
  return request<{
    items: {
      category: string;
      currency: string;
      products: { product_id: string; product_name: string; currency: string }[];
    }[];
  }>("GET", "/api/v1/products", undefined, Object.keys(q).length ? q : undefined);
}

export async function getProduct(productId: string) {
  return request<HubzellProductDetail>("GET", `/api/v1/products/${encodeURIComponent(productId)}`);
}

export async function createOrder(params: {
  service_id: string;
  input: Record<string, string>;
  client_ref: string;
}) {
  const ref = params.client_ref.replace(/[^A-Za-z0-9]/g, "").slice(0, 20);
  return request<HubzellOrderResult>("POST", "/api/v1/orders/create", {
    service_id: params.service_id,
    input: params.input,
    client_ref: ref,
  });
}

export async function getOrderByRef(clientRef: string) {
  return request<HubzellOrderResult>(
    "GET",
    `/api/v1/orders/by-reference/${encodeURIComponent(clientRef)}`
  );
}

export async function getOrderByTxn(transactionId: string) {
  return request<HubzellOrderResult>(
    "GET",
    `/api/v1/orders/by-transaction/${encodeURIComponent(transactionId)}`
  );
}

export function isConfigured() {
  return Boolean(API_KEY && SECRET_KEY);
}
