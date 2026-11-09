"use client";

import React from "react";
import { useSite } from "./store";
import { Fa } from "./fa-icons";

export function Footer() {
  const { home } = useSite();
  const s = home?.settings || {};
  const note = s.contactNote || "ติดต่อเจ้าของร้านไม่ได้ / แจ้งปัญหาร้านค้าโกง";

  return (
    <footer className="site-foot">
      <div className="container-x site-foot-in">
        <div className="site-foot-brand">
          <p>{s.footerText || "Ahtee — เติมเกมไว ปลอดภัย 24 ชม."}</p>
        </div>
        <div className="site-foot-links">
          <span>ติดต่อเรา</span>
          <a href={s.facebookUrl || "#"} target="_blank" rel="noopener noreferrer">
            <Fa n="facebook" size={15} /> Facebook
          </a>
          <a href={s.discordUrl || "#"} target="_blank" rel="noopener noreferrer">
            <Fa n="discord" size={15} /> Discord
          </a>
        </div>
      </div>
      <div className="container-x site-foot-bottom">
        <span>
          <Fa n="copyright" size={12} /> 2023 spaceXnet Cloud, All right reserved.
        </span>
        <a href="https://discord.gg/dfnxcloud" target="_blank" rel="noopener noreferrer">
          {note}
        </a>
      </div>
    </footer>
  );
}
