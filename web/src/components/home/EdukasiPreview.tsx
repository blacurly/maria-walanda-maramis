"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { labelTopik, type Artikel, type Topik } from "@/data/artikel";
import { VIDEO_EDUKASI } from "@/data/videoEdukasi";

type PilihanTopik = Topik | "semua";

type Props = {
  daftarArtikel: Artikel[];                  // dari database (lib/artikel/layanan.ts), dikirim oleh halaman Beranda
  daftarTopik: { id: Topik; label: string }[];
};

export default function EdukasiPreview({ daftarArtikel, daftarTopik }: Props) {
  const [topik, setTopik] = useState<PilihanTopik>("semua");

  const daftar = daftarArtikel.filter((a) => topik === "semua" || a.topik === topik);
  const [utama, ...lainnya] = daftar;
  const samping = lainnya.slice(0, 3);
  const video = VIDEO_EDUKASI.slice(0, 4);
  const pilihan = [{ id: "semua" as const, label: "Semua" }, ...daftarTopik];

  return (
    <section className="bg-white border-t border-gray-100 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Judul + tombol topik */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold text-[#0d6e4b] uppercase tracking-widest mb-2">Edukasi</p>
            <h2 className="text-2xl font-extrabold text-gray-900">Belajar sebelum memutuskan</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pilihan.map((t) => (
              <button
                key={t.id}
                onClick={() => setTopik(t.id)}
                aria-pressed={topik === t.id}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full transition-all ${
                  topik === t.id ? "bg-[#0d4f34] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Artikel: 1 besar + sampai 3 kecil */}
        {utama && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Link
              href={`/edukasi/${utama.slug}`}
              className={`group ${samping.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}
            >
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/7" }}>
                <Image
                  src={utama.gambar}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <span className="inline-block bg-[#0d6e4b] text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
                    {utama.kategori}
                  </span>
                  <h3 className="text-white font-bold text-lg leading-snug max-w-md">{utama.judul}</h3>
                  <p className="text-white/80 text-xs mt-1.5">
                    {utama.topikLabel ?? labelTopik(utama.topik)} · {utama.menit} menit baca
                  </p>
                </div>
              </div>
            </Link>

            {samping.length > 0 && (
              <div className="flex flex-col gap-4">
                {samping.map((a) => (
                  <Link key={a.slug} href={`/edukasi/${a.slug}`} className="group flex gap-3">
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={a.gambar}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-[#0d6e4b] uppercase tracking-wide">{a.kategori}</span>
                      <p className="text-xs font-semibold text-gray-800 leading-snug mt-0.5 group-hover:text-[#0d4f34] transition-colors line-clamp-2">
                        {a.judul}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {a.topikLabel ?? labelTopik(a.topik)} · {a.menit} menit baca
                      </p>
                    </div>
                  </Link>
                ))}
                <Link href="/edukasi" className="text-xs font-semibold text-[#0d6e4b] hover:underline mt-1">
                  Semua artikel →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Video */}
        {video.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </span>
                Video Edukasi
              </h3>
              <Link href="/edukasi" className="text-xs font-semibold text-[#0d6e4b] hover:underline">
                Lihat semua →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {video.map((v) => (
                <a
                  key={v.youtubeId}
                  href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="relative rounded-xl overflow-hidden mb-2.5 bg-gray-900" style={{ aspectRatio: "16/9" }}>
                    <Image
                      src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg viewBox="0 0 24 24" fill="#0d4f34" className="w-4 h-4 translate-x-0.5" aria-hidden="true">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      YouTube ↗
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-[#0d4f34] transition-colors line-clamp-2">
                    {v.judul}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{v.kanal}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}