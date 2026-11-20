import type { Metadata } from "next";
import EdukasiDaftar from "@/components/edukasi/EdukasiDaftar";
import { daftarKategori, semuaArtikel } from "@/lib/artikel/layanan";


export const metadata: Metadata = {
  title: "Edukasi – EduPuan",
  description: "Artikel dan video tentang pinjaman online, hak-hakmu sebagai peminjam, dan cara melindungi diri.",
};

// Ambil ulang artikel dari database paling lama setiap 1 jam (dan langsung, setelah admin mengubah artikel lewat API)
export const revalidate = 3600;

export default async function EdukasiPage() {
  const [{ artikel }, kategori] = await Promise.all([semuaArtikel(), daftarKategori()]);

  return (
    <main className="bg-white">
      <header className="bg-linear-to-b from-[#f1f8f5] to-white px-5 pb-10 pt-14 text-center">
        <p className="mb-4 inline-block rounded-full bg-[#e6f3ee] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#04674b]">
          Literasi finansial
        </p>
        <h1
          className="mx-auto mb-4 max-w-3xl text-3xl font-semibold leading-tight text-[#034d38] sm:text-5xl"
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          Artikel & Video Edukasi
        </h1>
        <p className="mx-auto max-w-lg text-base text-[#5f7d72]">
          Perluas pemahamanmu soal pinjaman online, hak-hakmu, dan cara melindungi diri.
        </p>
      </header>
      <EdukasiDaftar daftarArtikel={artikel} daftarTopik={kategori} />
    </main>
  );
}