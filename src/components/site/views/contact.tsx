"use client";

import React, { useEffect, useState } from "react";
import { Fa } from "../fa-icons";
import { useSite } from "../store";

export function ContactView() {
  const { nav } = useSite();
  const [links, setLinks] = useState({ facebookUrl: "", discordUrl: "" });

  useEffect(() => {
    fetch("/api/contact", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.status && setLinks({ facebookUrl: d.facebookUrl, discordUrl: d.discordUrl }))
      .catch(() => {});
  }, []);

  return (
    <div className="container-x">
      <div className="contact-hero bg-custom fade-up">
        <div className="in">
          <div className="text-center" style={{ textAlign: "left" }}>
            <h3>
              { }
              <img src="/icons/contact.svg" alt="" />
              ช่องทางการติดต่อ
            </h3>
          </div>
          <button className="a-btn outline" onClick={() => nav("home")} type="button" style={{ height: "fit-content" }}>
            <b>
              <Fa n="turnDown" size={14} /> ย้อนกลับ
            </b>
          </button>
        </div>
      </div>

      <div className="container-fluid fade-up" style={{ marginTop: 8 }}>
        <div className="contact-grid">
          <div className="contact-card bg-custom count-only">
            <a href={links.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div>
                { }
                <img src="/icons/facebook.svg" alt="Facebook" />
                <h2>Facebook</h2>
              </div>
            </a>
          </div>
          <div className="contact-card bg-custom count-only">
            <a href={links.discordUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div>
                { }
                <img src="/icons/discord.svg" alt="Discord" />
                <h2>Discord</h2>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
