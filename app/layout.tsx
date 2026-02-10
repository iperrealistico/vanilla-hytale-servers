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
        <link rel="stylesheet" href="/vendor/fonts.css" />
        <link rel="stylesheet" href="/vendor/font-awesome.min.css" />
      </head>
      <body>
        <Script src="/vendor/gsap.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/ScrollTrigger.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/embla-carousel.umd.js" strategy="beforeInteractive" />
        <div className="bg-floats" aria-hidden="true">
          {/* These should be added back by the page or a background component */}
        </div>
        {children}
      </body>
    </html>
  );
}
