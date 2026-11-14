import { NextResponse } from "next/server";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { daftarSituasiDarurat } from "@/lib/lembaga/layanan";

// GET /api/darurat → situasi darurat beserta kontak bantuannya (publik, hanya yang aktif)
// Kalau database tidak bisa dihubungi, tetap membalas dari data cadangan (dariDatabase: false).
export async function GET(req: Request) {
  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  const { situasi, dariDatabase } = await daftarSituasiDarurat();
  return NextResponse.json({ ok: true, data: situasi, dariDatabase });
}
