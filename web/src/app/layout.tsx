import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import PageBar from "@/components/layout/PageBar";
import Footer from "@/components/layout/Footer";
import PuanFab from "@/components/fitur/puan-chat/PuanFab";
import { PuanProvider } from "@/components/fitur/puan-chat/PuanContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduPuan – Lebih Paham, Lebih Bijak",
  description:
    "Literasi pinjol untuk perempuan. Pahami hakmu sebelum dan sesudah pinjol, cek penawaran, dan dapatkan arahan saat menghadapi penagihan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* PuanProvider: React Context untuk jendela chat Puan, bisa dibuka dari halaman mana pun */}
        <PuanProvider>
          <Navbar />
          <PageBar />
          <div className="flex-1">{children}</div>
          <Footer />
          <PuanFab />
        </PuanProvider>
      </body>
    </html>
  );
}