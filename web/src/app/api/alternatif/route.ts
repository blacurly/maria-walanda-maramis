import { NextResponse } from "next/server";
import { bacaJson, galat } from "@/lib/api/galat";
import { cekPembatas } from "@/lib/api/pembatas";
import { daftarPertanyaan, periksaJawaban, rekomendasiAlternatif } from "@/lib/fitur/alternatif";
import { ATURAN_HITUNG } from "@/lib/fitur/umum";

// GET  /api/alternatif  → daftar kategori dan pertanyaannya
// POST /api/alternatif  → rekomendasi solusi tanpa berutang, berdasarkan jawaban pengguna
// Aturan rekomendasi ada di features/cari-alternatif/rules.ts (sama dengan halaman Cari Alternatif).
export async function GET(req: Request) {
  const ditolak = await cekPembatas(req, ATURAN_HITUNG);
  if (ditolak) return ditolak;
  return NextResponse.json({ ok: true, data: daftarPertanyaan() });
}

export async function POST(req: Request) {
  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const data = periksaJawaban(isi);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  const ditolak = await cekPembatas(req, ATURAN_HITUNG);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, ...rekomendasiAlternatif(data.kategori, data.jawaban, data.putaran) });
  } catch (e) {
    console.error("Kesalahan tak terduga di /api/alternatif:", e);
    return galat("GANGGUAN_LAYANAN", "Maaf, rekomendasi gagal disusun. Coba lagi sebentar lagi ya.");
  }
}
