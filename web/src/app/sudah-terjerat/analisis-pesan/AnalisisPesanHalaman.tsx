"use client";

import { useRouter } from "next/navigation";
import AnalisisPesanPenagih from "@/components/fitur/analisis-pesan/AnalisisPesanPenagih";

export default function AnalisisPesanHalaman() {
  const router = useRouter();

  return (
    <AnalisisPesanPenagih
      onBack={() => router.push("/sudah-terjerat")}
      onSemuaHak={() => router.push("/sudah-terjerat/hak-saat-ditagih")}
      onDokumentasi={() => router.push("/sudah-terjerat/dokumentasi-lapor")}
      onDarurat={() => router.push("/darurat")}
    />
  );
}