import { NextResponse } from "next/server";
import { bacaJson, galat } from "@/lib/api/galat";
import { cekPembatas } from "@/lib/api/pembatas";
import { cekPenawaran, periksaInputPenawaran } from "@/lib/fitur/penawaran";
import { ATURAN_HITUNG } from "@/lib/fitur/umum";

// POST /api/penawaran/cek
// Memeriksa penawaran pinjol terhadap batas biaya OJK (SEOJK 19/2025) dan kemampuan bayar.
// Alur: baca kiriman → validasi → pembatas → hitung (features/cek-penawaran/hitung.ts) → balas.
// Data yang dikirim hanya dipakai untuk menghitung, tidak disimpan.
export async function POST(req: Request) {
  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const input = periksaInputPenawaran(isi);
  if (typeof input === "string") return galat("DATA_TIDAK_VALID", input);

  const ditolak = await cekPembatas(req, ATURAN_HITUNG);
  if (ditolak) return ditolak;

  try {
    const hasil = cekPenawaran(input);
    if (!hasil.lengkap) return galat("DATA_TIDAK_VALID", hasil.pesan);
    return NextResponse.json({ ok: true, ...hasil.hasil });
  } catch (e) {
    console.error("Kesalahan tak terduga di /api/penawaran/cek:", e);
    return galat("GANGGUAN_LAYANAN", "Maaf, perhitungan gagal. Coba lagi sebentar lagi ya.");
  }
}
