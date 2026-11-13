export type Tone = "emerald" | "sky" | "amber" | "rose" | "violet";

export const TONE: Record<Tone, { kartu: string; ikon: string; label: string; ajakan: string }> = {
  emerald: { kartu: "border-emerald-200 bg-emerald-50 hover:border-emerald-300", ikon: "bg-emerald-100", label: "text-emerald-800", ajakan: "bg-emerald-700 text-white group-hover:bg-emerald-800" },
  sky:     { kartu: "border-sky-200 bg-sky-50 hover:border-sky-300",             ikon: "bg-sky-100",     label: "text-sky-800",     ajakan: "bg-sky-700 text-white group-hover:bg-sky-800" },
  amber:   { kartu: "border-amber-200 bg-amber-50 hover:border-amber-300",       ikon: "bg-amber-100",   label: "text-amber-900",   ajakan: "bg-amber-700 text-white group-hover:bg-amber-800" },
  rose:    { kartu: "border-rose-200 bg-rose-50 hover:border-rose-300",          ikon: "bg-rose-100",    label: "text-rose-800",    ajakan: "bg-rose-600 text-white group-hover:bg-rose-700" },
  violet:  { kartu: "border-violet-200 bg-violet-50 hover:border-violet-300",    ikon: "bg-violet-100",  label: "text-violet-800",  ajakan: "bg-violet-600 text-white group-hover:bg-violet-700" },
};

// warna tetap per fitur, dipakai di semua halaman
export const TONE_FITUR: Record<string, Tone> = {
  "cek-penawaran": "emerald",
  "cek-legalitas": "sky",
  "cari-alternatif": "amber",
  "rangkum-utang": "violet",
  "hak-ditagih": "rose",
  "analisis-pesan": "rose",
  "lapor": "sky",
  "beritahu-keluarga": "emerald",
};