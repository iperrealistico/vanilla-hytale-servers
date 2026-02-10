import type { Metadata } from "next";
import "./globals.css";

import Script from "next/script";

export const metadata: Metadata = {
  title: "Best Vanilla Hytale Servers (2026) | Curated List + IPs",
  description: "Editor-ranked vanilla Hytale servers. Curated vanilla Hytale server list with IPs, rules, gameplay footprint, no pay-to-win notes, and last-checked dates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" data-theme="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var t = localStorage.getItem("theme");
                  document.documentElement.setAttribute("data-theme", t || "dark");
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              })();
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/img/favicon.png" />
        <link rel="apple-touch-icon" href="/img/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" />
        <Script src="https://unpkg.com/embla-carousel@8.1.8/embla-carousel.umd.js" strategy="afterInteractive" />
        <div className="bg-floats" aria-hidden="true">
          {/* These should be added back by the page or a background component */}
        </div>
        {children}
      </body>
    </html>
  );
}
