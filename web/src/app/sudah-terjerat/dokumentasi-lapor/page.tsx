import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import DokumentasiLaporHalaman from "./DokumentasiLaporHalaman";
import "./dokumentasi-lapor.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-poppins" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Dokumentasi & Lapor – EduPuan",
  description:
    "Catat kronologi perlakuan penagih, dapatkan laporan siap kirim, dan ketahui ke mana harus melapor.",
};

export default async function DokumentasiLaporPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;

  return (
    <div className={`dl-dalam-bingkai ${poppins.variable} ${mono.variable}`}>
      <DokumentasiLaporHalaman demo={demo === "1"} />
    </div>
  );
}