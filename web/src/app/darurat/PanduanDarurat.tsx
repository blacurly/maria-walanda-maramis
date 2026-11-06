"use client";

import { useState } from "react";
import Link from "next/link";
import { KONTAK_BAHAYA, SITUASI, type IdSituasi } from "@/data/kontakDarurat";

// Link telepon (tel:) dibuka langsung; link situs dibuka di tab baru
function atributTautan(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

export default function PanduanDarurat() {
  const [bahaya, setBahaya] = useState<boolean | null>(null);
  const [situasi, setSituasi] = useState<IdSituasi | null>(null);
  const terpilih = SITUASI.find((s) => s.id === situasi);

  function ulangi() {
    setBahaya(null);
    setSituasi(null);
  }

  return (
    <div className="min-h-full bg-red-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Bantuan darurat</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">Kamu tidak sendirian.</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          EduPuan bukan layanan darurat dan tidak bisa merespons laporan. Halaman ini menyediakan nomor yang
          bisa langsung kamu hubungi.
        </p>

        {/* Pertanyaan pertama */}
        {bahaya === null && (
          <div className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-sm">
            <p className="font-bold text-gray-900 text-lg mb-6">Apakah kamu dalam bahaya saat ini?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setBahaya(true)}
                className="w-full bg-red-600 text-white font-bold text-sm py-4 rounded-xl hover:bg-red-700 active:scale-[.98] transition-all shadow-sm"
              >
                Ya, saya dalam bahaya sekarang
              </button>
              <button
                onClick={() => setBahaya(false)}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold text-sm py-4 rounded-xl hover:border-gray-300 hover:bg-gray-50 active:scale-[.98] transition-all"
              >
                Tidak, tapi saya butuh bantuan
              </button>
            </div>
          </div>
        )}

        {/* Dalam bahaya: langsung 3 tombol */}
        {bahaya === true && (
          <div className="space-y-4">
            <div className="bg-red-600 text-white rounded-2xl p-5 mb-2">
              <p className="font-bold text-lg mb-1">Hubungi sekarang.</p>
              <p className="text-red-100 text-sm">Tiga tombol di bawah langsung menghubungi bantuan.</p>
            </div>
            {KONTAK_BAHAYA.map((b) => (
              <a
                key={b.label}
                href={b.href}
                {...atributTautan(b.href)}
                className={`block w-full text-center font-bold text-sm py-4 rounded-xl active:scale-[.98] transition-all ${b.gaya}`}
              >
                {b.label}
              </a>
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">
              WA SAPA 129 tersedia untuk yang tidak bisa berbicara karena pelaku ada di dekatnya.
            </p>
            <button onClick={ulangi} className="block mx-auto text-xs text-gray-400 hover:text-gray-600 underline">
              ← Ubah jawaban
            </button>
          </div>
        )}

        {/* Tidak dalam bahaya: pilih situasi */}
        {bahaya === false && !terpilih && (
          <div className="space-y-3">
            <p className="font-semibold text-gray-800 mb-4">Situasimu yang paling dekat:</p>
            {SITUASI.map((s) => (
              <button
                key={s.id}
                onClick={() => setSituasi(s.id)}
                className="w-full flex items-center gap-4 text-left bg-white border-2 border-gray-100 hover:border-[#0d6e4b] hover:bg-emerald-50 rounded-2xl px-5 py-4 transition-all active:scale-[.98]"
              >
                <span className="text-2xl flex-shrink-0">{s.ikon}</span>
                <span className="font-semibold text-gray-800 text-sm">{s.pilihan}</span>
              </button>
            ))}
            <button onClick={ulangi} className="text-xs text-gray-400 hover:text-gray-600 underline pt-2">
              ← Ubah jawaban
            </button>
          </div>
        )}

        {/* Kontak sesuai situasi */}
        {bahaya === false && terpilih && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setSituasi(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                ← Ganti situasi
              </button>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs font-semibold text-gray-600">{terpilih.judul}</span>
            </div>
            {terpilih.kontak.map((c) => (
              <a
                key={c.label}
                href={c.href}
                {...atributTautan(c.href)}
                className={`flex items-center justify-between w-full ${c.warna} text-white font-bold text-sm px-5 py-4 rounded-xl active:scale-[.98] transition-all shadow-sm`}
              >
                <span>{c.label}</span>
                <span className="text-white/70 text-xs font-mono">{c.nomor}</span>
              </a>
            ))}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
              💡 {terpilih.info}
            </div>
            <div className="pt-2 space-y-2">
              <Link
                href="/sudah-terjerat/analisis-pesan"
                className="block w-full text-center font-semibold rounded-xl text-sm py-3 px-5 transition-all border-2 border-[#0d6e4b] text-[#0d6e4b] hover:bg-emerald-50 bg-white"
              >
                📱 Analisis pesan penagih
              </Link>
              <Link
                href="/sudah-terjerat/dokumentasi-lapor"
                className="block w-full text-center font-semibold rounded-xl text-sm py-3 px-5 transition-all border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
              >
                📁 Panduan dokumentasi & lapor
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}