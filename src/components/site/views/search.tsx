"use client";

import React, { useEffect, useState } from "react";
import { useSite, baht } from "../store";

type ResProduct = { id: string; name: string; image: string; price: number; stock: number };

export function SearchView() {
  const { q, nav } = useSite();
  const [result, setResult] = useState<{ q: string; products: ResProduct[] }>({ q: "", products: [] });

  useEffect(() => {
    if (!q) return;
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setResult({ q, products: d.products });
      })
      .catch(() => {});
  }, [q]);

  const fresh = result.q === q ? result.products : null;

  return (
    <div className="container-x hm">
      <div className="hm-head">
        <h2>
          { }
          <img src="/icons/search.svg" alt="" className="hx-ic-svg" />
          ค้นหาสินค้า
        </h2>
      </div>

      {!q ? (
        <div className="hm-empty card-x">พิมพ์ชื่อสินค้าในช่องค้นหาด้านบน</div>
      ) : fresh === null ? (
        <div className="hm-empty card-x">กำลังค้นหา...</div>
      ) : fresh.length === 0 ? (
        <div className="hm-empty card-x">ไม่พบสินค้าที่ค้นหา</div>
      ) : (
        <div className="hx-prods">
          {fresh.map((p) => (
            <div key={p.id} className={`hx-prod card-x fx-tilt ${p.stock < 1 ? "is-out" : ""}`}>
              <div className="im">
                <span className={`stock ${p.stock < 1 ? "out" : ""}`}>
                  {p.stock < 1 ? "สินค้าหมด" : `เหลือ ${p.stock}`}
                </span>
                {p.image ? (
                   
                  <img src={p.image} alt={p.name} />
                ) : (
                   
                  <img src="/icons/box.svg" alt="" className="ph-ic" />
                )}
              </div>
              <div className="bd">
                <div className="nm">{p.name}</div>
                <div className="hx-prod-row">
                  <span className="stk">{p.stock < 1 ? "สินค้าหมด" : "พร้อมขาย"}</span>
                  <span className="pill">{baht(p.price)} ฿</span>
                </div>
                <button
                  className={p.stock > 0 ? "btn-buy" : "btn-out"}
                  disabled={p.stock < 1}
                  onClick={() => p.stock > 0 && nav("shop")}
                >
                  ไปที่ร้านค้า
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
