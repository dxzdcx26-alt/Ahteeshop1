# Ahtee — Clone เว็บร้านเติมเกมอัตโนมัติ (Pixel-perfect + ใช้งานจริง)

โคลนเว็บ [shopdiva.spacexnet.xyz](https://shopdiva.spacexnet.xyz/?page=home) แบบ **เหมือนเป๊ะทุกพิกเซล** และ **ไม่ใช้ mock data (nomock)** — ทุกฟังก์ชันทำงานจริงกับฐานข้อมูลจริง (Prisma + PostgreSQL)

## 🚀 Deploy บน Vercel

โปรเจกต์นี้ถูกปรับให้ deploy บน Vercel ได้แล้ว

### ขั้นตอน

1. **สร้าง PostgreSQL database** (เลือกอย่างใดอย่างหนึ่ง):
   - [Neon](https://neon.tech) (แนะนำ ฟรี)
   - [Supabase](https://supabase.com)
   - [Vercel Postgres](https://vercel.com/storage/postgres)
   - Railway / Aiven

2. **Import โปรเจกต์นี้ใน Vercel**  
   - ไปที่ [vercel.com/new](https://vercel.com/new) → Import Git Repository → เลือก `dxzdcx26-alt/Ahteeshop1`

3. **ตั้งค่า Environment Variable** ใน Vercel Project Settings:
   ```
   DATABASE_URL = postgresql://user:password@host:5432/dbname?sslmode=require
   ```
   (คัดลอก connection string จาก Neon/Supabase)

4. **Deploy** แล้วรอ build เสร็จ

5. **Seed ข้อมูลเริ่มต้น** (หลัง deploy สำเร็จ):
   - รัน local หรือใช้ Vercel CLI / script:
   ```bash
   # ตั้ง DATABASE_URL แล้ว
   bunx prisma db push
   bun run scripts/seed.ts
   ```
   หรือเปิด Terminal ใน Vercel / ใช้ Neon SQL editor รัน migration แล้ว seed เอง

**บัญชีแอดมินเริ่มต้น:** `admin` / `admin1234` *(เปลี่ยนรหัสผ่านทันทีหลังใช้งานจริง)*

---

## จุดเด่น

- 🎨 **เหมือนต้นฉบับทุกอย่าง** — HTML/CSS (styles.css + themes.css), ฟอนต์ Prompt/Kanit, Font Awesome Pro, Bootstrap, jQuery, SweetAlert2, AOS, เอฟเฟกต์เหรียญร่วง (particles.js), tilt effect, สลับโหมดมืด/สว่าง ทั้งหมดดึงจากไฟล์ต้นฉบับ
- 🔀 **Routing แบบเดียวกัน** ด้วย query param: `/?page=home`, `/?page=shop`, `/?page=login`, ...
- 🔌 **API paths เดียวกับต้นฉบับ** (`/services/login.php`, `/services/register.php`, `/services/buybox.php`, `/services/inbox.php`) — สคริปต์ jQuery หน้าเว็บใช้ได้โดยไม่ต้องแก้
- 💾 **ข้อมูลจริงทั้งหมด** — สมาชิก สินค้า หมวดหมู่ คำสั่งซื้อ ยอดเงิน แต้ม วงล้อ รางวัล เก็บใน PostgreSQL ผ่าน Prisma
- 🛠 **หลังบ้านครบ** (`/?page=admin`) — จัดการหมวดหมู่ สินค้า+คลังของ แอพพรีเมี่ยม อนุมัติเติมเงิน โค้ดเงิน รางวัลแลกแต้ม วงล้อ สมาชิก ประกาศ ตั้งค่าร้าน

## หน้าที่มีทั้งหมด

| หน้า | URL | หมายเหตุ |
|---|---|---|
| หน้าแรก | `/?page=home` | hero + ประกาศ + สถิติ (นับจาก DB จริง) + หมวดหมู่แนะนำ + สินค้าแนะนำ |
| ร้านค้า | `/?page=shop` | รายการหมวด → `?page=shop&cat=ID` ดูสินค้าในหมวด |
| สั่งซื้อ | `/?page=buy&id=ID` | หน้าซื้อสินค้า (หักยอดเงิน + ส่งของจากคลังจริง) |
| เติมเงิน | `/?page=payment` | 3 ช่องทางเหมือนต้นฉบับ |
| TrueMoney | `/?page=truemoney` | ส่งลิงก์ซองอั่งเปา → แอดมินอนุมัติ (ระบุจำนวนเงินได้) |
| สลิป | `/?page=slip` | อัปโหลดสลิป → แอดมินอนุมัติ |
| โค้ดเงิน | `/?page=redeem` | กรอกโค้ดจากแอดมิน เติมเงินทันที |
| ข้อมูลบัญชี | `/?page=information` | POINT / แต้มสะสม / เปลี่ยนรหัสผ่าน / Order / ประวัติ |
| ประวัติ | `/?page=history` | คำสั่งซื้อ + ผลวงล้อ ทั้งหมดจาก DB |
| แลกแต้ม | `/?page=reward` | แลกรางวัลด้วยแต้ม (หักแต้มจริง + ส่งของเข้ากล่องข้อความ) |
| สุ่มวงล้อ | `/?page=random_wheel` / `/?page=wheel&id=ID` | วงล้อวาดด้วย canvas, สุ่มถ่วงน้ำหนักฝั่งเซิร์ฟเวอร์ |
| แอพพรีเมี่ยม | `/?page=app` | แคตตาล็อก 42 รายการจริงจากเว็บต้นฉบับ + ซื้อได้ (`/?page=buyapp&id=`) |
| ติดต่อเรา | `/?page=contact` | Facebook / Discord จากการตั้งค่า |
| ค้นหา | `/?page=search&q=...` | ค้นหาสินค้าจริงจาก DB |
| กล่องข้อความ | `/?page=inbox` | อ่าน/อ่านทั้งหมด/ลบ/คัดลอก เหมือนต้นฉบับ |
| หลังบ้าน | `/?page=admin` | สำหรับ admin เท่านั้น |

> หน้าที่ต้องล็อกอิน ถ้ายังไม่ล็อกอินจะแสดงฟอร์มเข้าสู่ระบบ — เหมือนพฤติกรรมต้นฉบับเป๊ะ

## เริ่มใช้งาน (Local)

```bash
bun install
# ตั้ง DATABASE_URL ใน .env เป็น PostgreSQL connection string
bun run db:push        # สร้างตาราง
bun run scripts/seed.ts # สร้าง admin + ตั้งค่า + แคตตาล็อกแอพ
bun run dev            # รันที่พอร์ต 3000
```

**บัญชีแอดมินเริ่มต้น:** `admin` / `admin1234` *(เปลี่ยนรหัสผ่านทันทีหลังใช้งานจริง)*

## เทคโนโลยี

- Next.js 16 (App Router, Route Handlers) + TypeScript
- Prisma ORM + **PostgreSQL** (รองรับ Vercel serverless)
- bcryptjs (เข้ารหัสรหัสผ่าน), session cookie `ahtee_session` (httpOnly)
- Frontend: HTML ต้นฉบับเป๊ะ ๆ + Bootstrap 5.1.3 + jQuery 3.6.4 + SweetAlert2 + DataTables + AOS + Chart.js (จาก CDN เหมือนต้นฉบับ)

## โครงสร้างโค้ด

```
src/app/route.ts              # dispatcher ทุกหน้า ?page=...
src/app/services/*.php/       # API endpoints (ชื่อ path เดียวกับต้นฉบับ)
src/lib/render-core.ts        # shell: head/header/drawer/footer/buy modal (เป๊ะจากต้นฉบับ)
src/lib/render-pages.ts       # มาร์กอัปแต่ละหน้า
src/lib/render-admin.ts       # หลังบ้าน
src/lib/auth-extra.ts         # session/csrf/inbox/tx helpers
public/services/styles/       # styles.css + themes.css ของเว็บต้นฉบับ (ไฟล์จริง)
public/services/js/           # particles.js ของเว็บต้นฉบับ
public/assets/icon/           # ไอคอนทั้งหมดจากเว็บต้นฉบับ
prisma/schema.prisma          # โมเดลฐานข้อมูลทั้งหมด
scripts/seed.ts               # seed ข้อมูลจริงเริ่มต้น
```

## หมายเหตุ

- ข้อมูลต่างจากต้นฉบับจุดเดียว: **สถิติหน้าแรกเป็นตัวเลขจริงจาก DB ของเราเอง** (ต้นฉบับนับจาก DB ของเขา)
- Captcha div (`cf-turnstile`) คงมาร์กอัปเดิมไว้ — ต้นฉบับไม่ได้โหลดสคริปต์ Turnstile จึงแสดงว่างเปล่า และตัว API ไม่ได้บังคับ captcha (เหมือนต้นฉบับ)
- หน้าย่อยบางหน้าของต้นฉบับ (เช่น `?page=truemoney`, `?page=buyapp`) มีบั๊กแสดงฟอร์มล็อกอินแม้ล็อกอินแล้ว — ในโคลนนี้ทำให้ **ใช้งานได้จริง** แทน
- **สำคัญ:** SQLite เดิมไม่รองรับ Vercel serverless → เปลี่ยนเป็น PostgreSQL แล้ว
