import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Ahtee | เติมเกมอัตโนมัติ 24 ชม.",
  description: "Ahtee — ร้านเติมเกมอัตโนมัติ 24 ชม. รับของทันทีหลังชำระเงิน ปลอดภัย 100%",
  openGraph: {
    siteName: "Ahtee | เติมเกมอัตโนมัติ 24 ชม.",
    title: "Ahtee | เติมเกมอัตโนมัติ 24 ชม. - ยินดีต้อนรับ",
    type: "website",
    locale: "th_TH",
    description: "Ahtee",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning data-mode="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@200;400;600&family=Prompt:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var m="dark";try{var s=localStorage.getItem("site_mode");if(s==="dark"||s==="light")m=s;else if(window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches)m="light";}catch(e){}document.documentElement.setAttribute("data-mode",m);})();`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
