"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cekNama, saranNama, namaSitus, type HasilCek, type Pinjol } from "@/features/cek-legalitas/rules";
import {
  LINK_OJK_BERIZIN, CONTOH_NAMA, KONTAK_OJK, CIRI_BERIZIN, RISIKO_ILEGAL,
  LANGKAH_ILEGAL, LANGKAH_TIDAK_DITEMUKAN,
} from "@/features/cek-legalitas/data";
import { TONE } from "@/lib/tone";

const POPPINS = { fontFamily: "var(--font-poppins), sans-serif" };
const KARTU = "rounded-2xl border border-gray-100 bg-white shadow-sm";

function Daftar({ isi, warna }: { isi: string[]; warna: "hijau" | "merah" | "abu" }) {
  const bulat = { hijau: "bg-emerald-100 text-emerald-700", merah: "bg-red-100 text-red-600", abu: "bg-gray-100 text-gray-600" }[warna];
  return (
    <ul className="space-y-2">
      {isi.map((s, i) => (
        <li key={s} className="flex items-start gap-2.5 text-sm text-gray-600">
          <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${bulat}`}>
            {warna === "hijau" ? "✓" : warna === "merah" ? "!" : i + 1}
          </span>
          {s}
        </li>
      ))}
    </ul>
  );
}

type Props = {
  daftar: Pinjol[];       // daftar pinjol dari database (atau data cadangan)
  sumber: string[];       // sumber data, untuk ditampilkan
  dariDatabase: boolean;  // false = database tidak bisa dihubungi, memakai cadangan
};

export default function CekLegalitas({ daftar, sumber, dariDatabase }: Props) {
  const [query, setQuery] = useState("");
  const [dicek, setDicek] = useState("");
  const [hasil, setHasil] = useState<HasilCek | null>(null);
  const [bukaSaran, setBukaSaran] = useState(false);

  const saran = useMemo(() => saranNama(query, daftar), [query, daftar]);

  function jalankanCek(nama: string) {
    if (!nama.trim()) return;
    setQuery(nama);
    setDicek(nama.trim());
    setHasil(cekNama(nama, daftar));
    setBukaSaran(false);
  }

  function ulangCek() {
    setQuery("");
    setDicek("");
    setHasil(null);
  }

  return (
    <main>
      {/* ── Hero hijau tua + kotak pencarian ── */}
      <section className="bg-[#07543f] text-white">
        <div className="mx-auto max-w-5xl px-5 pb-8 pt-10">
          <h1 className="mb-2 text-3xl font-extrabold sm:text-4xl" style={POPPINS}>
            Pinjol ini legal atau ilegal?
          </h1>
          <p className="mb-6 max-w-2xl text-sm text-white/80">
            Ketik nama aplikasinya. Kami cocokkan dengan daftar pinjol berizin OJK dan daftar pinjol ilegal dari Satgas PASTI.
          </p>

          <div className="relative max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  placeholder="Contoh: Kredit Pintar"
                  aria-label="Nama aplikasi pinjol"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setBukaSaran(true);
                    setHasil(null);
                  }}
                  onFocus={() => setBukaSaran(true)}
                  onBlur={() => setBukaSaran(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") jalankanCek(query);
                    if (e.key === "Escape") setBukaSaran(false);
                  }}
                  className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-medium text-gray-900 outline-none"
                />
                {bukaSaran && saran.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                    {saran.map((s) => (
                      <button
                        key={`${s.status}-${s.nama}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          jalankanCek(s.nama);
                        }}
                        className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-gray-900">{s.nama}</span>
                          {s.nama_perusahaan && <span className="block truncate text-xs text-gray-400">{s.nama_perusahaan}</span>}
                        </span>
                        <span
                          className={`ml-3 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                            s.status === "legal" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s.status === "legal" ? "Berizin" : "Ilegal"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => jalankanCek(query)}
                className="flex-shrink-0 whitespace-nowrap rounded-xl bg-[#379557] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                Cek sekarang
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
              <span>Coba:</span>
              {CONTOH_NAMA.map((n) => (
                <button key={n} onClick={() => jalankanCek(n)} className="underline hover:text-white">
                  {n}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${dariDatabase ? "bg-emerald-400" : "bg-amber-400"}`} />
            {!dariDatabase && <span>Data cadangan ·</span>}
            <span>Sumber: {sumber.join(" · ")}</span>
            <span>·</span>
            <a href={LINK_OJK_BERIZIN} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
              Cek daftar terbaru di OJK
            </a>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-8">
        {/* Belum ada hasil: kontak OJK */}
        {!hasil && (
          <div className={`${KARTU} max-w-3xl p-6`}>
            <p className="mb-1 text-sm font-bold text-gray-800">Mau memastikan langsung ke OJK?</p>
            <p className="mb-5 text-xs text-gray-500">
              Daftar di halaman ini bisa tertinggal dari pembaruan terbaru. Untuk kepastian, tanyakan langsung ke kanal resmi OJK.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {KONTAK_OJK.map((k) => {
  const t = TONE[k.tone];
  return (
    <a key={k.label} href={k.href}
      {...(k.tabBaru ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`block rounded-xl border p-4 transition-colors ${t.kartu}`}>
      <span className={`mb-1 block text-[11px] font-bold uppercase tracking-wide ${t.label}`}>{k.label}</span>
      <span className="mb-1 block text-sm font-bold text-gray-900">{k.nilai}</span>
      <span className="block text-xs text-gray-600">{k.ket}</span>
    </a>
  );
})}
            </div>
          </div>
        )}

        {/* Hasil: berizin */}
        {hasil?.status === "legal" && (
          <div className="max-w-3xl space-y-4">
            {hasil.tiruan && (
              <div role="alert" className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
                <p className="mb-1 font-bold text-red-800">⚠️ Hati-hati: ada aplikasi tiruan dengan nama ini</p>
                <p className="text-sm leading-relaxed text-red-900">
                  Aplikasi bernama <strong>&ldquo;{hasil.tiruan.nama}&rdquo;</strong> di{" "}
                  <strong>{namaSitus(hasil.tiruan.alamat)}</strong> tercatat <strong>ilegal</strong> oleh Satgas PASTI.
                  Pastikan aplikasi yang kamu pakai berasal dari situs resmi di bawah atau dari Play Store/App Store,
                  dengan nama perusahaan yang sama persis.
                </p>
              </div>
            )}
            <div className={`${KARTU} p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">✓</span>
                  <p className="text-2xl font-extrabold text-gray-900" style={POPPINS}>Berizin OJK</p>
                </div>
                <button onClick={ulangCek} aria-label="Tutup hasil" className="text-2xl text-gray-400 hover:text-gray-600">×</button>
              </div>
              <dl className="mb-5 space-y-2 text-sm">
                {[
                  ["Nama aplikasi", hasil.data.nama],
                  ["Perusahaan", hasil.data.nama_perusahaan ?? "—"],
                  ["Situs resmi", namaSitus(hasil.data.alamat) || "—"],
                  ["Sumber", hasil.data.sumber],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-3">
                    <dt className="w-28 flex-shrink-0 text-gray-400">{l}</dt>
                    <dd className="font-medium text-gray-800">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mb-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                Pastikan nama perusahaan di aplikasimu <strong>sama persis</strong> dengan data di atas, dan unduh hanya dari Play Store atau App Store resmi. Banyak pinjol ilegal meniru nama pinjol berizin.
              </p>
              <p className="mb-3 text-xs font-bold text-gray-700">Ciri pinjol berizin</p>
              <Daftar isi={CIRI_BERIZIN} warna="hijau" />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <button onClick={ulangCek} className="text-xs text-gray-400 underline hover:text-gray-600">Cek pinjol lain</button>
                <a href={LINK_OJK_BERIZIN} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#0d6e4b] hover:underline">
                  Konfirmasi di situs OJK →
                </a>
              </div>
            </div>
            <div className={`${KARTU} p-6`}>
              <p className="mb-1 text-sm font-bold text-gray-800">Berizin belum tentu aman untukmu</p>
              <p className="mb-4 text-sm text-gray-500">
                Sebelum meminjam, hitung dulu apakah cicilannya masuk di penghasilan bulananmu dan berapa total yang harus dikembalikan.
              </p>
              <Link href="/mau-pinjam/cek-penawaran" className="inline-block rounded-xl bg-[#0d6e4b] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                Hitung di Cek Penawaran →
              </Link>
            </div>
          </div>
        )}

        {/* Hasil: mirip, belum cocok persis */}
        {hasil?.status === "mirip" && (
          <div className={`${KARTU} max-w-2xl border-amber-200 p-6`}>
            <p className="mb-2 text-lg font-extrabold text-gray-900" style={POPPINS}>
              &ldquo;{dicek}&rdquo; belum cocok persis
            </p>
            <p className="mb-4 text-sm text-gray-600">
              Mungkin maksudmu{" "}
              <button onClick={() => jalankanCek(hasil.data.nama)} className="font-bold text-[#0d6e4b] underline">
                {hasil.data.nama}
              </button>{" "}
              ({hasil.data.nama_perusahaan})?
            </p>
            <p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Hati-hati:</strong> nama yang <em>mirip</em> belum tentu aplikasi yang sama. Pinjol ilegal sering memakai nama yang menyerupai pinjol berizin. Cocokkan nama perusahaannya.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={ulangCek} className="rounded-xl bg-[#0d6e4b] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">← Coba nama lain</button>
              <a href={LINK_OJK_BERIZIN} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-[#0d6e4b] bg-white px-5 py-2.5 text-sm font-bold text-[#0d6e4b] hover:bg-emerald-50">Cek ke OJK ↗</a>
            </div>
          </div>
        )}

        {/* Hasil: ilegal */}
        {hasil?.status === "ilegal" && (
          <div className={`${KARTU} max-w-3xl p-6`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-xl text-white">×</span>
                <p className="text-2xl font-extrabold text-gray-900" style={POPPINS}>Tercatat sebagai pinjol ilegal</p>
              </div>
              <button onClick={ulangCek} aria-label="Tutup hasil" className="text-2xl text-gray-400 hover:text-gray-600">×</button>
            </div>
            <p className="mb-5 text-sm text-gray-600">
              <strong>{hasil.data.nama}</strong> ada di daftar pinjol ilegal ({hasil.data.sumber}).
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-bold text-gray-700">Risiko kalau tetap meminjam</p>
                <Daftar isi={RISIKO_ILEGAL} warna="merah" />
              </div>
              <div>
                <p className="mb-3 text-xs font-bold text-gray-700">Yang sebaiknya kamu lakukan</p>
                <Daftar isi={LANGKAH_ILEGAL} warna="abu" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              <a href="https://sipasti.ojk.go.id" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#4f46e5] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                Laporkan ke Satgas PASTI ↗
              </a>
              <Link href="/darurat" className="text-sm font-semibold text-gray-600 underline underline-offset-2 hover:text-gray-900">
                Sedang diteror penagih? Buka panduan darurat
              </Link>
            </div>
          </div>
        )}

        {/* Hasil: tidak ditemukan */}
        {hasil?.status === "tidak-ditemukan" && (
          <div className={`${KARTU} max-w-2xl p-6`}>
            <p className="mb-2 text-lg font-extrabold text-gray-900" style={POPPINS}>&ldquo;{dicek}&rdquo; tidak ditemukan</p>
            <p className="mb-5 text-sm text-gray-500">
              Nama ini belum ada di daftar kami. <strong>Ini bukan berarti legal</strong>: bisa jadi aplikasinya baru, berganti nama, atau belum tercatat.
            </p>
            <div className="mb-5"><Daftar isi={LANGKAH_TIDAK_DITEMUKAN} warna="abu" /></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={ulangCek} className="rounded-xl bg-[#0d6e4b] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">← Coba nama lain</button>
              <a href={LINK_OJK_BERIZIN} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-[#0d6e4b] bg-white px-5 py-2.5 text-sm font-bold text-[#0d6e4b] hover:bg-emerald-50">Cek ke OJK ↗</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}