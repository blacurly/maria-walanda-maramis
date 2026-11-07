import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import CeritakanSituasimu from "@/components/fitur/bingung-mulai/CeritakanSituasimu";

const poppins = Poppins({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Ceritakan Situasimu – EduPuan",
  description:
    "Bingung mulai dari mana? Ceritakan situasimu dengan bahasamu sendiri, dan EduPuan memberi arahan ke fitur serta pihak yang tepat.",
};

export default function BingungMulaiPage() {
  return (
    <div className={poppins.variable}>
      <CeritakanSituasimu />
    </div>
  );
}