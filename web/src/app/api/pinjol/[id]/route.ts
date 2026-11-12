import { NextResponse } from "next/server";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { cekAdmin } from "@/lib/api/admin";
import {
  GalatPinjol, ambilPinjol, hapusPinjol, periksaDataTulis, periksaId, ubahPinjol,
} from "@/lib/pinjol/layanan";

// GET    /api/pinjol/:id   → detail satu pinjol (publik)
// PATCH  /api/pinjol/:id   → ubah sebagian data (wajib header X-Admin-Key)
// DELETE /api/pinjol/:id   → hapus (wajib header X-Admin-Key)

type Konteks = { params: Promise<{ id: string }> };

function gagal(e: unknown, tempat: string) {
  if (e instanceof GalatPinjol) return galat(e.kode, e.message);
  console.error(`Kesalahan tak terduga di ${tempat}:`, e);
  return galat("GANGGUAN_LAYANAN", "Maaf, ada gangguan. Coba lagi sebentar lagi ya.");
}

const ID_SALAH = "ID pinjol harus angka bulat positif.";

export async function GET(req: Request, { params }: Konteks) {
  const id = periksaId((await params).id);
  if (!id) return galat("DATA_TIDAK_VALID", ID_SALAH);

  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, data: await ambilPinjol(id) });
  } catch (e) {
    return gagal(e, "GET /api/pinjol/:id");
  }
}

export async function PATCH(req: Request, { params }: Konteks) {
  const ditolak = await cekPembatas(req, ATURAN.admin);
  if (ditolak) return ditolak;

  const tanpaIzin = cekAdmin(req);
  if (tanpaIzin) return tanpaIzin;

  const id = periksaId((await params).id);
  if (!id) return galat("DATA_TIDAK_VALID", ID_SALAH);

  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format data tidak dikenali.");

  const data = periksaDataTulis(isi, false);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  try {
    return NextResponse.json({ ok: true, data: await ubahPinjol(id, data) });
  } catch (e) {
    return gagal(e, "PATCH /api/pinjol/:id");
  }
}

export async function DELETE(req: Request, { params }: Konteks) {
  const ditolak = await cekPembatas(req, ATURAN.admin);
  if (ditolak) return ditolak;

  const tanpaIzin = cekAdmin(req);
  if (tanpaIzin) return tanpaIzin;

  const id = periksaId((await params).id);
  if (!id) return galat("DATA_TIDAK_VALID", ID_SALAH);

  try {
    await hapusPinjol(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return gagal(e, "DELETE /api/pinjol/:id");
  }
}