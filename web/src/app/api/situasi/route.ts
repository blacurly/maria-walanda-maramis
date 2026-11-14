import { NextResponse } from "next/server";
import { bacaJson, galat } from "@/lib/api/galat";
import { cekPembatas } from "@/lib/api/pembatas";
import { arahkanSituasi, periksaCerita } from "@/lib/fitur/situasi";
import { ATURAN_HITUNG } from "@/lib/fitur/umum";

// POST /api/situasi
// "Ceritakan Situasimu": membaca cerita dengan aturan kata kunci (bukan AI), lalu mengarahkan
// ke fitur EduPuan dan pihak berwenang. Deteksi darurat selalu dijalankan.
// PRIVASI: isi cerita tidak disimpan dan tidak ditulis ke log.
export async function POST(req: Request) {
  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const data = periksaCerita(isi);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  const ditolak = await cekPembatas(req, ATURAN_HITUNG);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, ...arahkanSituasi(data.cerita) });
  } catch {
    console.error("Kesalahan tak terduga di /api/situasi (isi cerita sengaja tidak dicatat).");
    return galat("GANGGUAN_LAYANAN", "Maaf, ceritamu belum bisa dibaca. Coba lagi sebentar lagi ya.");
  }
}
