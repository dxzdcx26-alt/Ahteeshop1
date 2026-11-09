"use client";

import React, { useState } from "react";
import { Fa } from "./fa-icons";
import { useSite, baht, type ShopProduct } from "./store";
import Swal from "sweetalert2";

export function BuyModal() {
  const { buyProduct: p, setBuyProduct } = useSite();
  if (!p) return null;
  return <BuyInner key={p.id} p={p} onClose={() => setBuyProduct(null)} />;
}

function BuyInner({ p, onClose }: { p: ShopProduct; onClose: () => void }) {
  const { user, setUser } = useSite();
  const [count, setCount] = useState(1);
  const stock = p.stock;
  const total = p.price * count;

  const submit = async () => {
    if (!user) return;
    const confirm = await Swal.fire({
      title: "ยืนยันการสั่งซื้อ?",
      text: `${p.name} ${count} ชิ้น ราคา ${baht(total)} บาท`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4af37",
      cancelButtonColor: "#d33",
      confirmButtonText: "ซื้อเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch("/api/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, count }),
    });
    const data = await res.json();
    if (data.status) {
      setUser(data.user);
      onClose();
      await Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        html: `<b>${data.message}</b><br><br>รหัสที่ได้รับ:<br><textarea readonly style="width:100%;height:120px;background:#0f0d0a;color:#f6efdf;border:1px solid #3b3322;border-radius:8px;padding:8px;font-family:monospace">${data.order.payloads}</textarea>`,
        confirmButtonColor: "#d4af37",
        confirmButtonText: "ดูในประวัติ",
      }).then(() => {
        window.location.href = "/?page=history";
      });
    } else {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: data.message, confirmButtonColor: "#d4af37" });
    }
  };

  return (
    <div className="modal-mask" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <h5>
            <Fa n="cart" size={17} /> สั่งซื้อสินค้า
          </h5>
          <button className="x" onClick={onClose} aria-label="ปิด">
            <Fa n="xmark" size={16} />
          </button>
        </div>
        <div className="mb2">
          <div style={{ fontWeight: 600, color: "var(--c-card-title)", marginBottom: 8 }}>{p.name}</div>
          <div className="divided">
            <span className="ln" />
            <span className="tx">จำนวนสินค้าที่จะซื้อ</span>
            <span className="ln" />
          </div>
          <input
            className="form-in"
            type="number"
            min={1}
            max={Math.max(1, stock)}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(stock || 1, parseInt(e.target.value || "1", 10) || 1)))}
          />
          <div className="mrow" style={{ marginTop: 14 }}>
            <span>
              สินค้าคงเหลือ {stock} ชิ้น · รวม {baht(total)} บาท
            </span>
            <span className="bal">ยอดเงินคงเหลือ {user ? baht(user.balance) : "0"} บาท</span>
          </div>
          <button
            className="a-btn bg-main"
            style={{ width: "100%", marginTop: 16, padding: "0.7rem 1rem" }}
            disabled={!user || stock < 1 || (user !== null && user.balance < total)}
            onClick={submit}
          >
            <Fa n="cart" size={16} /> สั่งซื้อเลย
          </button>
        </div>
      </div>
    </div>
  );
}
