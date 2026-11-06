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
  { youtubeId: "RjEDrg8KVVw", judul: "Jangan Keliru! Ini Bedanya Pinjol Legal dan Ilegal", kanal: "ISI NAMA KANAL", topik: "pinjaman" },
  { youtubeId: "7e4uNm69yZI", judul: "Jangan Asal Pinjam! Ini Daftar Pinjol Resmi dari OJK", kanal: "ISI NAMA KANAL", topik: "pinjaman" },
  { youtubeId: "bHG6kUItKfs", judul: "OJK Larang Warga Ikut Gerakan Gagal Bayar Pinjol, Ini Bahayanya", kanal: "ISI NAMA KANAL", topik: "penagihan" },
  { youtubeId: "6twBUEpqRws", judul: "Ribuan Pinjol Ilegal Diblokir OJK", kanal: "ISI NAMA KANAL", topik: "hak-hukum" },
];