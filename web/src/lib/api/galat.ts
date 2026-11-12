import { NextResponse } from "next/server";

// Format balasan ERROR yang sama untuk SEMUA endpoint EduPuan:
//   { ok: false, kode: "DATA_TIDAK_VALID", detail: "Pesan tidak boleh kosong." }
// - ok     : selalu false, supaya tampilan cukup memeriksa satu hal
// - kode   : penanda singkat untuk developer dan API Documentation
// - detail : pesan ramah berbahasa Indonesia yang ditampilkan ke pengguna

export type KodeGalat =
  | "FORMAT_TIDAK_DIKENALI" // 400: isi kiriman bukan JSON yang benar
  | "TIDAK_DIIZINKAN" //       401: tidak punya izin (misalnya halaman admin)
  | "TIDAK_DITEMUKAN" //       404: data yang dicari tidak ada
  | "DATA_SUDAH_ADA" //        409: data dengan nama yang sama sudah ada
  | "DATA_TIDAK_VALID" //      422: format benar, tapi isinya salah
  | "TERLALU_SERING" //        429: kena pembatas permintaan
  | "LAYANAN_BELUM_SIAP" //    500: pengaturan server belum lengkap
  | "GANGGUAN_LAYANAN" //      502: layanan di belakang (Puan/Supabase) membalas error
  | "LAYANAN_SIBUK" //         503: layanan di belakang tidak bisa dihubungi
  | "WAKTU_HABIS"; //          504: layanan di belakang terlalu lama menjawab

const STATUS: Record<KodeGalat, number> = {
  FORMAT_TIDAK_DIKENALI: 400,
  TIDAK_DIIZINKAN: 401,
  TIDAK_DITEMUKAN: 404,
  DATA_SUDAH_ADA: 409,
  DATA_TIDAK_VALID: 422,
  TERLALU_SERING: 429,
  LAYANAN_BELUM_SIAP: 500,
  GANGGUAN_LAYANAN: 502,
  LAYANAN_SIBUK: 503,
  WAKTU_HABIS: 504,
};

// Membuat balasan error. Contoh: return galat("DATA_TIDAK_VALID", "Pesan tidak boleh kosong.");
export function galat(kode: KodeGalat, detail: string, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, kode, detail }, { status: STATUS[kode], headers });
}

// Membaca isi kiriman JSON dengan aman.
// Mengembalikan null kalau isinya bukan objek JSON, supaya route bisa membalas 400.
export async function bacaJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const isi: unknown = await req.json();
    return isi !== null && typeof isi === "object" && !Array.isArray(isi)
      ? (isi as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}