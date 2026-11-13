import type { Metadata } from "next";
import Link from "next/link";
import { TONE, type Tone } from "@/lib/tone";

export const metadata: Metadata = {
  title: "Sudah Terjerat – EduPuan",
  description:
    "Langkah konkret untuk yang sudah terlanjur berutang: analisis pesan penagih, hak saat ditagih, rangkum utang, dan cara melapor.",
};

type Alat = {
  href: string;
  ikon: string;
  judul: string;
  isi: string;
  ajakan: string;
  mendesak: boolean;
  tone: Tone;
};

const ALAT: Alat[] = [
  {
    href: "/sudah-terjerat/analisis-pesan",
    ikon: "📱",
    judul: "Baca & Analisis Pesan Penagih",
    isi: "Tempel pesan penagih — identifikasi pelanggaran + template balasan.",
    ajakan: "Tempel pesan",
    mendesak: true,
    tone: "rose",
  },
  {
    href: "/sudah-terjerat/hak-saat-ditagih",
    ikon: "SOS",
    judul: "Hak Saat Ditagih",
    isi: "Checklist pelanggaran + template balasan siap salin.",
    ajakan: "Lihat hakku",
    mendesak: true,
    tone: "rose",
  },
  {
    href: "/sudah-terjerat/dokumentasi-lapor",
    ikon: "📁",
    judul: "Dokumentasi & Lapor",
    isi: "Panduan lapor ke OJK, Polisi, Komnas Perempuan.",
    ajakan: "Mulai lapor",
    mendesak: false,
    tone: "sky",
  },
  {
    href: "/sudah-terjerat/rangkum-utang",
    ikon: "📊",
    judul: "Rangkum Semua Utang",
    isi: "Lihat total, tenggat, dan prioritas penanganan semua tagihanmu.",
    ajakan: "Rangkum utang",
    mendesak: false,
    tone: "violet",
  },
  {
    href: "/sudah-terjerat/beritahu-keluarga",
    ikon: "👥",
    judul: "Beritahu Keluarga / Kontak",
    isi: "Template pesan siap kirim via WhatsApp.",
    ajakan: "Buat pesan",
    mendesak: false,
    tone: "emerald",
  },
];

const KONTAK = [
  { label: "OJK", nomor: "157", href: "tel:157" },
  { label: "Komnas Perempuan", nomor: "021-3903963", href: "tel:0213903963" },
  { label: "Kesehatan Jiwa", nomor: "119 ext 8", href: "tel:119" },
];

function KartuAlat({ alat }: { alat: Alat }) {
  const t = TONE[alat.tone];
  return (
    <Link
      href={alat.href}
      className={`group flex w-full flex-col items-start rounded-xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0 ${t.kartu} ${
        alat.mendesak ? "sm:min-h-48" : "sm:min-h-44"
      }`}
    >
      {alat.ikon === "SOS" ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
          <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-xs font-black text-white">SOS</span>
        </span>
      ) : (
        <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl leading-none ${t.ikon}`} aria-hidden="true">
          {alat.ikon}
        </span>
      )}
      <span className="mt-4 text-base font-bold text-foreground">{alat.judul}</span>
      <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{alat.isi}</span>
      <span className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${t.ajakan}`}>
        {alat.ajakan}
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export default function SudahTerjeratPage() {
  const alatMendesak = ALAT.filter((a) => a.mendesak);
  const alatBerikutnya = ALAT.filter((a) => !a.mendesak);

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <h1 className="mb-1.5 text-2xl font-extrabold text-foreground sm:text-3xl">Pilih yang paling mendesak</h1>
        <p className="mb-7 text-sm text-muted-foreground">
          Pilih langkah yang paling sesuai dengan kondisimu saat ini.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {alatMendesak.map((a) => (
            <KartuAlat key={a.href} alat={a} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alatBerikutnya.map((a) => (
            <KartuAlat key={a.href} alat={a} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between">
          <p className="shrink-0 text-[11px] leading-relaxed text-amber-900">
            <strong className="block font-bold text-amber-950">Kamu tidak sendirian.</strong>
            <span className="block lg:whitespace-nowrap">Jutaan orang mengalaminya. Ada langkah konkret hari ini.</span>
          </p>
          <div className="flex min-w-0 flex-wrap gap-2 lg:flex-1 lg:flex-nowrap lg:justify-end">
            {KONTAK.map((k) => (
              <a
                key={k.label}
                href={k.href}
                className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full border border-red-600 bg-red-600 px-3.5 py-2 text-center text-xs font-semibold text-white transition-colors hover:border-red-700 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                {k.label} <span className="ml-2 font-bold">{k.nomor}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}