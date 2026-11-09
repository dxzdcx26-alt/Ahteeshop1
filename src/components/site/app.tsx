"use client";

import React from "react";
import { StoreProvider, useSite } from "./store";
import { Nav } from "./nav";
import { Footer } from "./footer";
import { CoinParticles } from "./particles";
import { BuyModal } from "./buy-modal";
import { HomeView } from "./views/home";
import { LoginView, RegisterView } from "./views/auth";
import { ShopView, HistoryView } from "./views/shop";
import { PaymentView } from "./views/payment";
import { ContactView } from "./views/contact";
import { SearchView } from "./views/search";
import { WheelView, RewardView, AppView } from "./views/misc";
import { AdminView } from "./views/admin";

const AUTH_PAGES = new Set(["shop", "payment", "history", "random_wheel", "reward"]);

function Body() {
  const { page, user } = useSite();

  let view: React.ReactNode;

  if (page === "login") view = user ? <HomeView /> : <LoginView />;
  else if (page === "register") view = user ? <HomeView /> : <RegisterView />;
  else if (page === "admin") view = user && user.role === "admin" ? <AdminView /> : <LoginView />;
  else if (AUTH_PAGES.has(page) && !user) view = <LoginView />;
  else if (page === "shop") view = <ShopView />;
  else if (page === "payment") view = <PaymentView />;
  else if (page === "history") view = <HistoryView />;
  else if (page === "contact") view = <ContactView />;
  else if (page === "search") view = <SearchView />;
  else if (page === "random_wheel") view = <WheelView />;
  else if (page === "reward") view = <RewardView />;
  else if (page === "app") view = <AppView />;
  else view = <HomeView />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1 }}>{view}</main>
      <Footer />
      <BuyModal />
      <CoinParticles />
    </div>
  );
}

export function SiteApp() {
  return (
    <StoreProvider>
      <Body />
    </StoreProvider>
  );
}
