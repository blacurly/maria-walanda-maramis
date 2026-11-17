"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { labelTopik, type Artikel, type Topik } from "@/data/artikel";
import { VIDEO_EDUKASI } from "@/data/videoEdukasi";
import { TONE, type Tone } from "@/lib/tone";
import { Badge } from "@/components/ui/badge";

const POPPINS = { fontFamily: "var(--font-poppins), sans-serif" };

// Warna per topik: Semua hijau, Pinjaman biru, Hak & Hukum ungu, Penagihan merah muda
const TONE_TOPIK: Record<string, Tone> = {
  semua: "emerald",
  pinjaman: "sky",
  "hak-hukum": "violet",
  penagihan: "rose",
};

type Props = {
  daftarArtikel: Artikel[];                  // dari database (lib/artikel/layanan.ts), dikirim oleh halaman
  daftarTopik: { id: Topik; label: string }[];
};

export default function EdukasiDaftar({ daftarArtikel, daftarTopik }: Props) {
  const [tab, setTab] = useState<"artikel" | "video">("artikel");
  const [topik, setTopik] = useState<Topik | "semua">("semua");

  const artikel = daftarArtikel.filter((a) => topik === "semua" || a.topik === topik);
  const video = VIDEO_EDUKASI.filter((v) => topik === "semua" || v.topik === topik);

  const pilihanTopik = [{ id: "semua" as const, label: "Semua" }, ...daftarTopik];

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20">
      {/* Filter topik */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {pilihanTopik.map((t) => {
          const tn = TONE.emerald;
          return (
            <button
              key={t.id}
              onClick={() => setTopik(t.id)}
              className={`rounded-full border-[1.5px] px-5 py-2 text-sm font-semibold transition-all ${
                topik === t.id ? `border-transparent shadow-sm ${tn.ajakan}` : `${tn.kartu} ${tn.label}`
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Artikel / Video */}
      <div className="mb-10 flex justify-center">
        <div className="flex gap-1 rounded-full bg-[#e6f3ee] p-1" role="tablist">
          {([["artikel", "Artikel"], ["video", "Video"]] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-9 py-2 text-sm transition-all ${
                tab === id ? "bg-white font-bold text-[#034d38] shadow-sm" : "font-medium text-[#5f7d72]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ARTIKEL ── */}
      {tab === "artikel" &&
        (artikel.length === 0 ? (
          <p className="mt-16 text-center text-gray-400">Belum ada artikel untuk topik ini.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artikel.map((a) => {
              const tn = TONE[TONE_TOPIK[a.topik] ?? "emerald"];
              return (
                <Link
                  key={a.slug}
                  href={`/edukasi/${a.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#e3ede9] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(4,103,75,0.12)]"
                >
                  <div className="relative aspect-video bg-[#e6f3ee]">
                    <Image
                      src={a.gambar}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs">
                      <Badge className={`border-transparent px-2.5 font-bold ${tn.ikon} ${tn.label}`}>{a.kategori}</Badge>
                      <span className="text-[#5f7d72]">{a.topikLabel ?? labelTopik(a.topik)}</span>
                    </div>
                    <h2 className="mb-2 text-base font-bold leading-snug text-[#1f2e28] group-hover:text-[#04674b]" style={POPPINS}>
                      {a.judul}
                    </h2>
                    <p className="mb-4 line-clamp-3 text-sm text-[#5f7d72]">{a.ringkasan}</p>
                    <p className="mt-auto text-xs text-[#5f7d72]">{a.menit} menit baca</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

      {/* ── VIDEO ── */}
      {tab === "video" && (
        <div className="space-y-8">
          {topik === "semua" && (
            <div className="mx-auto max-w-3xl">
              <video
                controls
                preload="none"
                poster="/video/edupuan-intro-poster.jpg"
                className="aspect-video w-full rounded-2xl bg-black shadow-sm"
              >
                <source src="/video/edupuan-intro.mp4" type="video/mp4" />
                Browser-mu tidak bisa memutar video ini.
              </video>
              <p className="mt-3 text-sm font-semibold text-gray-800">Kenalan dengan EduPuan</p>
            </div>
          )}

          {video.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {video.map((v) => (
                <div key={v.youtubeId}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                    title={v.judul}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="aspect-video w-full rounded-2xl bg-black"
                  />
                  <p className="mt-3 text-sm font-semibold text-gray-800">{v.judul}</p>
                  <p className="text-xs text-gray-400">
                    {v.kanal} · {labelTopik(v.topik)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400">
              {topik === "semua" ? "Video lainnya segera hadir." : "Belum ada video untuk topik ini."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}