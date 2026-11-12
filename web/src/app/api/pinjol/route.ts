import { NextResponse } from "next/server";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { cekAdmin } from "@/lib/api/admin";
import {
  GalatPinjol, daftarPinjol, periksaDataTulis, periksaParameterDaftar, tambahPinjol,
} from "@/lib/pinjol/layanan";

// GET  /api/pinjol?q=&status=&halaman=&per_halaman=   → daftar pinjol (publik)
// POST /api/pinjol                                     → tambah pinjol (wajib header X-Admin-Key)

function gagal(e: unknown, tempat: string) {
  if (e instanceof GalatPinjol) return galat(e.kode, e.message);
  console.error(`Kesalahan tak terduga di ${tempat}:`, e);
  return galat("GANGGUAN_LAYANAN", "Maaf, ada gangguan. Coba lagi sebentar lagi ya.");
}

export async function GET(req: Request) {
  const parameter = periksaParameterDaftar(new URL(req.url).searchParams);
  if (typeof parameter === "string") return galat("DATA_TIDAK_VALID", parameter);

  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, ...(await daftarPinjol(parameter)) });
  } catch (e) {
    return gagal(e, "GET /api/pinjol");
  }
}

export async function POST(req: Request) {
  const ditolak = await cekPembatas(req, ATURAN.admin);
  if (ditolak) return ditolak;

  const tanpaIzin = cekAdmin(req);
  if (tanpaIzin) return tanpaIzin;

  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const data = periksaDataTulis(isi, true);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  try {
    return NextResponse.json({ ok: true, data: await tambahPinjol(data) }, { status: 201 });
  } catch (e) {
    return gagal(e, "POST /api/pinjol");
  }
}