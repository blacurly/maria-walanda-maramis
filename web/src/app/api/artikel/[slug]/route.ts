import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { cekAdmin } from "@/lib/api/admin";
import { balasGalat } from "@/lib/api/layanan";
import { ambilArtikelApi, hapusArtikel, periksaDataArtikel, periksaSlug, ubahArtikel } from "@/lib/artikel/layanan";

// GET    /api/artikel/:slug   → satu artikel lengkap (publik, hanya yang terbit)
// PATCH  /api/artikel/:slug   → ubah sebagian (wajib header X-Admin-Key)
// DELETE /api/artikel/:slug   → hapus beserta rujukannya (wajib header X-Admin-Key)

type Konteks = { params: Promise<{ slug: string }> };

const SLUG_SALAH = "Slug artikel tidak valid.";

function segarkan(slug: string) {
  revalidatePath("/");
  revalidatePath("/edukasi");
  revalidatePath(`/edukasi/${slug}`);
}

export async function GET(req: Request, { params }: Konteks) {
  const { slug } = await params;
  if (!periksaSlug(slug)) return galat("DATA_TIDAK_VALID", SLUG_SALAH);

  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, data: await ambilArtikelApi(slug) });
  } catch (e) {
    return balasGalat(e, "GET /api/artikel/:slug");
  }
}

export async function PATCH(req: Request, { params }: Konteks) {
  const ditolak = await cekPembatas(req, ATURAN.admin);
  if (ditolak) return ditolak;

  const tanpaIzin = cekAdmin(req);
  if (tanpaIzin) return tanpaIzin;

  const { slug } = await params;
  if (!periksaSlug(slug)) return galat("DATA_TIDAK_VALID", SLUG_SALAH);

  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const data = periksaDataArtikel(isi, false);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  try {
    const artikel = await ubahArtikel(slug, data);
    segarkan(slug);
    return NextResponse.json({ ok: true, data: artikel });
  } catch (e) {
    return balasGalat(e, "PATCH /api/artikel/:slug");
  }
}

export async function DELETE(req: Request, { params }: Konteks) {
  const ditolak = await cekPembatas(req, ATURAN.admin);
  if (ditolak) return ditolak;

  const tanpaIzin = cekAdmin(req);
  if (tanpaIzin) return tanpaIzin;

  const { slug } = await params;
  if (!periksaSlug(slug)) return galat("DATA_TIDAK_VALID", SLUG_SALAH);

  try {
    await hapusArtikel(slug);
    segarkan(slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return balasGalat(e, "DELETE /api/artikel/:slug");
  }
}
