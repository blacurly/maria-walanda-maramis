"use client";

import { useRouter } from "next/navigation";
import DokumentasiLapor from "@/components/fitur/dokumentasi-lapor/DokumentasiLapor";

export default function DokumentasiLaporHalaman({ demo }: { demo: boolean }) {
  const router = useRouter();

  return (
    <DokumentasiLapor
      demo={demo}
      onBack={() => router.push("/sudah-terjerat")}
      onCekLegalitas={() => router.push("/mau-pinjam/cek-legalitas")}
    />
  );
}