import type { Metadata } from "next";
import AnalisisPesanHalaman from "./AnalisisPesanHalaman";
import "./analisis-pesan.css";


export const metadata: Metadata = {
  title: "Analisis Pesan Penagih – EduPuan",
  description:
    "Tempel pesan dari penagih. EduPuan bantu kenali pelanggarannya, dasar hukumnya, dan siapkan template balasan.",
};

export default function AnalisisPesanPage() {
  return (
    <div className="ap-dalam-bingkai">
      <AnalisisPesanHalaman />
    </div>
  );
}