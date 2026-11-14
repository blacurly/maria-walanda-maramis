"use server";

// SERVER ACTION Puan AI: fungsi yang berjalan di SERVER, tetapi dipanggil langsung dari komponen browser
// seperti fungsi biasa, tanpa menulis fetch ke URL API. Next.js yang mengurus pengirimannya.
//
// Dipakai oleh tombol "Apakah jawaban ini membantu?" (👍/👎) di components/fitur/puan-chat/PuanFab.tsx.
// Isinya sama dengan route POST /api/umpan-balik (validasi → pembatas → simpan), memakai fungsi yang sama,
// sehingga aturannya tidak dobel. Route tetap ada untuk klien lain di luar web (lihat docs/api.md).
//
// ANONIM: hanya nilai (1 / -1) + label topik/situasi/status. Tidak ada isi pertanyaan atau jawaban.
import { headers } from "next/headers";
import { ATURAN, cekPembatas } from "@/lib/api/pembatas";
import { kirimUmpanBalik, periksaUmpanBalik } from "./klien";

export type HasilAksi = { ok: true } | { ok: false; pesan: string };

export async function nilaiJawabanPuan(data: unknown): Promise<HasilAksi> {
  // 1. Validasi: data dari browser tidak boleh langsung dipercaya.
  const isi =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const umpanBalik = periksaUmpanBalik(isi);
  if (!umpanBalik) return { ok: false, pesan: "Data umpan balik tidak valid." };

  // 2. Pembatas permintaan: aturan yang sama dengan /api/umpan-balik (30 penilaian per 10 menit per pengunjung).
  //    cekPembatas membaca alamat IP dari header permintaan, jadi header aksi ini dibungkus menjadi Request.
  const ditolak = await cekPembatas(
    new Request("https://edupuan.local/aksi/umpan-balik", {
      headers: await headers(),
    }),
    ATURAN.umpanBalik,
  );
  if (ditolak)
    return {
      ok: false,
      pesan: "Terlalu banyak penilaian. Coba lagi nanti ya.",
    };

  // 3. Simpan (hanya aktif jika PUAN_CATAT_STATISTIK=1). Tidak pernah melempar error.
  const tersimpan = await kirimUmpanBalik(umpanBalik).catch(() => false);
  return tersimpan
    ? { ok: true }
    : { ok: false, pesan: "Umpan balik belum tersimpan. Coba lagi nanti ya." };
}
