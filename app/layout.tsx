import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./editorial.css";

const plex = localFont({ src: "../node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2", variable: "--font-sans", display: "swap", weight: "100 700" });
const newsreader = localFont({ src: [
  { path: "../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2", style: "normal", weight: "200 800" },
], variable: "--font-editorial", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "EFDS — Economics, Finance & Data Science Society",
    template: "%s — EFDS",
  },
  description: "Imperial College London's student society for economics, finance and data science.",
  metadataBase: new URL("https://imperial-efds.com"),
  openGraph: { title: "EFDS — Imperial College London", description: "Economics, Finance & Data Science. A student-led society at Imperial College London.", type: "website", locale: "en_GB", images: [{ url: "/images/queens-lawn.webp", alt: "Queen’s Lawn at Imperial College London. Photograph by Shadowssettle, CC BY-SA 4.0." }] },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${plex.variable} ${newsreader.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
