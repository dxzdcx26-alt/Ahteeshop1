"use client";

import React, { useEffect, useState } from "react";
import { Fa } from "../fa-icons";
import { useSite, baht, type ShopCategory } from "../store";

export function ShopView() {
  const { openBuy } = useSite();
  const [cats, setCats] = useState<ShopCategory[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/shop", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setCats(d.categories);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const chips = [{ id: "all", name: "ทั้งหมด" }, ...cats.map((c) => ({ id: c.id, name: c.name }))];
  const shown = filter === "all" ? cats : cats.filter((c) => c.id === filter);
  const totalProducts = cats.reduce((s, c) => s + c.products.length, 0);

  return (
    <div className="container-x hx">
      <div className="hx-head">
        <div className="hx-head-t">
          { }
          <img src="/icons/store.svg" alt="" className="hx-head-ic" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          <div>
            <span className="hx-kicker">Shop</span>
            <h2>ร้านค้าของเรา</h2>
          </div>
        </div>
      </div>

      {cats.length > 0 && (
        <div className="chip-row">
          {chips.map((c) => (
            <button
              key={c.id}
              className={`chip ${filter === c.id ? "is-on" : ""}`}
              onClick={() => setFilter(c.id)}
              type="button"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loaded && totalProducts === 0 ? (
        <div className="hx-empty card-x">ยังไม่มีสินค้าในร้านค้า</div>
      ) : (
        shown.map((c) => (
          <section className="hx-sec" key={c.id} style={{ marginTop: "2rem" }}>
            <div className="hx-head" style={{ marginBottom: "1rem" }}>
              <div className="hx-head-t">
                <div>
                  <span className="hx-kicker">Category</span>
                  <h2 style={{ fontSize: "clamp(1.1rem,1.8vw,1.35rem)" }}>{c.name}</h2>
                </div>
              </div>
            </div>
            {c.products.length === 0 ? (
              <div className="hx-empty card-x">ยังไม่มีสินค้าในหมวดนี้</div>
            ) : (
              <div className="hx-prods">
                {c.products.map((p) => (
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
                        <span className={`stk ${p.stock < 1 ? "is-out" : ""}`}>
                          {p.stock < 1 ? "สินค้าหมด" : `คงเหลือ ${p.stock} ชิ้น`}
                        </span>
                        <span className="pill">{baht(p.price)} ฿</span>
                      </div>
                      {p.stock > 0 ? (
                        <button className="btn-buy" onClick={() => openBuy(p)}>
                          สั่งซื้อสินค้า
                        </button>
                      ) : (
                        <button className="btn-out" disabled>
                          สินค้าหมด
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}
      {!loaded && (
        <div className="hx-empty card-x">
          <Fa n="box" size={18} style={{ verticalAlign: "middle" }} /> กำลังโหลดสินค้า...
        </div>
      )}
    </div>
  );
}

type Order = {
  id: string;
  orderNo: string;
  productName: string;
  quantity: number;
  total: number;
  payloads: string;
  status: string;
  createdAt: string;
};

export function HistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/history", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.status && setOrders(d.orders))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
    } catch {}
  };

  return (
    <div className="container-x hx">
      <div className="hx-head">
        <div className="hx-head-t">
          <div>
            <span className="hx-kicker">History</span>
            <h2>ประวัติการซื้อ</h2>
          </div>
        </div>
      </div>
      {loaded && orders.length === 0 ? (
        <div className="hx-empty card-x">ยังไม่มีประวัติการซื้อ</div>
      ) : (
        <div className="card-x" style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เลขออเดอร์</th>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>ยอดรวม</th>
                <th>สถานะ</th>
                <th>รหัสที่ได้รับ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleString("th-TH")}</td>
                  <td>{o.orderNo}</td>
                  <td>{o.productName}</td>
                  <td>{o.quantity}</td>
                  <td>{baht(o.total)} ฿</td>
                  <td>
                    <span className="badge-x badge-ok">สำเร็จ</span>
                  </td>
                  <td>
                    <button className="a-btn outline sm" onClick={() => copy(o.payloads)} type="button">
                      คัดลอก
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
