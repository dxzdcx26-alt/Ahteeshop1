"use client";

import React, { useEffect, useRef, useState } from "react";
import { Fa } from "../fa-icons";
import { useSite } from "../store";
import Swal from "sweetalert2";

/* ---------------- สุ่มวงล้อ ---------------- */

type WheelPrize = { id: string; label: string; color: string };

export function WheelView() {
  const { user, setUser } = useSite();
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [cost, setCost] = useState(0);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const segRef = useRef(360 / 6);

  const load = () =>
    fetch("/api/wheel", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.status) {
          setPrizes(d.prizes);
          setCost(d.cost);
          segRef.current = 360 / Math.max(1, d.prizes.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const conic = () => {
    const n = Math.max(1, prizes.length);
    const seg = 360 / n;
    const stops = prizes.map((p, i) => `${p.color} ${i * seg}deg ${(i + 1) * seg}deg`);
    return `conic-gradient(${stops.join(", ")})`;
  };

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      const res = await fetch("/api/wheel", { method: "POST" });
      const data = await res.json();
      if (data.status) {
        setUser(data.user);
        const n = prizes.length;
        const seg = 360 / n;
        // land the pointer (top) in the middle of the chosen segment
        const target = 360 * 6 + (360 - (data.index * seg + seg / 2));
        setAngle((a) => a + target);
        setTimeout(() => {
          setSpinning(false);
          Swal.fire({
            icon: data.prize.type === "none" ? "info" : "success",
            title: data.prize.type === "none" ? "เสียใจด้วย" : "ยินดีด้วย",
            text: data.message,
            confirmButtonColor: "#d4af37",
          });
        }, 4400);
      } else {
        setSpinning(false);
        Swal.fire({ icon: "error", title: "ผิดพลาด", text: data.message, confirmButtonColor: "#d4af37" });
      }
    } catch {
      setSpinning(false);
    }
  };

  return (
    <div className="container-x hx">
      <div className="hx-head">
        <div className="hx-head-t">
          <div>
            <span className="hx-kicker">Lucky wheel</span>
            <h2>สุ่มวงล้อ</h2>
          </div>
        </div>
      </div>
      {loaded && prizes.length < 2 ? (
        <div className="hx-empty card-x">วงล้อยังไม่พร้อม ลองมาใหม่ภายหลัง</div>
      ) : (
        <div className="wheel-wrap">
          <div className="wheel-box">
            <div className="wheel-ptr" />
            <div
              className="wheel-disc"
              style={{ background: conic(), transform: `rotate(${angle}deg)` }}
              aria-hidden
            >
              {prizes.map((p, i) => {
                const seg = 360 / prizes.length;
                return (
                  <div
                    key={p.id}
                    className="wheel-seg-label"
                    style={{ transform: `rotate(${i * seg + seg / 2}deg)` }}
                  >
                    <span>{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "var(--c-muted)", fontSize: "0.9rem" }}>
              คะแนนสะสมของคุณ: <b style={{ color: "var(--c-price)" }}>{user ? user.points.toLocaleString() : "0"} แต้ม</b>
              {cost > 0 ? ` · ค่าสุ่ม ${cost} แต้ม/ครั้ง` : " · สุ่มฟรี"}
            </div>
            <button className="a-btn bg-main" style={{ marginTop: 12, padding: "0.8rem 2rem" }} onClick={spin} disabled={spinning}>
              <Fa n="wheel" size={17} /> {spinning ? "กำลังสุ่ม..." : "สุ่มเลย"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- แลกแต้ม ---------------- */

type Reward = {
  id: string;
  name: string;
  detail: string;
  image: string;
  pointsCost: number;
  stock: number;
};

export function RewardView() {
  const { user, setUser } = useSite();
  const [items, setItems] = useState<Reward[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    fetch("/api/rewards", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.status && setItems(d.items))
      .catch(() => {})
      .finally(() => setLoaded(true));

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const redeem = async (id: string) => {
    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.status) {
      setUser(data.user);
      Swal.fire({ icon: "success", title: "สำเร็จ", text: data.message, confirmButtonColor: "#d4af37" });
      load();
    } else {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: data.message, confirmButtonColor: "#d4af37" });
    }
  };

  return (
    <div className="container-x hx">
      <div className="hx-head">
        <div className="hx-head-t">
          <div>
            <span className="hx-kicker">Points</span>
            <h2>แลกแต้มสะสม</h2>
          </div>
          <span style={{ color: "var(--c-price)", fontWeight: 700 }}>
            {user ? `${user.points.toLocaleString()} แต้ม` : "—"}
          </span>
        </div>
      </div>
      {loaded && items.length === 0 ? (
        <div className="hx-empty card-x">ยังไม่มีรางวัลให้แลก</div>
      ) : (
        <div className="rw-grid">
          {items.map((it) => (
            <div key={it.id} className="card-x hx-prod fx-tilt">
              <div className="im">
                {it.image ? (
                   
                  <img src={it.image} alt={it.name} />
                ) : (
                  <Fa n="gift" size={40} style={{ color: "var(--c-main)", opacity: 0.7 }} />
                )}
              </div>
              <div className="bd">
                <div className="nm">{it.name}</div>
                {it.detail ? (
                  <div style={{ fontSize: "0.85rem", color: "var(--c-muted)" }}>{it.detail}</div>
                ) : null}
                <div className="hx-prod-row">
                  <span className={`stk ${it.stock < 1 ? "is-out" : ""}`}>
                    {it.stock < 1 ? "รางวัลหมด" : `เหลือ ${it.stock}`}
                  </span>
                  <span className="pill">{it.pointsCost.toLocaleString()} แต้ม</span>
                </div>
                <button
                  className={it.stock > 0 ? "btn-buy" : "btn-out"}
                  disabled={it.stock < 1}
                  onClick={() => redeem(it.id)}
                >
                  {it.stock > 0 ? "แลกรางวัล" : "รางวัลหมด"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- แอพพรีเมี่ยม ---------------- */

export function AppView() {
  const { home } = useSite();
  const s = home?.settings || {};
  return (
    <div className="container-x hx">
      <div className="hx-head">
        <div className="hx-head-t">
          <div>
            <span className="hx-kicker">Premium</span>
            <h2>แอพพรีเมี่ยม</h2>
          </div>
        </div>
      </div>
      <div className="card-x" style={{ padding: "2rem", textAlign: "center" }}>
        <Fa n="crown" size={50} style={{ color: "var(--c-main)" }} />
        <h3 style={{ margin: "1rem 0 0.6rem" }}>แอพพรีเมี่ยม Ahtee</h3>
        <p style={{ color: "var(--c-muted)", maxWidth: 560, margin: "0 auto", whiteSpace: "pre-line" }}>
          {s.appInfo || "—"}
        </p>
        {s.appLink ? (
          <a className="a-btn bg-main" style={{ marginTop: 16 }} href={s.appLink} target="_blank" rel="noopener noreferrer">
            ดาวน์โหลดแอพ
          </a>
        ) : null}
      </div>
    </div>
  );
}
