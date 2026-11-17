import { NextResponse } from "next/server";
import { galat } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { daftarNamaPinjol } from "@/lib/pinjol/layanan";

// GET /api/pinjol/nama
// Daftar nama pinjol berizin OJK (+ nama perusahaan) dan nama pinjol ilegal, ringkas, dari database.
// Dipakai fitur yang menyarankan nama dan mendeteksi status saat pengguna mengetik
// (Hak Saat Ditagih, Rangkum Utang, Dokumentasi & Lapor). Balasan disimpan CDN 10 menit.
export async function GET(req: Request) {
  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    const { legal, ilegal, per } = await daftarNamaPinjol();
    return NextResponse.json(
      { ok: true, per, legal, ilegal },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
    );
  } catch (e) {
    console.error("Kesalahan tak terduga di GET /api/pinjol/nama:", e);
    return galat("GANGGUAN_LAYANAN", "Daftar nama pinjol belum bisa dimuat. Coba lagi sebentar lagi ya.");
  }
}
