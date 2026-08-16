import type { Metadata, Viewport } from "next";
import { Oswald, Hanken_Grotesk } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-oswald",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Backyard Project",
  description:
    "Live table availability at The Backyard Project · bar + kitchen",
};

// Deliberately no user-scalable=no — the POS app disables pinch-zoom for its
// fixed-kiosk display, which was being inherited here with no benefit to a
// public visitor on their own phone. Restoring standard pinch-zoom.
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
    <html lang="en" className={`${oswald.variable} ${hankenGrotesk.variable}`}>
      <body>
        {children}
        <Script
          src="https://cdn.botpress.cloud/webchat/v3.7/inject.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://files.bpcontent.cloud/2026/08/05/13/20260805131439-DNGLV32O.js"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
