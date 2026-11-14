import type { KodeGalat } from "@/lib/api/galat";
import { jawab, type Pesan } from "./chatbot";
import { GeminiBelumSiap, GeminiSibuk, GeminiWaktuHabis } from "./gemini";
import { catatUmpanBalik, STATUS_SAH } from "./statistik";

// Pintu masuk Puan AI untuk route /api/chat dan /api/umpan-balik: validasi input + menerjemahkan error.
// Sejak 13 Nov 2026 Puan berjalan LANGSUNG di Next.js (chatbot.ts), tidak lagi memanggil server FastAPI.
// Route tidak perlu diubah: bentuk masukan dan balasannya tetap sama.

export type { Pesan };
export type HasilChat = { jawaban: string; status?: string; krisis: boolean; topik?: string; situasi?: string };
export type DataUmpanBalik = { nilai: 1 | -1; topik: string; situasi: string; status: string };

export const BATAS_PESAN = 2000; //    huruf per pesan
const BATAS_RIWAYAT = 20; //           pesan sebelumnya yang ikut dikirim
const BATAS_TEKS_RIWAYAT = 4000; //    huruf per pesan di riwayat
const POLA_LABEL = /^[a-z_]{1,40}$/;

// Error dari proses Puan, lengkap dengan kode resmi dari lib/api/galat.ts.
export class GalatPuan extends Error {
  kode: KodeGalat;
  constructor(kode: KodeGalat, pesan: string) {
    super(pesan);
    this.name = "GalatPuan";
    this.kode = kode;
  }
}

// ---------- Validasi input ----------

// Label anonim (mis. "penagihan"). Hanya huruf kecil dan garis bawah yang diterima.
export function labelAman(nilai: unknown): string | undefined {
  return typeof nilai === "string" && POLA_LABEL.test(nilai) ? nilai : undefined;
}

function bersihkanRiwayat(riwayat: unknown): Pesan[] {
  if (!Array.isArray(riwayat)) return [];
  return riwayat
    .filter(
      (m): m is Pesan =>
        typeof m === "object" &&
        m !== null &&
        (m.peran === "user" || m.peran === "puan") &&
        typeof m.teks === "string" &&
        m.teks.trim() !== "",
    )
    .slice(-BATAS_RIWAYAT)
    .map((m) => ({ peran: m.peran, teks: m.teks.slice(0, BATAS_TEKS_RIWAYAT) }));
}

// Mengembalikan data yang sudah bersih, atau TEKS PESAN ERROR kalau tidak valid.
export function periksaPermintaanChat(isi: Record<string, unknown>): { pesan: string; riwayat: Pesan[] } | string {
  const pesan = typeof isi.pesan === "string" ? isi.pesan.trim() : "";
  if (!pesan) return "Pesan tidak boleh kosong.";
  if (pesan.length > BATAS_PESAN) {
    return `Pesanmu terlalu panjang. Coba ringkas jadi maksimal ${BATAS_PESAN} huruf ya.`;
  }
  return { pesan, riwayat: bersihkanRiwayat(isi.riwayat) };
}

// ANONIM: hanya nilai (1 / -1) + label. Tidak ada isi pertanyaan atau jawaban.
export function periksaUmpanBalik(isi: Record<string, unknown>): DataUmpanBalik | null {
  const { nilai, topik, situasi, status } = isi;
  const sah =
    (nilai === 1 || nilai === -1) &&
    labelAman(topik) !== undefined &&
    labelAman(situasi) !== undefined &&
    typeof status === "string" &&
    (STATUS_SAH as readonly string[]).includes(status);
  return sah ? { nilai, topik: topik as string, situasi: situasi as string, status: status as string } : null;
}

// ---------- Memanggil Puan ----------

export async function tanyaPuan(pesan: string, riwayat: Pesan[]): Promise<HasilChat> {
  let hasil;
  try {
    hasil = await jawab(pesan, riwayat);
  } catch (e) {
    if (e instanceof GeminiSibuk) {
      throw new GalatPuan("LAYANAN_SIBUK", "Puan AI sedang sibuk melayani banyak orang. Coba kirim lagi sebentar lagi ya.");
    }
    if (e instanceof GeminiBelumSiap) {
      console.error("Puan AI belum siap:", e.message);
      throw new GalatPuan("LAYANAN_BELUM_SIAP", "Puan AI belum siap. Coba lagi nanti ya.");
    }
    if (e instanceof GeminiWaktuHabis || (e instanceof Error && e.name === "TimeoutError")) {
      throw new GalatPuan("WAKTU_HABIS", "Puan butuh waktu terlalu lama untuk menjawab. Coba kirim lagi ya.");
    }
    console.error("Gagal menyiapkan jawaban Puan:", e);
    throw new GalatPuan("GANGGUAN_LAYANAN", "Maaf, ada gangguan saat menyiapkan jawaban. Coba lagi sebentar lagi ya.");
  }
  if (!hasil.jawaban) {
    // hasil kosong: jangan tampilkan gelembung kosong ke pengguna
    throw new GalatPuan("GANGGUAN_LAYANAN", "Puan belum bisa menjawab pertanyaan ini. Coba tulis dengan kata lain ya.");
  }
  // Yang dikirim ke browser sama seperti sebelumnya. kueri & skor hanya untuk evaluasi, tidak dikirim.
  return {
    jawaban: hasil.jawaban,
    status: hasil.status,
    krisis: hasil.krisis,
    topik: labelAman(hasil.topik),
    situasi: labelAman(hasil.situasi),
  };
}

export async function kirimUmpanBalik(data: DataUmpanBalik): Promise<boolean> {
  return catatUmpanBalik(data.nilai, data.topik, data.situasi, data.status);
}
