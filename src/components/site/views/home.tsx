"use client";

import React from "react";
import { useSite, useCountUp, baht } from "../store";
import { Fa } from "../fa-icons";

function StatCard({
  icon,
  value,
  label,
}: {
  icon: "users" | "layers" | "box" | "bag";
  value: number;
  label: string;
}) {
  const { ref, val } = useCountUp(value);
  return (
    <div className="hx-stat card-x">
      <div className="ic">
        <Fa n={icon} size={22} />
      </div>
      <div>
        <div className="num" ref={ref}>
          {val.toLocaleString()}
        </div>
        <div className="lbl">{label}</div>
      </div>
    </div>
  );
}

export function HomeView() {
  const { home, nav } = useSite();
  const s = home?.settings || {};
  const announcements = home?.announcements || [];
  const annText = announcements.length ? announcements.join(" • ") : "ยินดีต้อนรับ";
  const stats = home?.stats || { members: 0, categories: 0, productsReady: 0, sold: 0 };

  return (
    <div className="container-x hx">
      <section className="hx-hero">
        <div className="hx-hero-top">
          <div className="hx-hero-txt">
            {s.heroBadge ? (
              <span className="hx-badge">
                <span className="dot" /> {s.heroBadge}
              </span>
            ) : null}
            <h1>
              <span className="hx-grad">{s.siteName || "Ahtee"}</span>
            </h1>
            <div className="hx-lead">{s.heroLead || s.siteName || "Ahtee"}</div>
          </div>
          <div className="hx-cta">
            <a
              className="a-btn bg-main"
              href="/?page=shop"
              onClick={(e) => {
                e.preventDefault();
                nav("shop");
              }}
            >
              <Fa n="bag" size={16} /> เลือกซื้อสินค้า
            </a>
            <a
              className="a-btn outline"
              href="/?page=payment"
              onClick={(e) => {
                e.preventDefault();
                nav("payment");
              }}
            >
              <Fa n="wallet" size={16} /> เติมเงิน
            </a>
          </div>
        </div>

        <div className="hx-ticker card-x">
          <span className="lbl">
            <Fa n="bullhorn" size={15} /> ประกาศ
          </span>
          <div className="win">
            <span className="track">{annText}</span>
          </div>
        </div>
      </section>

      <section className="hx-sec">
        <div className="hx-stats">
          <StatCard icon="users" value={stats.members} label="สมาชิกทั้งหมด (คน)" />
          <StatCard icon="layers" value={stats.categories} label="หมวดหมู่ (หมวด)" />
          <StatCard icon="box" value={stats.productsReady} label="พร้อมจำหน่าย (ชิ้น)" />
          <StatCard icon="bag" value={stats.sold} label="จำหน่ายแล้ว (ครั้ง)" />
        </div>
      </section>

      <section className="hx-sec">
        <div className="hx-duo-col">
          <div className="hx-head">
            <div className="hx-head-t">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/category.svg" alt="" className="hx-head-ic" />
              <div>
                <span className="hx-kicker">Categories</span>
                <h2>หมวดหมู่แนะนำ</h2>
              </div>
            </div>
            <a
              className="a-btn outline sm hx-more"
              href="/?page=shop"
              onClick={(e) => {
                e.preventDefault();
                nav("shop");
              }}
            >
              ดูทั้งหมด <Fa n="arrowRight" size={13} />
            </a>
          </div>
          {home && home.categories.length > 0 ? (
            <div className="hx-cat-cards">
              {home.categories.slice(0, 4).map((c) => (
                <a
                  key={c.id}
                  className="hx-cat-card"
                  href="/?page=shop"
                  onClick={(e) => {
                    e.preventDefault();
                    nav("shop");
                  }}
                >
                  <div className="im">
                    {c.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={c.image} alt={c.name} />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src="/icons/category.svg" alt="" style={{ height: "60%", width: "auto" }} />
                    )}
                  </div>
                  <div className="cap">
                    <b>{c.name}</b>
                    <small>{c.detail || `สินค้า ${c.productCount} รายการ`}</small>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="hx-empty card-x">ยังไม่มีหมวดหมู่</div>
          )}
        </div>
      </section>

      <section className="hx-sec">
        <div className="hx-head">
          <div className="hx-head-t">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/fire.svg" alt="" className="hx-head-ic" />
            <div>
              <span className="hx-kicker">Recommended</span>
              <h2>สินค้าแนะนำ</h2>
            </div>
          </div>
          <a
            className="a-btn outline sm hx-more"
            href="/?page=shop"
            onClick={(e) => {
              e.preventDefault();
              nav("shop");
            }}
          >
            ดูทั้งหมด <Fa n="arrowRight" size={13} />
          </a>
        </div>
        {home && home.featured.length > 0 ? (
          <div className="hx-prods">
            {home.featured.map((p) => (
              <div key={p.id} className={`hx-prod card-x fx-tilt ${p.stock < 1 ? "is-out" : ""}`}>
                <div className="im">
                  <span className={`stock ${p.stock < 1 ? "out" : ""}`}>
                    {p.stock < 1 ? "สินค้าหมด" : `เหลือ ${p.stock}`}
                  </span>
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.image} alt={p.name} />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src="/icons/box.svg" alt="" className="ph-ic" />
                  )}
                </div>
                <div className="bd">
                  <div className="nm">{p.name}</div>
                  <div className="hx-prod-row">
                    <span className="stk">{p.stock < 1 ? "สินค้าหมด" : "พร้อมขาย"}</span>
                    <span className="pill">{baht(p.price)} ฿</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hx-empty card-x">ยังไม่มีสินค้า</div>
        )}
      </section>
    </div>
  );
}
