"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSite, baht } from "../store";
import Swal from "sweetalert2";

type AdmData = {
  members: { id: string; username: string; role: string; balance: number; points: number; createdAt: string }[];
  categories: { id: string; name: string; detail: string; image: string; sortOrder: number; _count: { products: number } }[];
  products: { id: string; name: string; categoryId: string; category: { name: string }; price: number; featured: boolean; active: boolean; image: string; detail: string; _count: { items: number } }[];
  orders: { id: string; orderNo: string; productName: string; quantity: number; total: number; createdAt: string }[];
  topups: { id: string; amount: number; method: string; reference: string; status: string; createdAt: string; user: { username: string } }[];
  announcements: { id: string; text: string; active: boolean }[];
  settings: Record<string, string>;
  wheel: { id: string; label: string; type: string; value: number; weight: number; color: string }[];
  rewards: { id: string; name: string; pointsCost: number; stock: number }[];
  items: { sold: number; total: number };
};

const TABS = [
  ["overview", "ภาพรวม"],
  ["topups", "เติมเงิน"],
  ["products", "สินค้า"],
  ["categories", "หมวดหมู่"],
  ["announcements", "ประกาศ"],
  ["wheel", "วงล้อ"],
  ["rewards", "แลกแต้ม"],
  ["settings", "ตั้งค่า"],
] as const;

export function AdminView() {
  const { refreshHome } = useSite();
  const [data, setData] = useState<AdmData | null>(null);
  const [tab, setTab] = useState<string>("overview");
  const [ver, setVer] = useState(0);

  const load = useCallback(() => {
    fetch("/api/admin", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.status) {
          setData(d);
          setVer((v) => v + 1);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (body: Record<string, unknown>, reload = true) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    Swal.fire({
      icon: d.status ? "success" : "error",
      title: d.status ? "สำเร็จ" : "ผิดพลาด",
      text: d.message,
      timer: d.status ? 1400 : undefined,
      showConfirmButton: !d.status,
    });
    if (d.status && reload) {
      load();
      refreshHome();
    }
    return d;
  };

  if (!data) return <div className="container-x hx"><div className="hx-empty card-x">กำลังโหลดข้อมูลหลังบ้าน...</div></div>;

  return (
    <div className="container-x hx">
      <div className="hx-head">
        <div className="hx-head-t">
          <div>
            <span className="hx-kicker">Admin</span>
            <h2>หลังบ้านจัดการร้าน</h2>
          </div>
        </div>
      </div>

      <div className="adm-tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={`adm-tab ${tab === k ? "is-on" : ""}`} onClick={() => setTab(k)} type="button">
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="adm-grid">
            <div className="card-x hx-stat"><div className="ic">{data.members.length}</div><div><div className="lbl">สมาชิก</div></div></div>
            <div className="card-x hx-stat"><div className="ic">{data.categories.length}</div><div><div className="lbl">หมวดหมู่</div></div></div>
            <div className="card-x hx-stat"><div className="ic">{data.items.total - data.items.sold}</div><div><div className="lbl">สต๊อกคงเหลือ</div></div></div>
            <div className="card-x hx-stat"><div className="ic">{data.orders.length}</div><div><div className="lbl">ออเดอร์รวม</div></div></div>
          </div>
          <section className="hx-sec">
            <h3 style={{ marginBottom: "0.8rem" }}>ออเดอร์ล่าสุด</h3>
            <div className="card-x" style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr><th>วันที่</th><th>เลขออเดอร์</th><th>สินค้า</th><th>จำนวน</th><th>ยอด</th></tr>
                </thead>
                <tbody>
                  {data.orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--c-muted)" }}>ยังไม่มีออเดอร์</td></tr>
                  ) : (
                    data.orders.slice(0, 10).map((o) => (
                      <tr key={o.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleString("th-TH")}</td>
                        <td>{o.orderNo}</td>
                        <td>{o.productName}</td>
                        <td>{o.quantity}</td>
                        <td>{baht(o.total)} ฿</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "topups" && (
        <div className="card-x" style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr><th>วันที่</th><th>ผู้ใช้</th><th>จำนวน</th><th>วิธี</th><th>อ้างอิง</th><th>สถานะ</th><th>ดำเนินการ</th></tr>
            </thead>
            <tbody>
              {data.topups.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--c-muted)" }}>ยังไม่มีรายการเติมเงิน</td></tr>
              ) : (
                data.topups.map((t) => (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(t.createdAt).toLocaleString("th-TH")}</td>
                    <td>{t.user.username}</td>
                    <td>{baht(t.amount)} ฿</td>
                    <td>{t.method}</td>
                    <td>{t.reference}</td>
                    <td>
                      {t.status === "approved" ? <span className="badge-x badge-ok">อนุมัติ</span> : t.status === "rejected" ? <span className="badge-x badge-danger">ปฏิเสธ</span> : <span className="badge-x badge-warn">รอตรวจ</span>}
                    </td>
                    <td>
                      {t.status === "pending" ? (
                        <span style={{ display: "flex", gap: 6 }}>
                          <button className="a-btn solid-ok sm" onClick={() => act({ action: "topup.process", id: t.id, approve: true })} type="button">อนุมัติ</button>
                          <button className="a-btn danger sm" onClick={() => act({ action: "topup.process", id: t.id, approve: false })} type="button">ปฏิเสธ</button>
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "products" && <ProductsTab data={data} act={act} />}
      {tab === "categories" && <CategoriesTab data={data} act={act} />}
      {tab === "announcements" && <AnnouncementsTab data={data} act={act} />}
      {tab === "wheel" && <WheelTab key={ver} data={data} act={act} />}
      {tab === "rewards" && <RewardsTab data={data} act={act} />}
      {tab === "settings" && <SettingsTab key={ver} data={data} act={act} />}
    </div>
  );
}

type ActFn = (body: Record<string, unknown>, reload?: boolean) => Promise<{ status: boolean }>;

function ProductsTab({ data, act }: { data: AdmData; act: ActFn }) {
  const [form, setForm] = useState({ id: "", categoryId: "", name: "", detail: "", image: "", price: "", featured: false });
  const [stock, setStock] = useState({ productId: "", payloads: "" });

  const edit = (p: (typeof data.products)[number]) =>
    setForm({ id: p.id, categoryId: p.categoryId, name: p.name, detail: p.detail, image: p.image, price: String(p.price), featured: p.featured });

  return (
    <div className="pay-grid">
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>{form.id ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h3>
        <label className="form-lbl">หมวดหมู่</label>
        <select className="form-in" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">— เลือกหมวด —</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div style={{ height: 10 }} />
        <label className="form-lbl">ชื่อสินค้า</label>
        <input className="form-in" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div style={{ height: 10 }} />
        <label className="form-lbl">ราคา (บาท)</label>
        <input className="form-in" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <div style={{ height: 10 }} />
        <label className="form-lbl">รูป (URL — ไม่ใส่ได้)</label>
        <input className="form-in" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <div style={{ height: 10 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          แสดงเป็นสินค้าแนะนำ
        </label>
        <button
          className="a-btn bg-main"
          style={{ width: "100%", marginTop: 14 }}
          onClick={async () => {
            const r = await act({ action: "product.save", ...form, price: parseFloat(form.price) || 0 });
            if (r.status) setForm({ id: "", categoryId: "", name: "", detail: "", image: "", price: "", featured: false });
          }}
          type="button"
        >
          บันทึกสินค้า
        </button>
      </div>

      <div>
        <div className="card-x" style={{ padding: "1.2rem", marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.8rem" }}>เติมสต๊อกรหัสสินค้า</h3>
          <label className="form-lbl">สินค้า</label>
          <select className="form-in" value={stock.productId} onChange={(e) => setStock({ ...stock, productId: e.target.value })}>
            <option value="">— เลือกสินค้า —</option>
            {data.products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div style={{ height: 10 }} />
          <label className="form-lbl">รหัส (บรรทัดละ 1 ชิ้น)</label>
          <textarea className="stock-area" value={stock.payloads} onChange={(e) => setStock({ ...stock, payloads: e.target.value })} />
          <button className="a-btn bg-main" style={{ width: "100%", marginTop: 12 }} onClick={() => act({ action: "stock.add", ...stock })} type="button">
            เติมสต๊อก
          </button>
        </div>

        <div className="card-x" style={{ padding: "1.2rem" }}>
          <h3 style={{ marginBottom: "0.8rem" }}>รายการสินค้า ({data.products.length})</h3>
          {data.products.length === 0 ? (
            <div style={{ color: "var(--c-muted)", textAlign: "center", padding: "1rem" }}>ยังไม่มีสินค้า</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>สินค้า</th><th>หมวด</th><th>ราคา</th><th>สต๊อก</th><th></th></tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.category.name}</td>
                    <td>{baht(p.price)} ฿</td>
                    <td>{p._count.items}</td>
                    <td>
                      <span style={{ display: "flex", gap: 6 }}>
                        <button className="a-btn outline sm" onClick={() => edit(p)} type="button">แก้ไข</button>
                        <button className="a-btn danger sm" onClick={() => act({ action: "product.delete", id: p.id })} type="button">ลบ</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ data, act }: { data: AdmData; act: ActFn }) {
  const [form, setForm] = useState({ id: "", name: "", detail: "", image: "", sortOrder: "0" });
  return (
    <div className="pay-grid">
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>{form.id ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h3>
        <label className="form-lbl">ชื่อหมวดหมู่</label>
        <input className="form-in" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div style={{ height: 10 }} />
        <label className="form-lbl">คำอธิบาย</label>
        <input className="form-in" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
        <div style={{ height: 10 }} />
        <label className="form-lbl">รูปแบนเนอร์ (URL)</label>
        <input className="form-in" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <button
          className="a-btn bg-main"
          style={{ width: "100%", marginTop: 14 }}
          onClick={async () => {
            const r = await act({ action: "category.save", ...form });
            if (r.status) setForm({ id: "", name: "", detail: "", image: "", sortOrder: "0" });
          }}
          type="button"
        >
          บันทึก
        </button>
      </div>
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>หมวดหมู่ทั้งหมด ({data.categories.length})</h3>
        {data.categories.length === 0 ? (
          <div style={{ color: "var(--c-muted)", textAlign: "center", padding: "1rem" }}>ยังไม่มีหมวดหมู่</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>ชื่อ</th><th>สินค้า</th><th></th></tr>
            </thead>
            <tbody>
              {data.categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c._count.products}</td>
                  <td>
                    <span style={{ display: "flex", gap: 6 }}>
                      <button className="a-btn outline sm" onClick={() => setForm({ id: c.id, name: c.name, detail: c.detail, image: c.image, sortOrder: String(c.sortOrder) })} type="button">แก้ไข</button>
                      <button className="a-btn danger sm" onClick={() => act({ action: "category.delete", id: c.id })} type="button">ลบ</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AnnouncementsTab({ data, act }: { data: AdmData; act: ActFn }) {
  const [text, setText] = useState("");
  return (
    <div className="pay-grid">
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>เพิ่มประกาศ</h3>
        <input className="form-in" placeholder="ข้อความประกาศ เช่น ยินดีต้อนรับ" value={text} onChange={(e) => setText(e.target.value)} />
        <button
          className="a-btn bg-main"
          style={{ width: "100%", marginTop: 12 }}
          onClick={async () => {
            const r = await act({ action: "announcement.save", text });
            if (r.status) setText("");
          }}
          type="button"
        >
          เพิ่มประกาศ
        </button>
      </div>
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>ประกาศทั้งหมด</h3>
        {data.announcements.length === 0 ? (
          <div style={{ color: "var(--c-muted)", textAlign: "center", padding: "1rem" }}>ยังไม่มีประกาศ</div>
        ) : (
          data.announcements.map((a) => (
            <div key={a.id} className="mrow" style={{ borderBottom: "1px solid var(--c-card-border)", padding: "8px 0" }}>
              <span>{a.text} {a.active ? "" : "(ปิด)"}</span>
              <span style={{ display: "flex", gap: 6 }}>
                <button className="a-btn outline sm" onClick={() => act({ action: "announcement.save", id: a.id, text: a.text, active: !a.active })} type="button">
                  {a.active ? "ปิด" : "เปิด"}
                </button>
                <button className="a-btn danger sm" onClick={() => act({ action: "announcement.delete", id: a.id })} type="button">ลบ</button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WheelTab({ data, act }: { data: AdmData; act: ActFn }) {
  const [rows, setRows] = useState(
    data.wheel.map((w) => ({ id: w.id, label: w.label, type: w.type, value: String(w.value), weight: String(w.weight), color: w.color }))
  );

  return (
    <div className="pay-grid" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>รางวัลวงล้อ</h3>
        {rows.map((r, i) => (
          <div key={r.id || i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input className="form-in" value={r.label} placeholder="ชื่อรางวัล" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <select className="form-in" value={r.type} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
              <option value="none">ไม่ได้รางวัล</option>
              <option value="balance">เงิน</option>
              <option value="points">แต้ม</option>
            </select>
            <input className="form-in" type="number" value={r.value} placeholder="ค่า" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            <input className="form-in" type="number" value={r.weight} placeholder="น้ำหนัก" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)))} />
            <input type="color" value={r.color} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} style={{ width: 34, height: 34, border: 0, background: "none" }} aria-label="สีช่อง" />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="a-btn outline" onClick={() => setRows([...rows, { id: "", label: "", type: "none", value: "0", weight: "10", color: "#d4af37" }])} type="button">
            + เพิ่มช่อง
          </button>
          <button
            className="a-btn bg-main"
            onClick={() =>
              act({
                action: "wheel.save",
                prizes: rows.map((r) => ({ ...r, value: parseFloat(r.value) || 0, weight: parseInt(r.weight) || 0 })),
              })
            }
            type="button"
          >
            บันทึกวงล้อ
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardsTab({ data, act }: { data: AdmData; act: ActFn }) {
  const [form, setForm] = useState({ name: "", detail: "", pointsCost: "", stock: "" });
  return (
    <div className="pay-grid">
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>เพิ่มรางวัลแลกแต้ม</h3>
        <label className="form-lbl">ชื่อรางวัล</label>
        <input className="form-in" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div style={{ height: 10 }} />
        <label className="form-lbl">แต้มที่ใช้แลก</label>
        <input className="form-in" type="number" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: e.target.value })} />
        <div style={{ height: 10 }} />
        <label className="form-lbl">จำนวน (สต๊อก)</label>
        <input className="form-in" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <button
          className="a-btn bg-main"
          style={{ width: "100%", marginTop: 14 }}
          onClick={async () => {
            const r = await act({ action: "reward.save", ...form, pointsCost: parseInt(form.pointsCost) || 0, stock: parseInt(form.stock) || 0 });
            if (r.status) setForm({ name: "", detail: "", pointsCost: "", stock: "" });
          }}
          type="button"
        >
          บันทึกรางวัล
        </button>
      </div>
      <div className="card-x" style={{ padding: "1.2rem" }}>
        <h3 style={{ marginBottom: "0.8rem" }}>รางวัลทั้งหมด</h3>
        {data.rewards.length === 0 ? (
          <div style={{ color: "var(--c-muted)", textAlign: "center", padding: "1rem" }}>ยังไม่มีรางวัล</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>ชื่อ</th><th>แต้ม</th><th>คงเหลือ</th><th></th></tr>
            </thead>
            <tbody>
              {data.rewards.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.pointsCost}</td>
                  <td>{r.stock}</td>
                  <td>
                    <button className="a-btn danger sm" onClick={() => act({ action: "reward.delete", id: r.id })} type="button">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const SETTING_FIELDS: [string, string][] = [
  ["siteName", "ชื่อร้าน"],
  ["heroBadge", "แถบข้อความเหนือชื่อร้าน"],
  ["heroLead", "ข้อความใต้ชื่อร้าน"],
  ["footerText", "ข้อความท้ายเว็บ"],
  ["facebookUrl", "ลิงก์ Facebook"],
  ["discordUrl", "ลิงก์ Discord"],
  ["paymentInfo", "ข้อมูลบัญชีเติมเงิน (ขึ้นบรรทัดใหม่ได้)"],
  ["wheelCostPoints", "ค่าสุ่มวงล้อ (แต้ม)"],
  ["appInfo", "รายละเอียดแอพพรีเมี่ยม"],
  ["appLink", "ลิงก์ดาวน์โหลดแอพ"],
];

function SettingsTab({ data, act }: { data: AdmData; act: ActFn }) {
  const [form, setForm] = useState<Record<string, string>>(data.settings);
  return (
    <div className="card-x" style={{ padding: "1.2rem", maxWidth: 720 }}>
      <h3 style={{ marginBottom: "0.8rem" }}>ตั้งค่าร้านค้า</h3>
      {SETTING_FIELDS.map(([key, label]) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <label className="form-lbl">{label}</label>
          {key === "paymentInfo" ? (
            <textarea className="stock-area" value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          ) : (
            <input className="form-in" value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          )}
        </div>
      ))}
      <button className="a-btn bg-main" style={{ width: "100%", marginTop: 10 }} onClick={() => act({ action: "settings.save", settings: form })} type="button">
        บันทึกการตั้งค่า
      </button>
    </div>
  );
}
