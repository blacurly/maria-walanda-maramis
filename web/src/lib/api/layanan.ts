// Alat bersama untuk semua lib/<fitur>/layanan.ts (artikel, lembaga, dan berikutnya).
// Tujuannya: semua fitur menerjemahkan error database dengan cara yang SAMA.
import { galat, type KodeGalat } from "./galat";

// Error yang sudah diterjemahkan ke kode resmi (lib/api/galat.ts). Route tinggal meneruskan.
export class GalatLayanan extends Error {
  constructor(public kode: KodeGalat, pesan: string) {
    super(pesan);
  }
}

// Menerjemahkan error Supabase/PostgreSQL ke kode resmi.
//   pesanDuplikat: pesan kalau melanggar UNIQUE (mis. "Slug artikel sudah dipakai.")
export function terjemahkanDb(
  e: { code?: string; message?: string },
  konteks: string,
  pesanDuplikat = "Data yang sama sudah ada.",
): GalatLayanan {
  if (e.code === "23505") return new GalatLayanan("DATA_SUDAH_ADA", pesanDuplikat);
  if (e.code === "23503") return new GalatLayanan("DATA_TIDAK_VALID", "Data ini masih dipakai atau rujukannya tidak ada.");
  if (e.code === "23514" || e.code === "22P02" || e.code === "23502")
    return new GalatLayanan("DATA_TIDAK_VALID", "Isi data tidak sesuai aturan.");
  console.error(`Supabase error (${konteks}):`, e.code, e.message);
  return new GalatLayanan("GANGGUAN_LAYANAN", "Database sedang bermasalah. Coba lagi sebentar lagi ya.");
}

// Dipakai di blok catch setiap route: error yang dikenal diteruskan, sisanya jadi 502.
export function balasGalat(e: unknown, tempat: string) {
  if (e instanceof GalatLayanan) return galat(e.kode, e.message);
  console.error(`Kesalahan tak terduga di ${tempat}:`, e);
  return galat("GANGGUAN_LAYANAN", "Maaf, ada gangguan. Coba lagi sebentar lagi ya.");
}

// Membaca ?halaman=&per_halaman= (dipakai semua endpoint daftar). Mengembalikan pesan error kalau tidak valid.
export function periksaHalaman(cari: URLSearchParams, bawaan = 20, maksimal = 100) {
  const halaman = Number(cari.get("halaman") ?? 1);
  const perHalaman = Number(cari.get("per_halaman") ?? bawaan);
  if (!Number.isInteger(halaman) || halaman < 1) return "Halaman harus bilangan bulat mulai dari 1.";
  if (!Number.isInteger(perHalaman) || perHalaman < 1 || perHalaman > maksimal)
    return `per_halaman harus antara 1 dan ${maksimal}.`;
  return { halaman, perHalaman };
}

// Membersihkan kata pencarian untuk filter PostgREST .or(...ilike...).
export function kataAman(q: string) {
  return q.replace(/[%,()"\\*]/g, " ").replace(/\s+/g, " ").trim();
}

export const teks = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);
