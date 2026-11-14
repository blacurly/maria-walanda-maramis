import { createHash } from "node:crypto";
import { galat } from "./galat";

// Pembatas permintaan (rate limit) untuk semua endpoint EduPuan.
// Penghitungnya disimpan di tabel Supabase "pembatas_permintaan" (lihat web/supabase/03_pembatas_permintaan.sql),
// karena memori server Vercel tidak bisa diandalkan (bisa berjalan di banyak tempat dan sering di-restart).

type Aturan = { nama: string; batas: number; jendelaDetik: number };

// Aturan per endpoint. Ubah angkanya di sini kalau perlu.
export const ATURAN = {
  chat: { nama: "chat", batas: 20, jendelaDetik: 600 }, //             20 pesan per 10 menit
  umpanBalik: { nama: "umpan-balik", batas: 30, jendelaDetik: 600 }, // 30 penilaian per 10 menit
  baca: { nama: "baca", batas: 120, jendelaDetik: 600 }, //             120 permintaan baca data per 10 menit
  admin: { nama: "admin", batas: 60, jendelaDetik: 600 }, //            60 permintaan tulis per 10 menit
} satisfies Record<string, Aturan>;

const BATAS_WAKTU_MS = 3_000;

// Alamat IP pengunjung (Vercel mengisinya di header x-forwarded-for).
function ipPengunjung(req: Request): string {
  const diteruskan = req.headers.get("x-forwarded-for");
  return diteruskan?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "tanpa-ip";
}

// Sidik acak (hash) dari IP + nama endpoint. Dicampur kunci rahasia server,
// sehingga alamat IP asli tidak bisa ditebak dari isi tabel (privasi pengguna).
function sidik(teks: string, rahasia: string): string {
  return createHash("sha256").update(`${rahasia}:${teks}`).digest("hex").slice(0, 32);
}

// Mengembalikan null kalau BOLEH lanjut, atau balasan 429 kalau sudah melewati batas.
// Cara pakai di route:
//   const ditolak = await cekPembatas(req, ATURAN.chat);
//   if (ditolak) return ditolak;
export async function cekPembatas(req: Request, aturan: Aturan): Promise<Response | null> {
  const alamat = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.SUPABASE_SECRET_KEY;
  if (!alamat || !kunci) {
    console.error("Pembatas tidak aktif: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SECRET_KEY belum diisi.");
    return null; // jangan sampai fitur mati hanya karena pengaturan pembatas belum lengkap
  }

  const headers: Record<string, string> = { "Content-Type": "application/json", apikey: kunci };
  if (kunci.startsWith("eyJ")) headers.Authorization = `Bearer ${kunci}`; // format kunci lama Supabase

  try {
    const r = await fetch(`${alamat}/rest/v1/rpc/catat_permintaan`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_kunci: sidik(`${aturan.nama}:${ipPengunjung(req)}`, kunci),
        p_jendela_detik: aturan.jendelaDetik,
        p_batas: aturan.batas,
      }),
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
      cache: "no-store",
    });
    if (!r.ok) {
      console.error("Pembatas gagal dicek:", r.status);
      return null;
    }

    const [hasil] = (await r.json()) as { boleh: boolean; sisa: number; coba_lagi_detik: number }[];
    if (hasil?.boleh === false) {
      const menit = Math.max(1, Math.ceil(hasil.coba_lagi_detik / 60));
      return galat(
        "TERLALU_SERING",
        `Kamu sudah mengirim terlalu banyak dalam waktu singkat. Coba lagi sekitar ${menit} menit lagi ya.`,
        { "Retry-After": String(Math.max(1, hasil.coba_lagi_detik)) },
      );
    }
    return null;
  } catch (e) {
    console.error("Pembatas tidak bisa dihubungi:", e);
    return null;
  }
}