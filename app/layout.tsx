// app/layout.tsx
// Ini adalah root layout yang simpel

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Verdeon",
  description: "Verdeon Solar Token Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        {/* 'children' di sini bisa jadi:
          1. Layout dashboard (yang punya Sidebar)
          2. Halaman login (yang tidak punya Sidebar)
        */}
        {children}
      </body>
    </html>
  );
}