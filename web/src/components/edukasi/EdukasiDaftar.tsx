"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { labelTopik, type Artikel, type Topik } from "@/data/artikel";
import { VIDEO_EDUKASI } from "@/data/videoEdukasi";

const POPPINS = { fontFamily: "var(--font-poppins), sans-serif" };

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
        {pilihanTopik.map((t) => (
          <button
            key={t.id}
            onClick={() => setTopik(t.id)}
            className={`rounded-full border-[1.5px] px-5 py-2 text-sm font-semibold transition-all ${
              topik === t.id
                ? "border-[#0d6e4b] bg-[#0d6e4b] text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Artikel / Video */}
      <div className="mb-10 flex justify-center">
        <div className="flex gap-1 rounded-full bg-gray-100 p-1" role="tablist">
          {([["artikel", "Artikel"], ["video", "Video"]] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-9 py-2 text-sm transition-all ${
                tab === id ? "bg-white font-bold text-gray-900 shadow-sm" : "font-medium text-gray-500"
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
            {artikel.map((a) => (
              <Link
                key={a.slug}
                href={`/edukasi/${a.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] bg-gray-100">
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
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-[#0d6e4b]">{a.kategori}</span>
                    <span className="text-gray-400">{a.topikLabel ?? labelTopik(a.topik)}</span>
                  </div>
                  <h2 className="mb-2 text-base font-bold leading-snug text-gray-900 group-hover:text-[#0d6e4b]" style={POPPINS}>
                    {a.judul}
                  </h2>
                  <p className="mb-4 line-clamp-3 text-sm text-gray-500">{a.ringkasan}</p>
                  <p className="mt-auto text-xs text-gray-400">{a.menit} menit baca</p>
                </div>
              </Link>
            ))}
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