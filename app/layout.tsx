import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({ src: "../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2", variable: "--font-sans", display: "swap", weight: "200 800" });
const newsreader = localFont({ src: [
  { path: "../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2", style: "normal", weight: "200 800" },
  { path: "../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2", style: "italic", weight: "200 800" },
], variable: "--font-editorial", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "EFDS — Economics, Finance & Data Science Society",
    template: "%s — EFDS",
  },
  description: "Imperial College London's student society for economics, finance and data science.",
  metadataBase: new URL("https://imperial-efds.com"),
  openGraph: { title: "EFDS — Think across boundaries", description: "Economics, Finance & Data Science. A student-led society at Imperial College London.", type: "website", locale: "en_GB", images: [{ url: "/images/imperial-connections.webp", alt: "An architectural study connecting Imperial with economics, finance and data science" }] },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${manrope.variable} ${newsreader.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
