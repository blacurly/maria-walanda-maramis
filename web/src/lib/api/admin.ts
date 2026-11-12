import { createHash, timingSafeEqual } from "node:crypto";
import { galat } from "./galat";

// Pengaman endpoint TULIS (tambah, ubah, hapus) tanpa fitur login.
// Permintaan wajib membawa header:  X-Admin-Key: <isi ADMIN_API_KEY>
// Pengunjung biasa tidak punya kunci ini, jadi hanya bisa MEMBACA.
//
// Cara pakai di route:
//   const tolak = cekAdmin(req);
//   if (tolak) return tolak;

// Membandingkan dua teks dengan waktu yang selalu sama (mencegah penebakan kunci lewat lama respons).
function sama(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// Mengembalikan null kalau BOLEH lanjut, atau balasan error kalau ditolak.
export function cekAdmin(req: Request): Response | null {
  const kunciServer = process.env.ADMIN_API_KEY;
  if (!kunciServer) {
    console.error("ADMIN_API_KEY belum diisi: semua permintaan tulis ditolak.");
    return galat("LAYANAN_BELUM_SIAP", "Fitur pengelolaan data belum diaktifkan di server.");
  }

  const kunciKiriman = req.headers.get("x-admin-key") ?? "";
  if (!kunciKiriman || !sama(kunciKiriman, kunciServer)) {
    return galat("TIDAK_DIIZINKAN", "Kamu tidak punya izin untuk mengubah data ini.");
  }
  return null;
}