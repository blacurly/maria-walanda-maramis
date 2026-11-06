import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import BeritahuKeluarga from "@/components/fitur/beritahu-keluarga/BeritahuKeluarga";

const poppins = Poppins({ subsets: ["latin"], weight: ["800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Beritahu Keluarga – EduPuan",
  description:
    "Template pesan WhatsApp untuk memberi tahu orang terdekat sebelum atau setelah mereka dihubungi penagih.",
};

export default function BeritahuKeluargaPage() {
  return (
    <div className={poppins.variable}>
      <BeritahuKeluarga />
    </div>
  );
}