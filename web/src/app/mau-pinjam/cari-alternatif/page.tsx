import type { Metadata } from "next";
import CekAlternatif from "@/components/fitur/cari-alternatif/CekAlternatif";


export const metadata: Metadata = {
  title: "Cek Alternatif Lain – EduPuan",
  description:
    "Cari solusi tanpa menambah utang: bantuan resmi, keringanan tagihan, dan bantuan pendidikan sesuai kondisimu.",
};

export default function CariAlternatifPage() {
  return (
    <div>
      <CekAlternatif hideHeader />
    </div>
  );
}