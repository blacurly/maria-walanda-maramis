import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import CekAlternatif from "@/components/fitur/cari-alternatif/CekAlternatif";

const poppins = Poppins({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Cek Alternatif Lain – EduPuan",
  description:
    "Cari solusi tanpa menambah utang: bantuan resmi, keringanan tagihan, dan bantuan pendidikan sesuai kondisimu.",
};

export default function CariAlternatifPage() {
  return (
    <div className={poppins.variable}>
      <CekAlternatif hideHeader />
    </div>
  );
}