import Hero from "@/components/home/Hero";
import PilihKondisi from "@/components/home/PilihKondisi";
import MengapaEduPuan from "@/components/home/MengapaEduPuan";
import EdukasiPreview from "@/components/home/EdukasiPreview";
import Faq from "@/components/home/Faq";
import { daftarKategori, semuaArtikel } from "@/lib/artikel/layanan";

// Ambil ulang artikel dari database paling lama setiap 1 jam (dan langsung, setelah admin mengubah artikel lewat API)
export const revalidate = 3600;

export default async function Beranda() {
  const [{ artikel }, kategori] = await Promise.all([semuaArtikel(), daftarKategori()]);

  return (
    <main>
      <Hero />
      <PilihKondisi />
      <MengapaEduPuan />
      <EdukasiPreview daftarArtikel={artikel} daftarTopik={kategori} />
      <Faq />
    </main>
  );
}