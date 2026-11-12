import { NextResponse } from "next/server";
import { galat, bacaJson } from "@/lib/api/galat";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { GalatPuan, periksaPermintaanChat, tanyaPuan } from "@/lib/puan/klien";

// POST /api/chat
// Alur: baca kiriman → validasi → cek pembatas → tanya Puan → balas.
// Cara memanggil Puan ada di lib/puan/klien.ts, format error di lib/api/galat.ts,
// pembatas permintaan di lib/api/pembatas.ts.

export async function POST(req: Request) {
  const isi = await bacaJson(req);
  if (!isi) return galat("FORMAT_TIDAK_DIKENALI", "Format pesan tidak dikenali.");

  const permintaan = periksaPermintaanChat(isi);
  if (typeof permintaan === "string") return galat("DATA_TIDAK_VALID", permintaan);

  const ditolak = await cekPembatas(req, ATURAN.chat);
  if (ditolak) return ditolak;

  try {
    const hasil = await tanyaPuan(permintaan.pesan, permintaan.riwayat);
    return NextResponse.json({ ok: true, ...hasil });
  } catch (e) {
    if (e instanceof GalatPuan) return galat(e.kode, e.message);
    console.error("Kesalahan tak terduga di /api/chat:", e);
    return galat("GANGGUAN_LAYANAN", "Maaf, ada gangguan. Coba lagi sebentar lagi ya.");
  }
}