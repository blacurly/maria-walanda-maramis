// Peta semua halaman EduPuan.
// judul = nama di jejak halaman, induk = tujuan tombol "Kembali".
// Kalau membuat halaman baru, cukup tambahkan satu baris di sini.

type InfoHalaman = {
  judul: string;
  induk: string | null;
};

export const PETA_HALAMAN: Record<string, InfoHalaman> = {
  "/": { judul: "Beranda", induk: null },

  // Menu Navbar & Footer
  "/edukasi": { judul: "Edukasi", induk: "/" },
  "/tentang": { judul: "Tentang", induk: "/" },
  "/darurat": { judul: "Bantuan Darurat", induk: "/" },
  "/kebijakan-privasi": { judul: "Kebijakan Privasi", induk: "/" },
  "/syarat-ketentuan": { judul: "Syarat & Ketentuan", induk: "/" },

  // Pilih Kondisimu
  "/mau-pinjam": { judul: "Mau Pinjam", induk: "/" },
  "/sudah-terjerat": { judul: "Sudah Terjerat", induk: "/" },
  "/bingung-mulai": { judul: "Bingung Mulai dari Mana", induk: "/" },

  // Fitur di dalam Mau Pinjam
  "/mau-pinjam/cek-penawaran": { judul: "Cek Penawaran", induk: "/mau-pinjam" },
  "/mau-pinjam/cek-legalitas": { judul: "Cek Legalitas Pinjol", induk: "/mau-pinjam" },
  "/mau-pinjam/cari-alternatif": { judul: "Cek Alternatif Lain", induk: "/mau-pinjam" },

  // Fitur di dalam Sudah Terjerat
  "/sudah-terjerat/analisis-pesan": { judul: "Analisis Pesan Penagih", induk: "/sudah-terjerat" },
  "/sudah-terjerat/hak-saat-ditagih": { judul: "Hak Saat Ditagih", induk: "/sudah-terjerat" },
  "/sudah-terjerat/rangkum-utang": { judul: "Rangkum Semua Utang", induk: "/sudah-terjerat" },
  "/sudah-terjerat/beritahu-keluarga": { judul: "Beritahu Keluarga", induk: "/sudah-terjerat" },
  "/sudah-terjerat/dokumentasi-lapor": { judul: "Dokumentasi & Lapor", induk: "/sudah-terjerat" },
};

// Menghasilkan jalur dari Beranda sampai halaman ini.
// Contoh: jalurHalaman("/mau-pinjam/cek-penawaran")
// hasilnya ["/", "/mau-pinjam", "/mau-pinjam/cek-penawaran"]
export function jalurHalaman(alamat: string): string[] {
  const jalur: string[] = [];
  let sekarang: string | null = alamat;
  while (sekarang && PETA_HALAMAN[sekarang]) {
    jalur.unshift(sekarang);
    sekarang = PETA_HALAMAN[sekarang].induk;
  }
  return jalur;
}