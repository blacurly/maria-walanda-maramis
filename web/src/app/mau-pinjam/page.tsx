import type { Metadata } from "next";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import { TONE, type Tone } from "@/lib/tone";

export const metadata: Metadata = {
  title: "Mau Pinjam – EduPuan",
  description: "Cek penawaran, legalitas, dan alternatif sebelum memutuskan meminjam.",
};

const ALAT: { href: string; ikon: string; judul: string; isi: string; tone: Tone }[] = [
  {
    href: "/mau-pinjam/cek-penawaran",
    ikon: "🧮",
    judul: "Cek Penawaran",
    isi: "Hitung biaya sebenarnya dan lihat lampu risiko hijau/kuning/merah.",
    tone: "emerald",
  },
  {
    href: "/mau-pinjam/cek-legalitas",
    ikon: "🔍",
    judul: "Cek Legalitas Pinjol",
    isi: "Masukkan nama pinjol untuk memeriksa status legalitasnya berdasarkan data OJK.",
    tone: "sky",
  },
  {
    href: "/mau-pinjam/cari-alternatif",
    ikon: "💡",
    judul: "Cek Alternatif Lain",
    isi: "Cari solusi tanpa menambah utang: bantuan resmi, keringanan tagihan, dan bantuan pendidikan.",
    tone: "amber",
  },
];

export default function MauPinjamPage() {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sebelum pinjam, cek dulu.</h1>
        <p className="text-gray-500 mb-8">
          Pinjaman terbaik adalah yang tidak perlu diambil. Kalau memang perlu, pastikan kamu sudah tahu
          risikonya.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {ALAT.map((a) => {
            const t = TONE[a.tone];
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`group flex flex-col rounded-2xl border-2 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[.98] ${t.kartu}`}
              >
                <span
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${t.ikon}`}
                  aria-hidden="true"
                >
                  {a.ikon}
                </span>
                <div className="mb-1.5 text-base font-bold text-gray-900">{a.judul}</div>
                <div className="text-sm leading-relaxed text-gray-600">{a.isi}</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <Alert jenis="info">
            <strong>Ingat:</strong> Pinjaman terbaik adalah yang tidak perlu diambil. Cari alternatif dulu
            kalau memungkinkan.
          </Alert>
        </div>
      </div>
    </div>
  );
}