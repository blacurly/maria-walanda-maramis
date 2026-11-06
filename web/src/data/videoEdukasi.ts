// Video YouTube untuk halaman Edukasi.
// Syarat: dari kanal resmi atau media terpercaya, isinya sudah ditonton dan dicek tim.
import type { Topik } from "./artikel";

export type VideoEdukasi = {
  youtubeId: string; // bagian setelah "v=" di link YouTube
  judul: string;
  kanal: string;
  topik: Topik;
};

export const VIDEO_EDUKASI: VideoEdukasi[] = [
  { youtubeId: "KuqRs4fsROM", judul: "Waspada! Ditransfer Uang dari Rekening Tak Dikenal, Bisa Jadi Modus Pinjol | Liputan 6 ", kanal: "Liputan6", topik: "penagihan" },
  { youtubeId: "7e4uNm69yZI", judul: "Jangan Asal Pinjam! Ini Daftar Pinjol Resmi dari OJK", kanal: "Kompas.com", topik: "pinjaman" },
  { youtubeId: "bHG6kUItKfs", judul: "OJK Larang Warga Ikut Gerakan Gagal Bayar Pinjol, Ini Bahayanya", kanal: "Kompas.com", topik: "penagihan" },
  { youtubeId: "6twBUEpqRws", judul: "Ribuan Pinjol Ilegal Diblokir OJK", kanal: "IDX Channel Insight", topik: "hak-hukum" },
];