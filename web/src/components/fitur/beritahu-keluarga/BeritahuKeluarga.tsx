"use client";

import { useState } from "react";
import {
  PILIHAN_SITUASI,
  buatPesan,
  type Situasi,
  type Gaya,
} from "@/features/beritahu-keluarga/template";

export default function BeritahuKeluarga() {
  const [situasi, setSituasi] = useState<Situasi | null>(null);
  const [gaya, setGaya] = useState<Gaya>("singkat");
  const [nama, setNama] = useState("");
  const [disalin, setDisalin] = useState(false);

  const pesan = situasi ? buatPesan(situasi, gaya, nama) : null;

  async function salin() {
    if (!pesan) return;
    try {
      await navigator.clipboard.writeText(pesan);
      setDisalin(true);
      setTimeout(() => setDisalin(false), 2000);
    } catch {
      // Browser menolak akses salin: pengguna masih bisa blok teks lalu Ctrl+C
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <h1
        className="mb-2 text-3xl font-extrabold text-gray-900"
        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
      >
        Beritahu orang terdekat
      </h1>
      <p className="mb-8 text-gray-500">
        Template siap pakai. Tinggal salin atau kirim lewat WhatsApp.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Kolom kiri: pilihan */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <label htmlFor="bk-nama" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Nama panggilanmu
            </label>
            <input
              id="bk-nama"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama kamu"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0d6e4b]"
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Situasimu</p>
            <div className="space-y-2">
              {PILIHAN_SITUASI.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSituasi(o.id)}
                  className={`w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ${
                    situasi === o.id
                      ? "border-[#0d6e4b] bg-emerald-50 text-[#0d6e4b]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {situasi && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Gaya pesan</p>
              <div className="flex gap-2">
                {(["singkat", "lengkap"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGaya(g)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                      gaya === g ? "bg-[#0d6e4b] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {g === "singkat" ? "Singkat" : "Lebih lengkap"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kolom kanan: hasil pesan */}
        <div>
          {pesan ? (
            <div className="h-full rounded-2xl border border-gray-100 bg-white p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Pesan yang disusun</p>
              <p className="mb-5 text-sm leading-relaxed text-gray-700">{pesan}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={salin}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#0d6e4b] hover:text-[#0d6e4b]"
                >
                  {disalin ? "✓ Disalin" : "Salin pesan"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(pesan)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
                  </svg>
                  Kirim via WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-400">
              <span className="text-4xl" aria-hidden="true">✉️</span>
              <p className="text-sm">Pilih situasi untuk melihat template pesan</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}