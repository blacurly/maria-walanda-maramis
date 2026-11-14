import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { cekAdmin } from "@/lib/api/admin";
import { balasGalat, periksaHalaman } from "@/lib/api/layanan";
import { daftarLembaga, periksaDataLembaga, periksaParameterDaftar, tambahLembaga } from "@/lib/lembaga/layanan";

// GET  /api/lembaga?jenis=&q=&halaman=&per_halaman=   → daftar lembaga bantuan aktif (publik)
// POST /api/lembaga                                   → tambah lembaga (wajib header X-Admin-Key)

export async function GET(req: Request) {
  const cari = new URL(req.url).searchParams;
  const halaman = periksaHalaman(cari, 20, 100);
  if (typeof halaman === "string") return galat("DATA_TIDAK_VALID", halaman);
  const parameter = periksaParameterDaftar(cari, halaman);
  if (typeof parameter === "string") return galat("DATA_TIDAK_VALID", parameter);

  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, ...(await daftarLembaga(parameter)) });
  } catch (e) {
    return balasGalat(e, "GET /api/lembaga");
  }
}

export async function POST(req: Request) {
  const ditolak = await cekPembatas(req, ATURAN.admin);
  if (ditolak) return ditolak;

  const tanpaIzin = cekAdmin(req);
  if (tanpaIzin) return tanpaIzin;

  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const data = periksaDataLembaga(isi, true);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  try {
    const lembaga = await tambahLembaga(data);
    revalidatePath("/darurat");
    return NextResponse.json({ ok: true, data: lembaga }, { status: 201 });
  } catch (e) {
    return balasGalat(e, "POST /api/lembaga");
  }
}
