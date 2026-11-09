"use client";

import React, { useEffect, useRef } from "react";

/**
 * Falling gold coin particles — canvas, drawn from scratch.
 * Coins spin (x-scale oscillation) and sway horizontally.
 */
export function CoinParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    type Coin = {
      x: number;
      y: number;
      r: number;
      vy: number;
      sway: number;
      phase: number;
      spin: number;
      alpha: number;
    };
    let coins: Coin[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (anywhere: boolean): Coin => ({
      x: Math.random() * canvas.width,
      y: anywhere ? Math.random() * canvas.height : -30,
      r: 8 + Math.random() * 12,
      vy: 0.5 + Math.random() * 1.1,
      sway: 14 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
      spin: 0.6 + Math.random() * 1.4,
      alpha: 0.55 + Math.random() * 0.45,
    });

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      const target = Math.min(34, Math.max(14, Math.floor((window.innerWidth * window.innerHeight) / 42000)));
      coins = Array.from({ length: target }, () => spawn(true));
    };

    const drawCoin = (c: Coin, t: number) => {
      const wobble = Math.sin(t * 0.001 * c.spin + c.phase);
      const scaleX = 0.35 + Math.abs(wobble) * 0.65;
      const x = c.x + Math.sin(t * 0.0006 + c.phase) * c.sway;
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.translate(x, c.y);
      ctx.scale(scaleX, 1);

      // coin body
      const g = ctx.createRadialGradient(-c.r * 0.3, -c.r * 0.3, c.r * 0.2, 0, 0, c.r);
      g.addColorStop(0, "#f7e08a");
      g.addColorStop(0.55, "#d4af37");
      g.addColorStop(1, "#9a7a1c");
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = Math.max(1, c.r * 0.12);
      ctx.strokeStyle = "#8a6d1a";
      ctx.stroke();

      // inner ring
      ctx.beginPath();
      ctx.arc(0, 0, c.r * 0.66, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, c.r * 0.08);
      ctx.strokeStyle = "rgba(255,244,200,0.7)";
      ctx.stroke();

      // baht glyph
      if (c.r > 10) {
        ctx.fillStyle = "#6e5313";
        ctx.font = `700 ${Math.round(c.r * 0.95)}px Prompt, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("฿", 0, c.r * 0.06);
      }
      ctx.restore();
    };

    const loop = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const c of coins) {
        c.y += c.vy * dpr;
        if (c.y > canvas.height + 30) {
          Object.assign(c, spawn(false));
        }
        drawCoin(c, t);
      }
      raf = requestAnimationFrame(loop);
    };

    const onVis = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="pcanvas" aria-hidden="true" />;
}
