import { Suspense } from "react";
import { SiteApp } from "@/components/site/app";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <SiteApp />
    </Suspense>
  );
}
