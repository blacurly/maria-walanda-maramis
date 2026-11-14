import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { cekAdmin } from "@/lib/api/admin";
import { balasGalat } from "@/lib/api/layanan";
import { ambilLembaga, hapusLembaga, periksaDataLembaga, periksaId, ubahLembaga } from "@/lib/lembaga/layanan";

// GET    /api/lembaga/:id   → detail satu lembaga (publik, hanya yang aktif)
// PATCH  /api/lembaga/:id   → ubah sebagian, termasuk menonaktifkan & mengatur situasinya (wajib X-Admin-Key)
// DELETE /api/lembaga/:id   → hapus (wajib header X-Admin-Key)

type Konteks = { params: Promise<{ id: string }> };

const ID_SALAH = "ID lembaga harus angka bulat positif.";

export async function GET(req: Request, { params }: Konteks) {
  const id = periksaId((await params).id);
  if (!id) return galat("DATA_TIDAK_VALID", ID_SALAH);

  const ditolak = await cekPembatas(req, ATURAN.baca);
  if (ditolak) return ditolak;

  try {
    return NextResponse.json({ ok: true, data: await ambilLembaga(id) });
  } catch (e) {
    return balasGalat(e, "GET /api/lembaga/:id");
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

  const data = periksaDataLembaga(isi, false);
  if (typeof data === "string") return galat("DATA_TIDAK_VALID", data);

  try {
    const lembaga = await ubahLembaga(id, data);
    revalidatePath("/darurat");
    return NextResponse.json({ ok: true, data: lembaga });
  } catch (e) {
    return balasGalat(e, "PATCH /api/lembaga/:id");
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
    await hapusLembaga(id);
    revalidatePath("/darurat");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return balasGalat(e, "DELETE /api/lembaga/:id");
  }
}
