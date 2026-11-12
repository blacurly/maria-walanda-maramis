import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import CekLegalitas from "@/components/fitur/cek-legalitas/CekLegalitas";
import { namaSumberResmi } from "@/lib/pinjol/layanan";

const poppins = Poppins({ subsets: ["latin"], weight: ["800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Cek Legalitas Pinjol – EduPuan",
  description: "Cek apakah pinjol terdaftar di OJK atau tercatat ilegal oleh Satgas PASTI, termasuk aplikasi tiruan.",
};

// Ambil ulang nama sumber data dari database paling lama setiap 1 jam (3600 detik)
export const revalidate = 3600;

// Halaman ini TIDAK lagi memuat 500+ pinjol ke browser.
// Pencocokan nama dilakukan di server lewat GET /api/pinjol/cek (lihat lib/pinjol/layanan.ts).
export default async function CekLegalitasPage() {
  const { sumber, dariDatabase } = await namaSumberResmi();

  return (
    <div className={poppins.variable}>
      <CekLegalitas sumber={sumber} dariDatabase={dariDatabase} />
    </div>
  );
}