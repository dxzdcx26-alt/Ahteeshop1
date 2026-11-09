"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSite, baht } from "./store";
import { Fa } from "./fa-icons";
import Swal from "sweetalert2";

const MORE_ITEMS = [
  { page: "random_wheel", label: "สุ่มวงล้อ", icon: "wheel" as const },
  { page: "reward", label: "แลกแต้ม", icon: "gift" as const },
  { page: "app", label: "แอพพรีเมี่ยม", icon: "crown" as const },
  { page: "contact", label: "ติดต่อเรา", icon: "phone" as const },
];

const MAIN_ITEMS = [
  { page: "home", label: "หน้าหลัก", icon: "house" as const },
  { page: "shop", label: "ร้านค้า", icon: "store" as const },
  { page: "payment", label: "เติมเงิน", icon: "wallet" as const },
];

export function Nav() {
  const params = useSearchParams();
  const page = params.get("page") || "home";
  const { nav, user, setUser, toggleMode } = useSite();
  const [moreOpen, setMoreOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setMoreOpen(false);
        setAccOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawer(false);
    if (!searchQ.trim()) return;
    nav("search", { q: searchQ.trim() });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccOpen(false);
    Swal.fire({ icon: "success", title: "ออกจากระบบแล้ว", timer: 1400, showConfirmButton: false });
    nav("home");
  };

  const activeMain = MAIN_ITEMS.find((i) => i.page === page)?.page;
  const activeMore = MORE_ITEMS.find((i) => i.page === page)?.page;

  const goDrawer = (p: string) => {
    setDrawer(false);
    nav(p);
  };

  return (
    <>
      <header className="dn-wrap">
        <nav className="dn" id="mainNav" aria-label="เมนูหลัก" ref={wrapRef as React.RefObject<HTMLElement>}>
          <a
            className="dn-brand"
            href="/?page=home"
            aria-label="Ahtee"
            style={{ ["--logo-h" as string]: "40px" }}
            onClick={(e) => {
              e.preventDefault();
              nav("home");
            }}
          />
          <form className="dn-search" role="search" onSubmit={doSearch}>
            <span className="ic">
              <Fa n="magnifying" size={14} />
            </span>
            <input
              type="search"
              name="q"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              aria-label="ค้นหาสินค้า"
              autoComplete="off"
            />
          </form>

          <div className="dn-links">
            {MAIN_ITEMS.map(({ page: p, label, icon }) => (
              <a
                key={p}
                className={`dn-link ${activeMain === p ? "is-active" : ""}`}
                href={`/?page=${p}`}
                aria-current={activeMain === p ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  nav(p);
                }}
              >
                <Fa n={icon} size={15} />
                <span>{label}</span>
              </a>
            ))}
            <div className="dn-dd">
              <button
                className={`dn-link ${activeMore ? "is-active" : ""}`}
                type="button"
                aria-expanded={moreOpen}
                onClick={() => {
                  setMoreOpen(!moreOpen);
                  setAccOpen(false);
                }}
              >
                <Fa n="grip" size={15} />
                <span>เพิ่มเติม</span>
                <Fa n="chevron" size={9} className="dn-caret" />
              </button>
              {moreOpen && (
                <div className="dn-menu-pop">
                  {MORE_ITEMS.map(({ page: p, label, icon }) => (
                    <a
                      key={p}
                      className={`mi ${activeMore === p ? "is-active" : ""}`}
                      href={`/?page=${p}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMoreOpen(false);
                        nav(p);
                      }}
                    >
                      <Fa n={icon} size={16} />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dn-right">
            <button
              className="dn-icon dn-mode"
              type="button"
              aria-label="สลับโหมดมืด/สว่าง"
              title="สลับโหมดมืด/สว่าง"
              onClick={toggleMode}
            >
              <Fa n="moon" size={15} className="ic-moon" />
              <Fa n="sun" size={15} className="ic-sun" />
            </button>

            {user ? (
              <div className="dn-dd">
                <button
                  className="dn-ava"
                  type="button"
                  aria-label="บัญชีผู้ใช้"
                  onClick={() => {
                    setAccOpen(!accOpen);
                    setMoreOpen(false);
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </button>
                {accOpen && (
                  <div className="dn-menu-pop">
                    <div className="dn-acc-head">
                      <div className="dn-ava" style={{ cursor: "default" }} aria-hidden>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <b>{user.username}</b>
                        <small>{user.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}</small>
                      </div>
                    </div>
                    <div className="dn-acc-wallet">
                      <div className="w">
                        ยอดเงินคงเหลือ
                        <b>{baht(user.balance)} บาท</b>
                      </div>
                      <div className="w">
                        คะแนนสะสม
                        <b>{user.points.toLocaleString()} แต้ม</b>
                      </div>
                    </div>
                    <a
                      className="mi"
                      href="/?page=payment"
                      onClick={(e) => {
                        e.preventDefault();
                        setAccOpen(false);
                        nav("payment");
                      }}
                    >
                      <Fa n="wallet" size={16} />
                      <span>เติมเงิน</span>
                    </a>
                    <a
                      className="mi"
                      href="/?page=history"
                      onClick={(e) => {
                        e.preventDefault();
                        setAccOpen(false);
                        nav("history");
                      }}
                    >
                      <Fa n="history" size={16} />
                      <span>ประวัติการซื้อ</span>
                    </a>
                    {user.role === "admin" && (
                      <a
                        className="mi"
                        href="/?page=admin"
                        onClick={(e) => {
                          e.preventDefault();
                          setAccOpen(false);
                          nav("admin");
                        }}
                      >
                        <Fa n="shield" size={16} />
                        <span>หลังบ้าน</span>
                      </a>
                    )}
                    <button className="mi" type="button" onClick={logout}>
                      <Fa n="logout" size={16} />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a
                  className="dn-btn-ghost"
                  href="/?page=login"
                  onClick={(e) => {
                    e.preventDefault();
                    nav("login");
                  }}
                >
                  เข้าสู่ระบบ
                </a>
                <a
                  className="dn-btn"
                  href="/?page=register"
                  onClick={(e) => {
                    e.preventDefault();
                    nav("register");
                  }}
                >
                  สมัครสมาชิก
                </a>
              </>
            )}

            <button
              className="dn-icon dn-burger"
              type="button"
              aria-label="เปิดเมนู"
              onClick={() => setDrawer(true)}
            >
              <Fa n="bars" size={16} />
            </button>
          </div>
        </nav>
      </header>

      {/* mobile drawer */}
      <div className={`drawer-mask ${drawer ? "open" : ""}`} onClick={() => setDrawer(false)} />
      <aside className={`drawer ${drawer ? "open" : ""}`} aria-label="เมนู">
        <div className="drawer-head">
          <span style={{ fontWeight: 700, color: "var(--c-heading)" }}>Ahtee</span>
          <button className="dn-icon" type="button" aria-label="ปิด" onClick={() => setDrawer(false)}>
            <Fa n="xmark" size={16} />
          </button>
        </div>
        <form className="dn-search dn-search-m" role="search" onSubmit={doSearch} style={{ marginBottom: 12 }}>
          <span className="ic">
            <Fa n="magnifying" size={14} />
          </span>
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            aria-label="ค้นหาสินค้า"
          />
        </form>
        {MAIN_ITEMS.map(({ page: p, label, icon }) => (
          <a
            key={p}
            className={`dn-item-m ${page === p ? "is-active" : ""}`}
            href={`/?page=${p}`}
            onClick={(e) => {
              e.preventDefault();
              goDrawer(p);
            }}
          >
            <Fa n={icon} size={17} />
            <span>{label}</span>
          </a>
        ))}
        {MORE_ITEMS.map(({ page: p, label, icon }) => (
          <a
            key={p}
            className={`dn-item-m ${page === p ? "is-active" : ""}`}
            href={`/?page=${p}`}
            onClick={(e) => {
              e.preventDefault();
              goDrawer(p);
            }}
          >
            <Fa n={icon} size={17} />
            <span>{label}</span>
          </a>
        ))}
        {user ? (
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <button className="dn-item-m" type="button" onClick={() => goDrawer("history")}>
              <Fa n="history" size={17} />
              <span>ประวัติการซื้อ</span>
            </button>
            <button className="dn-item-m" type="button" onClick={logout}>
              <Fa n="logout" size={17} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <a
              className="dn-btn"
              href="/?page=register"
              onClick={(e) => {
                e.preventDefault();
                goDrawer("register");
              }}
            >
              สมัครสมาชิก
            </a>
            <a
              className="dn-btn-ghost"
              href="/?page=login"
              onClick={(e) => {
                e.preventDefault();
                goDrawer("login");
              }}
              style={{ border: "1px solid var(--c-card-border)", borderRadius: "var(--btn-r)" }}
            >
              เข้าสู่ระบบ
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
