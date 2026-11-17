"use client";

// Mengambil daftar nama pinjol dari API (GET /api/pinjol/nama) untuk dipakai di browser.
// Sekali ambil per kunjungan (disimpan di memori), dipakai bersama oleh semua fitur.
// Sebelumnya ketiga fitur mengimpor data/dataPinjol.ts langsung, sehingga perubahan di database lewat API CRUD
// tidak ikut terpakai dan 500+ data ikut terunduh di setiap halaman fitur.
import { useEffect, useState } from "react";

export type DaftarNama = { legal: { nama: string; pt: string }[]; ilegal: string[]; per: string };

export const DAFTAR_KOSONG: DaftarNama = { legal: [], ilegal: [], per: "" };

let janji: Promise<DaftarNama | null> | null = null;

/** Mengambil daftar (sekali saja). Mengembalikan null kalau gagal; percobaan berikutnya akan mengambil ulang. */
export function muatDaftarNama(): Promise<DaftarNama | null> {
  if (!janji) {
    janji = fetch("/api/pinjol/nama")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => ({ legal: j.legal ?? [], ilegal: j.ilegal ?? [], per: j.per ?? "" }))
      .catch(() => {
        janji = null;
        return null;
      });
  }
  return janji;
}

/** Hook React: { data, siap, gagal }. Selama memuat, data berisi daftar kosong. */
export function useDaftarNama(): { data: DaftarNama; siap: boolean; gagal: boolean } {
  const [keadaan, setKeadaan] = useState<{ data: DaftarNama; siap: boolean; gagal: boolean }>({
    data: DAFTAR_KOSONG,
    siap: false,
    gagal: false,
  });
  useEffect(() => {
    let aktif = true;
    muatDaftarNama().then((d) => {
      if (aktif) setKeadaan(d ? { data: d, siap: true, gagal: false } : { data: DAFTAR_KOSONG, siap: true, gagal: true });
    });
    return () => {
      aktif = false;
    };
  }, []);
  return keadaan;
}
