import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter, per the design system (DESIGN.md) - it explicitly wants tabular
// figures for KPI numbers so they don't jump around during data syncs.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Inventory Dashboard",
  description: "AI Dashboard - project & supplier stock metrics"
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Material Symbols icon font used by <Icon /> across the dashboard.
            eslint-disable: App Router's root layout is the documented place
            for a third-party stylesheet like this (no pages/_document.js exists). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
