import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import AnalisisPesanHalaman from "./AnalisisPesanHalaman";
import "./analisis-pesan.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Analisis Pesan Penagih – EduPuan",
  description:
    "Tempel pesan dari penagih. EduPuan bantu kenali pelanggarannya, dasar hukumnya, dan siapkan template balasan.",
};

export default function AnalisisPesanPage() {
  return (
    <div className={`ap-dalam-bingkai ${poppins.variable}`}>
      <AnalisisPesanHalaman />
    </div>
  );
}