import Hero from "@/components/home/Hero";
import PilihKondisi from "@/components/home/PilihKondisi";
import MengapaEduPuan from "@/components/home/MengapaEduPuan";

export default function Beranda() {
  return (
    <main>
      <Hero />
      <PilihKondisi />
      <MengapaEduPuan />
    </main>
  );
}