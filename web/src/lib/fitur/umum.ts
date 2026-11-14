// Alat bersama untuk endpoint fitur kalkulator (Cek Penawaran, Ceritakan Situasimu, Cari Alternatif).
// Logika setiap fitur tetap di src/features/* (satu sumber, dipakai halaman dan server);
// folder lib/fitur/ hanya berisi validasi input dan penyusunan balasan API.

// Pembatas permintaan khusus kalkulator: 120 permintaan per 10 menit per pengunjung.
// Ditulis di sini (bukan di lib/api/pembatas.ts) supaya tidak bentrok dengan PR lain yang mengubah file itu.
export const ATURAN_HITUNG = { nama: "hitung", batas: 120, jendelaDetik: 600 };

// Angka rupiah wajar: bilangan bulat 0 sampai Rp10 miliar.
const RUPIAH_MAKS = 10_000_000_000;

/** Membaca angka rupiah. Kosong/tidak dikirim = 0. Mengembalikan null kalau isinya tidak sah. */
export function bacaRupiah(nilai: unknown): number | null {
  if (nilai === undefined || nilai === null || nilai === "") return 0;
  const angka = typeof nilai === "number" ? nilai : typeof nilai === "string" ? Number(nilai.replace(/\./g, "")) : NaN;
  if (!Number.isFinite(angka) || angka < 0 || angka > RUPIAH_MAKS) return null;
  return Math.round(angka);
}

/** Membaca bilangan bulat dalam rentang [min, maks]. Kosong = 0. */
export function bacaBulat(nilai: unknown, min: number, maks: number): number | null {
  if (nilai === undefined || nilai === null || nilai === "") return 0;
  const angka = typeof nilai === "number" ? nilai : typeof nilai === "string" ? Number(nilai) : NaN;
  if (!Number.isInteger(angka) || angka < min || angka > maks) return null;
  return angka;
}

/** Membaca salah satu pilihan yang diizinkan. Kosong = pilihan bawaan. */
export function bacaPilihan<T extends string>(nilai: unknown, pilihan: readonly T[], bawaan: T): T | null {
  if (nilai === undefined || nilai === null || nilai === "") return bawaan;
  return typeof nilai === "string" && (pilihan as readonly string[]).includes(nilai) ? (nilai as T) : null;
}
