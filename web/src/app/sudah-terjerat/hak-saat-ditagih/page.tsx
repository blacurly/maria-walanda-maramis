import type { Metadata } from "next";
import HakSaatDitagih from "@/components/fitur/hak-saat-ditagih/HakSaatDitagih";

export const metadata: Metadata = {
  title: "Hak Saat Ditagih – EduPuan",
  description:
    "Kenali perilaku penagihan yang dilarang, dasar hukumnya, dan template balasan yang bisa langsung kamu kirim.",
};

export default function HakSaatDitagihPage() {
  return <HakSaatDitagih />;
}