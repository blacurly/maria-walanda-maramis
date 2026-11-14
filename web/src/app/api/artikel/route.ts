import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { cekAdmin } from "@/lib/api/admin";
import { balasGalat, periksaHalaman } from "@/lib/api/layanan";
import { daftarArtikel, periksaDataArtikel, periksaParameterDaftar, tambahArtikel } from "@/lib/artikel/layanan";

// GET  /api/artikel?kategori=&q=&halaman=&per_halaman=   → daftar artikel terbit (publik)
// POST /api/artikel                                       → tambah artikel (wajib header X-Admin-Key)

export async function GET(req: Request) {
  const cari = new URL(req.url).searchParams;
  const halaman = periksaHalaman(cari, 10, 50);
  if (typeof halaman === "string") return galat("DATA_TIDAK_VALID", halaman);
  const parameter = periksaParameterDaftar(cari, halaman);
  if (typeof parameter === "string") return galat("DATA_TIDAK_VALID", parameter);

  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, ...(await daftarArtikel(parameter)) });
  } catch (e) {
    return balasGalat(e, "GET /api/artikel");
  }
}

export async function POST(req: Request) {
  const ditolak = await cekPembatas(req, ATURAN.admin);
  if (ditolak) return ditolak;

  const tanpaIzin = cekAdmin(req);
  if (tanpaIzin) return tanpaIzin;

  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const data = periksaDataArtikel(isi, true);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  try {
    const artikel = await tambahArtikel(data);
    // Perbarui halaman yang menampilkan artikel
    revalidatePath("/");
    revalidatePath("/edukasi");
    return NextResponse.json({ ok: true, data: artikel }, { status: 201 });
  } catch (e) {
    return balasGalat(e, "POST /api/artikel");
  }
}
