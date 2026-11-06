import Hero from "@/components/home/Hero";
import PilihKondisi from "@/components/home/PilihKondisi";
import MengapaEduPuan from "@/components/home/MengapaEduPuan";
import EdukasiPreview from "@/components/home/EdukasiPreview";

export default function Beranda() {
  return (
    <main>
      <Hero />
      <PilihKondisi />
      <MengapaEduPuan />
      <EdukasiPreview />
    </main>
  );
}