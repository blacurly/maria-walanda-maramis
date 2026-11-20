import type { Metadata } from "next";
import CeritakanSituasimu from "@/components/fitur/bingung-mulai/CeritakanSituasimu";

export const metadata: Metadata = {
  title: "Ceritakan Situasimu – EduPuan",
  description:
    "Bingung mulai dari mana? Ceritakan situasimu dengan bahasamu sendiri, dan EduPuan memberi arahan ke fitur serta pihak yang tepat.",
};

export default function BingungMulaiPage() {
  return (
    <div>
      <CeritakanSituasimu />
    </div>
  );
}