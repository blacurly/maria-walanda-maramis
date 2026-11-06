import type { Metadata } from "next";
import PanduanDarurat from "./PanduanDarurat";

export const metadata: Metadata = {
  title: "Bantuan Darurat – EduPuan",
  description:
    "Nomor yang bisa langsung kamu hubungi saat menghadapi ancaman penagih, kekerasan, atau tekanan berat.",
};

export default function DaruratPage() {
  return <PanduanDarurat />;
}