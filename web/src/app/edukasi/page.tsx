import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import EdukasiDaftar from "@/components/edukasi/EdukasiDaftar";

const poppins = Poppins({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Edukasi – EduPuan",
  description: "Artikel dan video tentang pinjaman online, hak-hakmu sebagai peminjam, dan cara melindungi diri.",
};

export default function EdukasiPage() {
  return (
    <main className={poppins.variable}>
      <header className="mx-auto max-w-3xl px-5 pb-8 pt-12 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0d6e4b]">Literasi finansial</p>
        <h1
          className="mb-3 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl"
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          Artikel & Video Edukasi
        </h1>
        <p className="mx-auto max-w-lg text-sm text-gray-500">
          Perluas pemahamanmu soal pinjaman online, hak-hakmu, dan cara melindungi diri.
        </p>
      </header>
      <EdukasiDaftar />
    </main>
  );
}