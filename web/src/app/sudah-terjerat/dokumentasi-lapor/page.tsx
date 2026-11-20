import type { Metadata } from "next";
import DokumentasiLaporHalaman from "./DokumentasiLaporHalaman";
import "./dokumentasi-lapor.css";


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
    <div className="dl-dalam-bingkai">
      <DokumentasiLaporHalaman demo={demo === "1"} />
    </div>
  );
}