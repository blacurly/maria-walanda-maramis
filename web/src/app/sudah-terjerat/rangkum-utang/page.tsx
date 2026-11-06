import type { Metadata } from "next";
import RangkumUtangBaru from "@/components/fitur/rangkum-utang/RangkumUtangBaru";
import "./rangkum-utang.css";

export const metadata: Metadata = {
  title: "Rangkum Semua Utang – EduPuan",
  description:
    "Catat semua utangmu di satu tempat, lihat totalnya, dan ketahui mana yang perlu ditangani lebih dulu.",
};

export default function RangkumUtangPage() {
  return (
    <div className="ru-dalam-bingkai">
      <RangkumUtangBaru />
    </div>
  );
}