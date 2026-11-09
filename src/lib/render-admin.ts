// ============ Admin panel renderer — functional, styled with the site's own design system ============
import { esc, fmtBal, fmtNum } from "./render-core";

const pill = (tab: string, label: string, cur: string) =>
  `<a class="nav-link ${tab === cur ? "active" : ""}" href="?page=admin&amp;tab=${tab}">${label}</a>`;

export function adminNav(tab: string): string {
  return `<nav class="navbar navbar-expand-lg admin-nav rounded mt-3 p-2">
  <div class="container-fluid p-0">
    <ul class="navbar-nav nav-pills gap-1 mx-auto">
      ${pill("dash", "<i class='fa-solid fa-gauge-high'></i> แดชบอร์ด", tab)}
      ${pill("cats", "<i class='fa-solid fa-layer-group'></i> หมวดหมู่", tab)}
      ${pill("prods", "<i class='fa-solid fa-box'></i> สินค้า", tab)}
      ${pill("apps", "<i class='fa-solid fa-crown'></i> แอพพรีเมี่ยม", tab)}
      ${pill("topups", "<i class='fa-solid fa-wallet'></i> เติมเงิน", tab)}
      ${pill("codes", "<i class='fa-solid fa-ticket'></i> โค้ดเงิน", tab)}
      ${pill("rewards", "<i class='fa-solid fa-gift'></i> แลกแต้ม", tab)}
      ${pill("wheels", "<i class='fa-solid fa-dharmachakra'></i> วงล้อ", tab)}
      ${pill("users", "<i class='fa-solid fa-users'></i> สมาชิก", tab)}
      ${pill("announce", "<i class='fa-solid fa-bullhorn'></i> ประกาศ", tab)}
      ${pill("settings", "<i class='fa-solid fa-gear'></i> ตั้งค่า", tab)}
    </ul>
  </div>
</nav>`;
}

function wrap(tab: string, title: string, inner: string): string {
  return `<div class="container-fluid p-4">
  ${adminNav(tab)}
  <div class="container-fluid bg-custom rounded p-4 mt-3" data-aos="zoom-in">
    <h3 class="mb-3"><i class="fa-solid fa-shield-halved"></i> หลังบ้าน — ${esc(title)}</h3>
    ${inner}
  </div>
</div>`;
}

function table(head: string[], rows: string[], empty: string): string {
  return `<div class="table-responsive"><table class="table table-striped align-middle">
  <thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.length ? rows.join("") : `<tr><td colspan="${head.length}" class="text-center text-muted">${empty}</td></tr>`}</tbody>
  </table></div>`;
}

const act = (label: string, data: string, cls = "btn-outline-secondary") =>
  `<button class="btn btn-sm ${cls} ad-act" ${data}>${label}</button>`;

export function adminDash(stats: Record<string, number>, pendTopups: number): string {
  const cards = [
    ["สมาชิกทั้งหมด", stats.users, "fa-users"],
    ["หมวดหมู่", stats.cats, "fa-layer-group"],
    ["สินค้า", stats.prods, "fa-box"],
    ["คำสั่งซื้อ", stats.orders, "fa-bag-shopping"],
    ["รอเติมเงิน", pendTopups, "fa-clock"],
    ["แอพพรีเมี่ยม", stats.apps, "fa-crown"],
  ];
  return wrap(
    "dash",
    "แดชบอร์ด",
    `<div class="row g-3">` +
      cards
        .map(
          (c) => `<div class="col-6 col-lg-2"><div class="card p-3 text-center h-100">
      <div class="hx-stat ic mx-auto mb-2" style="width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:var(--c-main)"><i class="fa-solid ${c[2]}" style="color:#1a1406"></i></div>
      <h2 class="h4 mb-0">${fmtNum(c[1] as number)}</h2><small class="text-muted">${c[0]}</small></div></div>`
        )
        .join("") +
      `</div>
  <div class="alert alert-info mt-3 mb-0">ใช้เมนูด้านบนจัดการร้านค้าได้ทุกส่วน — ข้อมูลทั้งหมดเก็บในฐานข้อมูลจริง</div>`
  );
}

export function adminCats(cats: { id: string; name: string; detail: string; image: string; sortOrder: number; active: boolean }[]): string {
  const rows = cats.map(
    (c) => `<tr>
    <td>${esc(c.name)}</td><td>${esc(c.detail)}</td><td>${esc(c.image || "-")}</td><td>${c.sortOrder}</td><td>${c.active ? '<span class="badge bg-success">เปิด</span>' : '<span class="badge bg-danger">ปิด</span>'}</td>
    <td class="text-nowrap">${act("แก้ไข", `data-act="cat_edit" data-id="${esc(c.id)}"`)} ${act("ลบ", `data-act="cat_del" data-id="${esc(c.id)}"`, "btn-outline-danger")}</td>
  </tr>`
  );
  return wrap(
    "cats",
    "หมวดหมู่สินค้า",
    `<button class="btn bg-main mb-3 ad-act" data-act="cat_new"><i class="fa-solid fa-plus"></i> เพิ่มหมวดหมู่</button>
  ${table(["ชื่อ", "รายละเอียด", "รูป", "ลำดับ", "สถานะ", "จัดการ"], rows, "ยังไม่มีหมวดหมู่")}`
  );
}

export function adminProds(
  cats: { id: string; name: string }[],
  prods: { id: string; name: string; price: number; categoryId: string; featured: boolean; active: boolean; stock: number }[]
): string {
  const rows = prods.map(
    (p) => `<tr>
    <td>${esc(p.name)}</td><td>${esc(cats.find((c) => c.id === p.categoryId)?.name || "-")}</td><td>${fmtBal(p.price)}</td><td>${fmtNum(p.stock)}</td>
    <td>${p.featured ? '<span class="badge bg-warning">แนะนำ</span>' : ""} ${p.active ? '<span class="badge bg-success">เปิด</span>' : '<span class="badge bg-danger">ปิด</span>'}</td>
    <td class="text-nowrap">${act("เพิ่มของ", `data-act="stock_add" data-id="${esc(p.id)}"`)} ${act("แก้ไข", `data-act="prod_edit" data-id="${esc(p.id)}"`)} ${act("ลบ", `data-act="prod_del" data-id="${esc(p.id)}"`, "btn-outline-danger")}</td>
  </tr>`
  );
  return wrap(
    "prods",
    "สินค้าและคลังของ",
    `<button class="btn bg-main mb-3 ad-act" data-act="prod_new"><i class="fa-solid fa-plus"></i> เพิ่มสินค้า</button>
  ${table(["ชื่อ", "หมวด", "ราคา", "คงเหลือ", "สถานะ", "จัดการ"], rows, "ยังไม่มีสินค้า")}
  <small class="text-muted">"เพิ่มของ" = เติมไอเทมในคลัง (1 บรรทัดต่อ 1 ชิ้น) ที่จะส่งให้ลูกค้าเมื่อซื้อ</small>`
  );
}

export function adminApps(apps: { id: string; name: string; price: number; stock: number; image: string; active: boolean }[]): string {
  const rows = apps.map(
    (a) => `<tr>
    <td>${esc(a.name)}</td><td>${fmtBal(a.price)}</td><td>${fmtNum(a.stock)}</td><td>${esc(a.image)}</td>
    <td>${a.active ? '<span class="badge bg-success">เปิด</span>' : '<span class="badge bg-danger">ปิด</span>'}</td>
    <td class="text-nowrap">${act("แก้ไข", `data-act="app_edit" data-id="${esc(a.id)}"`)} ${act("ลบ", `data-act="app_del" data-id="${esc(a.id)}"`, "btn-outline-danger")}</td>
  </tr>`
  );
  return wrap(
    "apps",
    "แอพพรีเมี่ยม",
    `<button class="btn bg-main mb-3 ad-act" data-act="app_new"><i class="fa-solid fa-plus"></i> เพิ่มแอพ</button>
  ${table(["ชื่อ", "ราคา", "คงเหลือ", "รูป (URL)", "สถานะ", "จัดการ"], rows, "ยังไม่มีแอพ")}`
  );
}

export function adminTopups(
  topups: { id: string; user: { username: string } | null; amount: number; method: string; reference: string; status: string; createdAt: Date }[]
): string {
  const rows = topups.map((t) => {
    const badge = t.status === "approved" ? '<span class="badge bg-success">อนุมัติ</span>' : t.status === "rejected" ? '<span class="badge bg-danger">ปฏิเสธ</span>' : '<span class="badge bg-warning">รอตรวจ</span>';
    return `<tr>
    <td>${esc(t.user?.username || "-")}</td><td>${fmtBal(t.amount)}</td><td>${esc(t.method)}</td>
    <td style="max-width:280px;word-break:break-all;">${t.reference.startsWith("/uploads") ? `<a href="${esc(t.reference)}" target="_blank"><img src="${esc(t.reference)}" style="max-height:60px;border-radius:6px"></a>` : esc(t.reference)}</td>
    <td>${badge}</td><td>${t.createdAt.toLocaleString("th-TH")}</td>
    <td class="text-nowrap">${t.status === "pending" ? `${act("อนุมัติ", `data-act="topup_ok" data-id="${esc(t.id)}"`, "btn-outline-success")} ${act("ปฏิเสธ", `data-act="topup_no" data-id="${esc(t.id)}"`, "btn-outline-danger")}` : "-"}</td>
  </tr>`;
  });
  return wrap("topups", "รายการเติมเงิน", table(["ผู้ใช้", "จำนวน", "วิธี", "อ้างอิง/สลิป", "สถานะ", "วันที่", "จัดการ"], rows, "ยังไม่มีรายการเติมเงิน"));
}

export function adminCodes(codes: { id: string; code: string; amount: number; used: boolean; usedBy: string }[]): string {
  const rows = codes.map(
    (c) => `<tr><td>${esc(c.code)}</td><td>${fmtBal(c.amount)}</td><td>${c.used ? `<span class="badge bg-secondary">ใช้แล้ว (${esc(c.usedBy)})</span>` : '<span class="badge bg-success">ว่าง</span>'}</td>
    <td>${!c.used ? act("ลบ", `data-act="code_del" data-id="${esc(c.id)}"`, "btn-outline-danger") : "-"}</td></tr>`
  );
  return wrap(
    "codes",
    "โค้ดเติมเงิน",
    `<div class="row g-2 mb-3 align-items-end">
      <div class="col-md-3"><label class="form-label">จำนวนเงิน/โค้ด</label><input type="number" id="code_amount" class="form-control" value="100"></div>
      <div class="col-md-3"><label class="form-label">จำนวนโค้ด</label><input type="number" id="code_count" class="form-control" value="1" min="1" max="100"></div>
      <div class="col-md-3"><button class="btn bg-main ad-act" data-act="code_gen"><i class="fa-solid fa-wand-magic-sparkles"></i> สร้างโค้ด</button></div>
    </div>
    <pre id="code_out" class="p-3 rounded d-none" style="background:#0f0d0a"></pre>
  ${table(["โค้ด", "มูลค่า", "สถานะ", "จัดการ"], rows, "ยังไม่มีโค้ด")}`
  );
}

export function adminRewards(rewards: { id: string; name: string; detail: string; image: string; pointsCost: number; stock: number; active: boolean }[]): string {
  const rows = rewards.map(
    (r) => `<tr><td>${esc(r.name)}</td><td>${fmtNum(r.pointsCost)} แต้ม</td><td>${fmtNum(r.stock)}</td><td>${r.active ? '<span class="badge bg-success">เปิด</span>' : '<span class="badge bg-danger">ปิด</span>'}</td>
    <td class="text-nowrap">${act("แก้ไข", `data-act="rw_edit" data-id="${esc(r.id)}"`)} ${act("ลบ", `data-act="rw_del" data-id="${esc(r.id)}"`, "btn-outline-danger")}</td></tr>`
  );
  return wrap(
    "rewards",
    "รางวัลแลกแต้ม",
    `<button class="btn bg-main mb-3 ad-act" data-act="rw_new"><i class="fa-solid fa-plus"></i> เพิ่มรางวัล</button>
  ${table(["ชื่อ", "แต้ม", "คงเหลือ", "สถานะ", "จัดการ"], rows, "ยังไม่มีรางวัล")}`
  );
}

export function adminWheels(wheels: { id: string; name: string; cost: number; currency: string; active: boolean; prizes: { label: string; type: string; value: number; weight: number; color: string }[] }[]): string {
  const rows = wheels.map((w) => {
    const prizeTxt = w.prizes.map((p) => `${p.label}${p.type !== "none" ? `(${p.value})` : ""}`).join(", ");
    return `<tr><td>${esc(w.name)}</td><td>${w.currency === "points" ? fmtNum(w.cost) + " แต้ม" : fmtBal(w.cost) + " บาท"}</td><td style="max-width:340px">${esc(prizeTxt)}</td>
    <td>${w.active ? '<span class="badge bg-success">เปิด</span>' : '<span class="badge bg-danger">ปิด</span>'}</td>
    <td class="text-nowrap">${act("แก้ไข", `data-act="wh_edit" data-id="${esc(w.id)}"`)} ${act("ลบ", `data-act="wh_del" data-id="${esc(w.id)}"`, "btn-outline-danger")}</td></tr>`;
  });
  return wrap(
    "wheels",
    "วงล้อสุ่มรางวัล",
    `<button class="btn bg-main mb-3 ad-act" data-act="wh_new"><i class="fa-solid fa-plus"></i> เพิ่มวงล้อ</button>
  ${table(["ชื่อ", "ค่าสุ่ม", "รางวัล (label/type:value/weight)", "สถานะ", "จัดการ"], rows, "ยังไม่มีวงล้อ")}
  <small class="text-muted">รางวัลแต่ละช่อง: ชื่อ | none / balance / points + มูลค่า | น้ำหนักสุ่ม — แยกบรรทัด</small>`
  );
}

export function adminUsers(users: { id: string; username: string; role: string; balance: number; points: number; createdAt: Date }[]): string {
  const rows = users.map(
    (u) => `<tr><td>${esc(u.username)}</td><td>${esc(u.role)}</td><td>${fmtBal(u.balance)}</td><td>${fmtNum(u.points)}</td><td>${u.createdAt.toLocaleDateString("th-TH")}</td>
    <td class="text-nowrap">${act("แก้ไข", `data-act="user_edit" data-id="${esc(u.id)}"`)} ${u.role !== "admin" ? act("ลบ", `data-act="user_del" data-id="${esc(u.id)}"`, "btn-outline-danger") : ""}</td></tr>`
  );
  return wrap("users", "สมาชิกทั้งหมด", table(["ชื่อผู้ใช้", "สิทธิ์", "ยอดเงิน", "แต้ม", "สมัครเมื่อ", "จัดการ"], rows, "ยังไม่มีสมาชิก"));
}

export function adminAnnounce(anns: { id: string; text: string; active: boolean }[]): string {
  const rows = anns.map(
    (a) => `<tr><td>${esc(a.text)}</td><td>${a.active ? '<span class="badge bg-success">เปิด</span>' : '<span class="badge bg-danger">ปิด</span>'}</td>
    <td class="text-nowrap">${act(a.active ? "ปิด" : "เปิด", `data-act="ann_toggle" data-id="${esc(a.id)}"`)} ${act("ลบ", `data-act="ann_del" data-id="${esc(a.id)}"`, "btn-outline-danger")}</td></tr>`
  );
  return wrap(
    "announce",
    "ประกาศหน้าแรก",
    `<div class="row g-2 mb-3 align-items-end">
      <div class="col-md-8"><label class="form-label">ข้อความประกาศ</label><input type="text" id="ann_text" class="form-control" placeholder="ยินดีต้อนรับ"></div>
      <div class="col-md-3"><button class="btn bg-main ad-act" data-act="ann_add"><i class="fa-solid fa-plus"></i> เพิ่มประกาศ</button></div>
    </div>
  ${table(["ข้อความ", "สถานะ", "จัดการ"], rows, "ยังไม่มีประกาศ")}`
  );
}

export function adminSettings(st: Record<string, string>): string {
  const fields: [string, string, string][] = [
    ["site_name", "ชื่อร้าน (โลโก้ตัวอักษร)", "AhteeShop"],
    ["site_title", "Title เว็บ", "AhteeShop | เติมเกมอัตโนมัติ 24 ชม."],
    ["site_desc", "คำอธิบายเว็บ (og:description)", "AhteeShop — ร้านเติมเกมและแอพพรีเมี่ยมอัตโนมัติ 24 ชม."],
    ["hero_lead", "ข้อความใต้ชื่อหน้าแรก", "เติมเกมไว ปลอดภัย 24 ชม."],
    ["foot_brand", "ข้อความท้ายเว็บ (ฝั่งซ้าย)", "AhteeShop — เติมเกมไว ปลอดภัย 24 ชม."],
    ["foot_copy", "ลิขสิทธิ์ท้ายเว็บ", "2025 AhteeShop, All right reserved."],
    ["foot_report_url", "ลิงก์แจ้งปัญหา (ท้ายเว็บ)", "https://discord.gg/dfnxcloud"],
    ["foot_report_text", "ข้อความแจ้งปัญหา", "ติดต่อเจ้าของร้านไม่ได้ / แจ้งปัญหาร้านค้าโกง"],
    ["contact_facebook_url", "ลิงก์ Facebook", ""],
    ["contact_discord_url", "ลิงก์ Discord", ""],
  ];
  return wrap(
    "settings",
    "ตั้งค่าร้าน",
    fields
      .map(
        ([k, label, def]) =>
          `<div class="mb-2"><label class="form-label">${esc(label)} <small class="text-muted">(${k})</small></label><input type="text" class="form-control st-field" data-key="${k}" value="${esc(st[k] ?? def)}"></div>`
      )
      .join("") +
    `<button class="btn bg-main mt-2 ad-act" data-act="settings_save"><i class="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่า</button>`
  );
}
