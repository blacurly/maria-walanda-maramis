import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import CekLegalitas from "@/components/fitur/cek-legalitas/CekLegalitas";

const poppins = Poppins({ subsets: ["latin"], weight: ["800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Cek Legalitas Pinjol – EduPuan",
  description: "Cek apakah pinjol terdaftar di OJK atau tercatat ilegal, dan kenali 6 tanda pinjol ilegal.",
};

export default function CekLegalitasPage() {
  return (
    <div className={poppins.variable}>
      <CekLegalitas />
    </div>
  );
}