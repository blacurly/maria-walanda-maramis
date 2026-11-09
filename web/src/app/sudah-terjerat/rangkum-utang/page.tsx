import type { Metadata } from "next";
import RangkumUtang from "@/components/fitur/rangkum-utang/RangkumUtang";
import "./rangkum-utang.css";

export const metadata: Metadata = {
  title: "Rangkum Semua Utang – EduPuan",
  description:
    "Catat semua utangmu di satu tempat, lihat totalnya, dan pantau tanggal jatuh temponya. Data tersimpan di perangkatmu sendiri.",
};

export default function RangkumUtangPage() {
  return (
    <div className="ru-dalam-bingkai">
      <RangkumUtang />
    </div>
  );
}