// app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
// 1. Import AuthProvider yang baru kita buat
import { AuthProvider } from "@/context/AuthContext"; // (Asumsi path @/context/...)

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Verdeon",
  description: "Platform Tokenisasi Karbon",
  icons: {
    icon: "/images/logo-verdeon-bg-putih.png", // Ganti dengan nama file logomu yang ada di folder images
    apple: "/images/logo-verdeon-bg-putih.png", // Opsional: Untuk icon kalau dosen save webnya di home screen HP
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        {/* 2. Bungkus {children} dengan AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}