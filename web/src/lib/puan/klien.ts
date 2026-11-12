import type { KodeGalat } from "@/lib/api/galat";

// Semua urusan memanggil Puan AI ada di sini (sekarang: server FastAPI).
// Saat Puan pindah ke model open source di Next.js, cukup isi file ini yang diganti.
// Route (/api/chat, /api/umpan-balik) tidak perlu diubah.

export type Pesan = { peran: "user" | "puan"; teks: string };
export type HasilChat = { jawaban: string; status?: string; krisis: boolean; topik?: string; situasi?: string };
export type DataUmpanBalik = { nilai: 1 | -1; topik: string; situasi: string; status: string };

export const BATAS_PESAN = 2000; //    huruf per pesan (sama dengan batas di FastAPI)
const BATAS_RIWAYAT = 20; //           pesan sebelumnya yang ikut dikirim
const BATAS_TEKS_RIWAYAT = 4000; //    huruf per pesan di riwayat
const WAKTU_CHAT_MS = 45_000; //       batas menunggu jawaban Puan
const WAKTU_UMPAN_BALIK_MS = 8_000;
const POLA_LABEL = /^[a-z_]{1,40}$/;
const STATUS_SAH = ["pasal", "butuh_dana", "di_luar_topik", "tidak_ada_pasal"];

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
    STATUS_SAH.includes(status);
  return sah ? { nilai, topik: topik as string, situasi: situasi as string, status: status as string } : null;
}

// ---------- Memanggil server Puan ----------

async function panggil(jalur: string, body: unknown, waktuMs: number): Promise<Record<string, unknown>> {
  const alamat = process.env.PUAN_API_URL;
  const kunci = process.env.PUAN_API_KEY;
  if (!alamat || !kunci) {
    console.error("PUAN_API_URL atau PUAN_API_KEY belum diisi.");
    throw new GalatPuan("LAYANAN_BELUM_SIAP", "Puan AI belum siap. Coba lagi nanti ya.");
  }

  let r: Response;
  try {
    r = await fetch(`${alamat}${jalur}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Puan-Key": kunci },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(waktuMs),
      cache: "no-store",
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new GalatPuan("WAKTU_HABIS", "Puan butuh waktu terlalu lama untuk menjawab. Coba kirim lagi ya.");
    }
    console.error("Gagal menghubungi Puan AI:", e);
    throw new GalatPuan("LAYANAN_SIBUK", "Puan AI belum bisa dihubungi. Coba lagi sebentar lagi ya.");
  }

  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (r.ok) return data;

  // Terjemahkan status dari server Puan ke kode resmi EduPuan (tidak diteruskan apa adanya).
  const detail = typeof data.detail === "string" ? data.detail : null;
  if (r.status === 401) {
    console.error("Kunci Puan AI ditolak (cek PUAN_API_KEY).");
    throw new GalatPuan("LAYANAN_BELUM_SIAP", "Puan AI belum siap. Coba lagi nanti ya.");
  }
  if (r.status === 400 || r.status === 422) {
    throw new GalatPuan("DATA_TIDAK_VALID", detail ?? "Pesanmu belum bisa diproses. Coba tulis ulang ya.");
  }
  if (r.status === 429 || r.status === 503) {
    throw new GalatPuan("LAYANAN_SIBUK", detail ?? "Puan sedang sibuk. Coba lagi sebentar lagi ya.");
  }
  console.error("Puan AI membalas error:", r.status);
  throw new GalatPuan("GANGGUAN_LAYANAN", "Maaf, ada gangguan. Coba lagi sebentar lagi ya.");
}

export async function tanyaPuan(pesan: string, riwayat: Pesan[]): Promise<HasilChat> {
  const data = await panggil("/chat", { pesan, riwayat }, WAKTU_CHAT_MS);
  const jawaban = typeof data.jawaban === "string" ? data.jawaban.trim() : "";
  if (!jawaban) {
    // hasil kosong: jangan tampilkan gelembung kosong ke pengguna
    throw new GalatPuan("GANGGUAN_LAYANAN", "Puan belum bisa menjawab pertanyaan ini. Coba tulis dengan kata lain ya.");
  }
  return {
    jawaban,
    status: labelAman(data.status),
    krisis: data.krisis === true,
    topik: labelAman(data.topik),
    situasi: labelAman(data.situasi),
  };
}

export async function kirimUmpanBalik(data: DataUmpanBalik): Promise<boolean> {
  const hasil = await panggil("/umpan-balik", data, WAKTU_UMPAN_BALIK_MS);
  return hasil.ok === true;
}