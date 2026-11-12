import { NextResponse } from "next/server";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { GalatPuan, kirimUmpanBalik, periksaUmpanBalik } from "@/lib/puan/klien";

// POST /api/umpan-balik
// Meneruskan penilaian "Apakah jawaban ini membantu?" ke server Puan AI.
// ANONIM: hanya nilai (1 / -1) + label topik/situasi/status. Tidak ada isi pertanyaan atau jawaban.
// Alur: baca kiriman → validasi → cek pembatas → kirim → balas.

export async function POST(req: Request) {
  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format tidak dikenali.");

  const data = periksaUmpanBalik(isi);
  if (!data) return galat("DATA_TIDAK_VALID", "Data umpan balik tidak valid.");

  const ditolak = await cekPembatas(req, ATURAN.umpanBalik);
  if (ditolak) return ditolak;

  try {
    const tersimpan = await kirimUmpanBalik(data);
    if (!tersimpan) return galat("GANGGUAN_LAYANAN", "Umpan balik belum tersimpan. Coba lagi nanti ya.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GalatPuan) return galat(e.kode, e.message);
    console.error("Kesalahan tak terduga di /api/umpan-balik:", e);
    return galat("GANGGUAN_LAYANAN", "Umpan balik belum terkirim. Coba lagi nanti ya.");
  }
}