import type { Metadata } from "next";
import BeritahuKeluarga from "@/components/fitur/beritahu-keluarga/BeritahuKeluarga";


export const metadata: Metadata = {
  title: "Beritahu Keluarga – EduPuan",
  description:
    "Template pesan WhatsApp untuk memberi tahu orang terdekat sebelum atau setelah mereka dihubungi penagih.",
};

export default function BeritahuKeluargaPage() {
  return (
    <div>
      <BeritahuKeluarga />
    </div>
  );
}