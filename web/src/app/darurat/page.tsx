import type { Metadata } from "next";
import PanduanDarurat from "./PanduanDarurat";
import { daftarSituasiDarurat } from "@/lib/lembaga/layanan";

export const metadata: Metadata = {
  title: "Bantuan Darurat – EduPuan",
  description:
    "Nomor yang bisa langsung kamu hubungi saat menghadapi ancaman penagih, kekerasan, atau tekanan berat.",
};

// Ambil ulang dari database paling lama setiap 1 jam (dan langsung, setelah admin mengubah lembaga lewat API)
export const revalidate = 3600;

export default async function DaruratPage() {
  const { situasi } = await daftarSituasiDarurat();
  return <PanduanDarurat daftarSituasi={situasi} />;
}