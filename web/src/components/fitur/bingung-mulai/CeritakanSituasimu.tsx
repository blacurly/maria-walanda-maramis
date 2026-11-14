"use client";

import { useState } from "react";
import Link from "next/link";
import { analisisCerita, FEATURES, PIHAK, type Hasil } from "@/features/bingung-mulai/rules";
import { TONE, TONE_FITUR } from "@/lib/tone";

const POPPINS = { fontFamily: "var(--font-poppins), sans-serif" };
const MAX = 2000;
const MIN = 15;

const STARTERS: [string, string][] = [
  ["Ada tawaran pinjaman", "Saya dapat tawaran pinjaman dari aplikasi dan bingung mau ambil atau tidak."],
  ["Utangku di banyak aplikasi", "Utang saya ada di beberapa aplikasi dan saya tidak tahu totalnya berapa."],
  ["Diteror penagih", "Penagih terus menelepon dan meneror saya."],
  ["Butuh uang cepat", "Saya butuh uang cepat untuk kebutuhan mendesak."],
];

export default function CeritakanSituasimu() {
  const [cerita, setCerita] = useState("");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [disalin, setDisalin] = useState<string | null>(null);
  const [galat, setGalat] = useState("");

  function analisis(text: string) {
    if (text.trim().length < MIN) {
      setGalat(`Ceritakan sedikit lagi (minimal ${MIN} karakter) supaya arahannya tepat.`);
      return;
    }
    setHasil(analisisCerita(text));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function tambahStarter(t: string) {
    setCerita((s) => ((s.trim() ? s.trim() + " " : "") + t + " ").slice(0, MAX));
    setGalat("");
  }

  function jawab(pilihan: string) {
    const t = (cerita.trim() ? cerita.trim() + "\n" : "") + pilihan;
    setCerita(t);
    setHasil(analisisCerita(t));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salin(v: string) {
    try {
      await navigator.clipboard.writeText(v);
      setDisalin(v);
      setTimeout(() => setDisalin(null), 1500);
    } catch {
      // Clipboard ditolak: teks tetap bisa diblok manual
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
      {!hasil ? (
        /* ───────── INPUT ───────── */
        <>
          <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl" style={POPPINS}>
            Ceritakan situasimu
          </h1>
          <p className="-mt-2 text-base leading-relaxed text-gray-500 sm:text-lg">
            Tulis dengan bahasamu sendiri. Kami akan membaca ceritamu dan memberi arahan yang sesuai.
          </p>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3.5 text-sm leading-relaxed text-sky-900">
            <b className="font-semibold">Privasi kamu.</b> Ceritamu diproses di perangkatmu dan tidak disimpan oleh
            EduPuan. Tidak perlu menulis nama asli, nomor HP, atau NIK.
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="cerita" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ceritamu
            </label>
            <textarea
              id="cerita"
              value={cerita}
              maxLength={MAX}
              onChange={(e) => {
                setCerita(e.target.value);
                setGalat("");
              }}
              placeholder='Contoh: "saya pinjam di 3 aplikasi, ada yang jatuh tempo minggu ini, teman saya sudah ditelepon penagih..."'
              className="min-h-40 w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-4 leading-relaxed shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0d6e4b]"
            />
            <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-500">
              <span>Bingung mulai dari mana? Pilih salah satu:</span>
              <span>
                {cerita.length} / {MAX}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(([label, t]) => (
                <button
                  key={label}
                  onClick={() => tambahStarter(t)}
                  className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm transition-colors hover:border-[#0d6e4b] hover:bg-emerald-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={() => analisis(cerita)}
              className="w-full rounded-xl bg-[#0d6e4b] px-5 py-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#0a5c3e]"
            >
              Analisis situasiku →
            </button>
            {galat && <p className="mt-2 text-sm text-red-600">{galat}</p>}
          </div>
        </>
      ) : (
        /* ───────── HASIL ───────── */
        <>
          {hasil.darurat && <BannerDarurat diri={hasil.jenis_darurat === "menyakiti_diri"} />}

          {hasil.perlu_tanya ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <h2 className="text-xl font-bold" style={POPPINS}>
                {hasil.perlu_tanya.pertanyaan}
              </h2>
              <p className="text-gray-500">Pilih yang paling sesuai, supaya arahannya tepat.</p>
              <div className="flex flex-wrap gap-2">
                {hasil.perlu_tanya.pilihan.map((p) => (
                  <button
                    key={p}
                    onClick={() => jawab(p)}
                    className="rounded-full border border-purple-100 bg-white px-3.5 py-1.5 text-sm hover:bg-emerald-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {hasil.tanggapan && (
                <div className="flex flex-col gap-2 rounded-r-2xl border border-l-4 border-emerald-200 border-l-emerald-700 bg-emerald-50 px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tanggapan untukmu</p>
                  <p className="text-base">{hasil.tanggapan}</p>
                </div>
              )}

              {hasil.langkah.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold" style={POPPINS}>
                    Yang bisa kamu lakukan sekarang
                  </h2>
                  <ol className="flex flex-col gap-2.5">
                    {hasil.langkah.map((l, i) => (
                      <li key={l.aksi} className="flex gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-700 text-white">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <b className="block font-semibold">{l.aksi}</b>
                          {l.alasan && <span className="text-sm text-gray-500">{l.alasan}</span>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {hasil.fitur.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold" style={POPPINS}>
                    Fitur EduPuan yang bisa membantu
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {hasil.fitur.map((f) => {
                    const t = TONE[TONE_FITUR[f.id] ?? "emerald"];
                       return (
                    <div key={f.id} className={`group flex min-w-0 flex-col gap-2 rounded-2xl border p-4 shadow-sm ${t.kartu}`}>
                    <Tag ungu={false}>Fitur EduPuan</Tag>
                    <h3 className="font-semibold">{FEATURES[f.id].name}</h3>
                    <p className="text-sm">{f.alasan || FEATURES[f.id].desc}</p>
                    <Link href={FEATURES[f.id].href}
                    className={`mt-auto self-start rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${t.ajakan}`}>
                     Buka fitur →
                    </Link>
                    </div>
                    );
                  })}
                  </div>
                </section>
              )}

              {hasil.pihak.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold" style={POPPINS}>
                    Pihak yang bisa kamu hubungi
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {hasil.pihak.map((p) => {
                      const P = PIHAK[p.id];
                      return (
                        <div key={p.id} className="flex min-w-0 flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <Tag ungu>Pihak berwenang</Tag>
                          <h3 className="font-semibold">{P.name}</h3>
                          <p className="text-sm">{p.alasan || P.untuk}</p>
                          <div className="flex flex-col gap-1.5">
                            {P.kontak.map(([k, v]) => (
                              <div key={k + v} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-sm">
                                <span className="text-gray-500">{k}</span>
                                <b className="select-all break-words">{v}</b>
                                {/[\d.]/.test(v) && (
                                  <button
                                    onClick={() => salin(v)}
                                    className="ml-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-[#0d6e4b]"
                                  >
                                    {disalin === v ? "Disalin" : "Salin"}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">
                            <b className="text-gray-900">Siapkan:</b> {P.siapkan}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm text-gray-500">
            <span className="text-xs">Arahan ini disusun otomatis dari ceritamu, bukan nasihat hukum.</span>
            <button onClick={() => setHasil(null)} className="font-semibold text-[#0d6e4b] underline underline-offset-4">
              Kurang pas? Ceritakan ulang
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function Tag({ ungu, children }: { ungu: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        "self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider " +
        (ungu ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-[#0d6e4b]")
      }
    >
      {children}
    </span>
  );
}

function BannerDarurat({ diri }: { diri: boolean }) {
  const kontak: [string, string][] = diri
    ? [["Kesehatan jiwa", "119 ext. 8"], ["Darurat", "112"]]
    : [["Darurat", "112"], ["Polisi", "110"], ["SAPA (perempuan)", "129"]];
  return (
    <div role="alert" className="flex flex-col gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
      <h2 className="text-lg font-bold text-red-700">
        {diri ? "Kamu tidak harus menghadapi ini sendirian" : "Keselamatanmu yang utama"}
      </h2>
      <p>
        {diri
          ? "Dari ceritamu, sepertinya kamu sedang sangat berat. Utang bisa diurus pelan-pelan, tapi kamu perlu didengar sekarang. Hubungi orang yang kamu percaya atau layanan di bawah ini."
          : "Ancaman, kekerasan, penyebaran data, dan pelecehan bukan hal yang harus kamu terima. Kalau kamu dalam bahaya sekarang, hubungi:"}
      </p>
      <div className="flex flex-wrap gap-2">
        {kontak.map(([n, v]) => (
          <span key={v} className="rounded-xl border border-red-100 bg-white px-3 py-1.5 text-sm">
            {n}: <b className="select-all">{v}</b>
          </span>
        ))}
      </div>
      <Link href="/darurat" className="self-start text-sm font-semibold text-red-700 underline underline-offset-4">
        Buka Halaman Darurat →
      </Link>
    </div>
  );
}