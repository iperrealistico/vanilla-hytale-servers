import type { Metadata } from "next";
import "./globals.css";

import Script from "next/script";

import { getSiteContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content.meta.title,
    description: content.meta.description,
  };
}

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
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
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
