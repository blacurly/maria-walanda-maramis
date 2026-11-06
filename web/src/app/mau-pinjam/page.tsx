import type { Metadata } from "next";
import Link from "next/link";
import Alert from "@/components/ui/Alert";

export const metadata: Metadata = {
  title: "Mau Pinjam – EduPuan",
  description: "Cek penawaran, legalitas, dan alternatif sebelum memutuskan meminjam.",
};

const ALAT = [
  {
    href: "/mau-pinjam/cek-penawaran",
    ikon: "🧮",
    judul: "Cek Penawaran",
    isi: "Hitung biaya sebenarnya dan lihat lampu risiko hijau/kuning/merah.",
  },
  {
    href: "/mau-pinjam/cek-legalitas",
    ikon: "🔍",
    judul: "Cek Legalitas Pinjol",
    isi: "Masukkan nama pinjol untuk memeriksa status legalitasnya berdasarkan data OJK.",
  },
  {
    href: "/mau-pinjam/cari-alternatif",
    ikon: "💡",
    judul: "Cek Alternatif Lain",
    isi: "Cari solusi tanpa menambah utang: bantuan resmi, keringanan tagihan, dan bantuan pendidikan.",
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
          {ALAT.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group text-left bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#0d6e4b] hover:shadow-md transition-all active:scale-[.98]"
            >
              <span className="text-4xl block mb-4">{a.ikon}</span>
              <div className="font-bold text-gray-900 text-base mb-1.5 group-hover:text-[#0d6e4b] transition-colors">
                {a.judul}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">{a.isi}</div>
            </Link>
          ))}
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