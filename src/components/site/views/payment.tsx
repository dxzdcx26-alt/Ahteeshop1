"use client";

import React, { useEffect, useState } from "react";
import { Fa } from "../fa-icons";
import { useSite, baht } from "../store";
import Swal from "sweetalert2";

type Topup = {
  id: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
  createdAt: string;
};

export function PaymentView() {
  const { user, setUser } = useSite();
  const [info, setInfo] = useState("");
  const [topups, setTopups] = useState<Topup[]>([]);
  const [method, setMethod] = useState("promptpay");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/topup", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.status) {
          setInfo(d.paymentInfo);
          setTopups(d.topups);
        }
      })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method, reference }),
      });
      const data = await res.json();
      if (data.status) {
        setTopups((t) => [data.topup, ...t]);
        setAmount("");
        setReference("");
        Swal.fire({ icon: "success", title: "ส่งรายการแล้ว", text: data.message, confirmButtonColor: "#d4af37" });
      } else {
        Swal.fire({ icon: "error", title: "ผิดพลาด", text: data.message, confirmButtonColor: "#d4af37" });
      }
    } finally {
      setLoading(false);
    }
  };

  const badge = (s: string) =>
    s === "approved" ? (
      <span className="badge-x badge-ok">อนุมัติแล้ว</span>
    ) : s === "rejected" ? (
      <span className="badge-x badge-danger">ปฏิเสธ</span>
    ) : (
      <span className="badge-x badge-warn">รอตรวจสอบ</span>
    );

  return (
    <div className="container-x hx">
      <div className="hx-head">
        <div className="hx-head-t">
          <div>
            <span className="hx-kicker">Top up</span>
            <h2>เติมเงินเข้ากระเป๋า</h2>
          </div>
        </div>
      </div>

      <div className="pay-grid">
        <div className="card-x" style={{ padding: "1.2rem 1.3rem" }}>
          <div className="mrow" style={{ padding: 0, marginBottom: 14 }}>
            <span style={{ fontWeight: 600, color: "var(--c-card-title)", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Fa n="wallet" size={16} /> ยอดเงินคงเหลือ
            </span>
            <span className="bal" style={{ color: "var(--c-card-title)", padding: "4px 10px", borderRadius: 8, background: "var(--c-main)", fontWeight: 700, fontSize: "0.95rem" }}>
              {user ? `${baht(user.balance)} บาท` : "—"}
            </span>
          </div>
          <div className="divided">
            <span className="ln" />
            <span className="tx">ช่องทางชำระเงิน</span>
            <span className="ln" />
          </div>
          <div className="pay-info">{info || "— ยังไม่ได้ตั้งค่าข้อมูลบัญชี —"}</div>
        </div>

        <div className="card-x" style={{ padding: "1.2rem 1.3rem" }}>
          <div className="divided">
            <span className="ln" />
            <span className="tx">แจ้งชำระเงิน</span>
            <span className="ln" />
          </div>
          <label className="form-lbl">วิธีชำระเงิน</label>
          <select className="form-in" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="promptpay">PromptPay</option>
            <option value="bank">โอนผ่านธนาคาร</option>
            <option value="wallet">ทรูวอเลท</option>
          </select>
          <div style={{ height: 10 }} />
          <label className="form-lbl">จำนวนเงิน (บาท)</label>
          <input
            className="form-in"
            type="number"
            min={1}
            placeholder="เช่น 100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div style={{ height: 10 }} />
          <label className="form-lbl">เลขอ้างอิง / เลขสลิป</label>
          <input
            className="form-in"
            type="text"
            placeholder="กรอกเลขอ้างอิงการโอน"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <button className="a-btn bg-main" style={{ width: "100%", marginTop: 16, padding: "0.7rem 1rem" }} onClick={submit} disabled={loading}>
            {loading ? "กำลังส่ง..." : "ส่งรายการเติมเงิน"}
          </button>
        </div>
      </div>

      {topups.length > 0 && (
        <section className="hx-sec">
          <div className="hx-head" style={{ marginBottom: "0.8rem" }}>
            <div className="hx-head-t">
              <div>
                <span className="hx-kicker">Recent</span>
                <h2 style={{ fontSize: "clamp(1.1rem,1.8vw,1.35rem)" }}>รายการล่าสุด</h2>
              </div>
            </div>
          </div>
          <div className="card-x" style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>จำนวน</th>
                  <th>วิธีชำระ</th>
                  <th>อ้างอิง</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {topups.map((t) => (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(t.createdAt).toLocaleString("th-TH")}</td>
                    <td>{baht(t.amount)} ฿</td>
                    <td>{t.method === "promptpay" ? "PromptPay" : t.method === "bank" ? "ธนาคาร" : "ทรูวอเลท"}</td>
                    <td>{t.reference}</td>
                    <td>{badge(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
