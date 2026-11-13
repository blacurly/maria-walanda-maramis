import { NextResponse } from "next/server";
import { galat } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { BATAS, GalatPinjol, cekLegalitas } from "@/lib/pinjol/layanan";

// GET /api/pinjol/cek?nama=Kredit Pintar
// Mencocokkan nama aplikasi dengan daftar pinjol berizin OJK & ilegal Satgas PASTI — DI SERVER.
// Balasan: { ok, hasil: { status: legal | ilegal | mirip | tidak-ditemukan, ... }, saran: [...] }

export async function GET(req: Request) {
  const nama = (new URL(req.url).searchParams.get("nama") ?? "").trim();
  if (nama.length < 2) return galat("DATA_TIDAK_VALID", "Ketik minimal 2 huruf nama aplikasi.");
  if (nama.length > BATAS.cari) return galat("DATA_TIDAK_VALID", `Nama aplikasi maksimal ${BATAS.cari} huruf.`);

  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, ...(await cekLegalitas(nama)) });
  } catch (e) {
    if (e instanceof GalatPinjol) return galat(e.kode, e.message);
    console.error("Kesalahan tak terduga di GET /api/pinjol/cek:", e);
    return galat("GANGGUAN_LAYANAN", "Maaf, pengecekan sedang bermasalah. Coba lagi sebentar lagi ya.");
  }
}