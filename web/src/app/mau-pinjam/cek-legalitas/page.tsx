import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import CekLegalitas from "@/components/fitur/cek-legalitas/CekLegalitas";
import { supabase } from "@/lib/supabase/publik";
import { LEGAL_PINJOL, ILEGAL_PINJOL, SUMBER_LEGAL, SUMBER_ILEGAL } from "@/data/dataPinjol";
import type { Pinjol } from "@/features/cek-legalitas/rules";

const poppins = Poppins({ subsets: ["latin"], weight: ["800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Cek Legalitas Pinjol – EduPuan",
  description: "Cek apakah pinjol terdaftar di OJK atau tercatat ilegal oleh Satgas PASTI, termasuk aplikasi tiruan.",
};

// Ambil ulang data dari database paling lama setiap 1 jam (3600 detik)
export const revalidate = 3600;

// Data cadangan dari file, dipakai kalau database tidak bisa dihubungi
const CADANGAN: Pinjol[] = [
  ...LEGAL_PINJOL.map((p) => ({ nama: p.nama, nama_perusahaan: p.pt, status: "legal" as const, alamat: p.alamat, sumber: SUMBER_LEGAL })),
  ...ILEGAL_PINJOL.map((p) => ({ nama: p.nama, nama_perusahaan: null, status: "ilegal" as const, alamat: p.alamat, sumber: SUMBER_ILEGAL })),
];

async function ambilDaftarPinjol(): Promise<{ daftar: Pinjol[]; dariDatabase: boolean }> {
  try {
    const { data, error } = await supabase
      .from("pinjol")
      .select("nama, nama_perusahaan, status, alamat, sumber")
      .order("status")
      .order("nama");
    if (!error && data && data.length > 0) {
      return { daftar: data as Pinjol[], dariDatabase: true };
    }
  } catch {
    // Database tidak bisa dihubungi: lanjut ke data cadangan
  }
  return { daftar: CADANGAN, dariDatabase: false };
}

export default async function CekLegalitasPage() {
  const { daftar, dariDatabase } = await ambilDaftarPinjol();
    const sumber = Array.from(new Set(daftar.map((p) => p.sumber))).sort();

  return (
    <div className={poppins.variable}>
      <CekLegalitas daftar={daftar} sumber={sumber} dariDatabase={dariDatabase} />
    </div>
  );
}