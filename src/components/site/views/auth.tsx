"use client";

import React, { useState } from "react";
import { useSite } from "../store";
import Swal from "sweetalert2";

export function LoginView() {
  const { nav, setUser } = useSite();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status) {
        setUser(data.user);
        Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1300, showConfirmButton: false });
        nav("home");
      } else {
        Swal.fire({ icon: "error", title: "เข้าสู่ระบบไม่สำเร็จ", text: data.message, confirmButtonColor: "#d4af37" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card bg-custom">
        <div className="auth-inner">
          <h1 className="auth-title">Ahtee</h1>
          <h3 className="auth-sub">เข้าสู่ระบบ</h3>
          <div className="auth-fields">
            <div className="mb">
              <label className="form-lbl">ชื่อผู้ใช้</label>
              <input
                type="text"
                className="form-in"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            <div className="mb" style={{ marginTop: 6 }}>
              <label className="form-lbl">รหัสผ่าน</label>
              <input
                type="password"
                className="form-in"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            <div className="auth-btn-row">
              <button
                className="a-btn bg-main"
                style={{ width: "100%", padding: "0.7rem 1rem" }}
                onClick={submit}
                disabled={loading}
              >
                {loading ? "รอสักครู่..." : "เข้าสู่ระบบ"}
              </button>
            </div>
            <div className="auth-switch text-main">
              <span>
                ยังไม่มีบัญชี{" "}
                <a
                  href="/?page=register"
                  onClick={(e) => {
                    e.preventDefault();
                    nav("register");
                  }}
                >
                  สมัครสมาชิกตอนนี้
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterView() {
  const { nav, setUser } = useSite();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, password2 }),
      });
      const data = await res.json();
      if (data.status) {
        setUser(data.user);
        Swal.fire({ icon: "success", title: "สมัครสมาชิกสำเร็จ", text: "ยินดีต้อนรับสู่ Ahtee", confirmButtonColor: "#d4af37" });
        nav("home");
      } else {
        Swal.fire({ icon: "error", title: "สมัครสมาชิกไม่สำเร็จ", text: data.message, confirmButtonColor: "#d4af37" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card bg-custom">
        <div className="auth-inner">
          <h1 className="auth-title">Ahtee</h1>
          <h3 className="auth-sub">สร้างบัญชี</h3>
          <div className="auth-fields">
            <div className="mb">
              <label className="form-lbl">ชื่อผู้ใช้</label>
              <input
                type="text"
                className="form-in"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb" style={{ marginTop: 6 }}>
              <label className="form-lbl">รหัสผ่าน</label>
              <input
                type="password"
                className="form-in"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mb" style={{ marginTop: 6, marginBottom: 12 }}>
              <label className="form-lbl">รหัสผ่านอีกครั้ง</label>
              <input
                type="password"
                className="form-in"
                placeholder="Confirm password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            <div className="auth-btn-row">
              <button
                className="a-btn bg-main"
                style={{ width: "100%", padding: "0.7rem 1rem" }}
                onClick={submit}
                disabled={loading}
              >
                {loading ? "รอสักครู่..." : "สมัครสมาชิก"}
              </button>
            </div>
            <div className="auth-switch text-main">
              <span>
                มีบัญชีแล้ว?{" "}
                <a
                  href="/?page=login"
                  onClick={(e) => {
                    e.preventDefault();
                    nav("login");
                  }}
                >
                  เข้าสู่ระบบตอนนี้
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
