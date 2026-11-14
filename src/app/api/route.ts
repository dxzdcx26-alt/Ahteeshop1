import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "AhteeShop API", version: "1.0", status: "ok",
    endpoints: {
      public: [
        { method: "GET", path: "/api/home", description: "หน้าแรกและสถิติร้าน" },
        { method: "GET", path: "/api/contact", description: "ช่องทางติดต่อร้าน" },
        { method: "GET", path: "/api/categories", description: "หมวดหมู่ที่เปิดใช้งาน" },
        { method: "GET", path: "/api/products", description: "สินค้า ค้นหา กรอง และแบ่งหน้า" },
        { method: "GET", path: "/api/search?q=keyword", description: "ค้นหาสินค้า" }
      ],
      authenticated: [
        { method: "GET", path: "/api/me", description: "ข้อมูลบัญชีปัจจุบัน" },
        { method: "GET", path: "/api/shop", description: "หน้าร้านและยอดเงิน" },
        { method: "GET", path: "/api/orders?page=1&limit=20", description: "คำสั่งซื้อของบัญชีปัจจุบัน" },
        { method: "GET", path: "/api/transactions?page=1&limit=20", description: "ธุรกรรมของบัญชีปัจจุบัน" },
        { method: "GET", path: "/api/history", description: "ประวัติและข้อมูลส่งมอบของบัญชีปัจจุบัน" },
        { method: "GET", path: "/api/topup", description: "รายการเติมเงินของบัญชีปัจจุบัน" },
        { method: "GET", path: "/api/rewards", description: "รายการแลกรางวัล" },
        { method: "GET", path: "/api/wheel", description: "ข้อมูลวงล้อ" }
      ],
      admin: [{ method: "GET", path: "/api/admin", description: "ข้อมูลจัดการร้าน (admin only)" }],
      note: "GET endpoints are read-only. State-changing operations use POST."
    }
  });
}
