"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type SiteUser = {
  id: string;
  username: string;
  role: string;
  balance: number;
  points: number;
};

export type HomeProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
};

export type HomeCategory = {
  id: string;
  name: string;
  detail: string;
  image: string;
  productCount: number;
};

export type HomeData = {
  settings: Record<string, string>;
  announcements: string[];
  stats: { members: number; categories: number; productsReady: number; sold: number };
  categories: HomeCategory[];
  featured: HomeProduct[];
};

export type ShopProduct = {
  id: string;
  name: string;
  detail: string;
  image: string;
  price: number;
  stock: number;
};

export type ShopCategory = {
  id: string;
  name: string;
  detail: string;
  image: string;
  products: ShopProduct[];
};

type StoreCtx = {
  page: string;
  q: string;
  nav: (page: string, params?: Record<string, string>) => void;
  user: SiteUser | null;
  setUser: (u: SiteUser | null) => void;
  home: HomeData | null;
  refreshHome: () => Promise<void>;
  openBuy: (p: ShopProduct) => void;
  buyProduct: ShopProduct | null;
  setBuyProduct: (p: ShopProduct | null) => void;
  toggleMode: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite outside provider");
  return v;
}

/** IntersectionObserver count-up, ease-out cubic */
export function useCountUp(target: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      const id = requestAnimationFrame(() => setVal(target));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((en) => {
          if (!en.isIntersecting || done.current) return;
          done.current = true;
          io.unobserve(en.target);
          const t0 = performance.now();
          const d = 1200;
          const step = (t: number) => {
            const k = Math.min(1, (t - t0) / d);
            setVal(Math.round(target * (1 - Math.pow(1 - k, 3))));
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return { ref, val };
}

/** pointer-tilt for cards marked .fx-tilt (delegated) */
export function useTilt() {
  useEffect(() => {
    if (matchMedia("(hover: none)").matches) return;
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const c = t.closest?.(".fx-tilt") as HTMLElement | null;
      document.querySelectorAll<HTMLElement>(".fx-tilt.is-tilting").forEach((x) => {
        if (x !== c) {
          x.classList.remove("is-tilting");
          x.style.transform = "";
        }
      });
      if (!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      c.classList.add("is-tilting");
      c.style.transform = `perspective(800px) rotateX(${((0.5 - y) * 10).toFixed(2)}deg) rotateY(${((x - 0.5) * 12).toFixed(2)}deg) translateY(-4px)`;
    };
    document.addEventListener("pointermove", move);
    return () => document.removeEventListener("pointermove", move);
  }, []);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const page = params.get("page") || "home";
  const q = params.get("q") || "";

  const [user, setUser] = useState<SiteUser | null>(null);
  const [home, setHome] = useState<HomeData | null>(null);
  const [buyProduct, setBuyProduct] = useState<ShopProduct | null>(null);

  const refreshHome = useCallback(async () => {
    const res = await fetch("/api/home", { cache: "no-store" });
    const data = await res.json();
    if (data.status) setHome(data);
  }, []);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
    fetch("/api/home", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setHome(d);
      })
      .catch(() => {});
  }, []);

  const nav = useCallback(
    (p: string, extra?: Record<string, string>) => {
      const sp = new URLSearchParams();
      sp.set("page", p);
      if (extra) for (const [k, v] of Object.entries(extra)) sp.set(k, v);
      router.push(`/?${sp.toString()}`);
      window.scrollTo({ top: 0 });
    },
    [router]
  );

  const toggleMode = useCallback(() => {
    const next =
      document.documentElement.getAttribute("data-mode") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-mode", next);
    try {
      localStorage.setItem("site_mode", next);
    } catch {}
  }, []);

  const openBuy = useCallback((p: ShopProduct) => {
    setBuyProduct(p);
  }, []);

  useTilt();

  return (
    <Ctx.Provider
      value={{
        page,
        q,
        nav,
        user,
        setUser,
        home,
        refreshHome,
        openBuy,
        buyProduct,
        setBuyProduct,
        toggleMode,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const baht = (n: number) =>
  n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
