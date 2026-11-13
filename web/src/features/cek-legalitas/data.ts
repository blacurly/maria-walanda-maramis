// Teks dan kontak untuk fitur Cek Legalitas
import type { Tone } from "@/lib/tone";

export const LINK_OJK_BERIZIN =
  "https://www.ojk.go.id/id/kanal/iknb/financial-technology/Pages/Penyelenggara-Fintech-Lending-Berizin-dan-Terdaftar-di-OJK.aspx";

export const CONTOH_NAMA = ["AdaKami", "Indodana", "Uang Cepat"];

export const KONTAK_OJK: { label: string; nilai: string; ket: string; href: string; tabBaru: boolean; tone: Tone }[] = [
  { label: "WhatsApp Kontak OJK", nilai: "081 157 157 157", ket: "Kirim nama aplikasi untuk cek legalitas.", href: "https://wa.me/6281157157157", tabBaru: true, tone: "emerald" },
  { label: "Telepon Kontak OJK", nilai: "157", ket: "Konsultasi dan pengaduan konsumen.", href: "tel:157", tabBaru: false, tone: "sky" },
  { label: "Email", nilai: "konsumen@ojk.go.id", ket: "Sertakan kronologi dan bukti.", href: "mailto:konsumen@ojk.go.id", tabBaru: false, tone: "amber" },
  { label: "Lapor pinjol ilegal", nilai: "sipasti.ojk.go.id", ket: "Portal pengaduan Satgas PASTI.", href: "https://sipasti.ojk.go.id", tabBaru: true, tone: "rose" },
  { label: "Jadi korban penipuan transaksi?", nilai: "iasc.ojk.go.id", ket: "Indonesia Anti-Scam Centre.", href: "https://iasc.ojk.go.id", tabBaru: true, tone: "violet" },
];

export const CIRI_BERIZIN = [
  "Terdaftar dan diawasi OJK, sehingga nama perusahaan dan alamatnya jelas.",
  "Batas maksimal bunga dan biaya ditetapkan OJK, dan biayanya disampaikan sebelum kamu setuju.",
  "Hanya boleh mengakses kamera, mikrofon, dan lokasi di HP-mu, bukan kontak atau galeri.",
  "Penagih wajib beretika: tidak boleh mengancam, mempermalukan, atau menghubungi kontakmu.",
  "Punya layanan pengaduan resmi, dan kamu bisa melapor ke OJK jika dirugikan.",
];

export const RISIKO_ILEGAL = [
  "Bunga, denda, dan potongan tidak jelas, sehingga utang bisa membengkak berkali lipat.",
  "Meminta akses kontak, galeri, dan data pribadi di HP-mu.",
  "Penagihan dengan teror dan ancaman, bahkan menyebar data dan foto ke kontakmu.",
  "Dana yang cair sering dipotong besar dan tenornya sangat pendek.",
  "Tidak diawasi siapa pun, jadi kamu tidak punya perlindungan saat dirugikan.",
];

export const LANGKAH_ILEGAL = [
  "Jangan unduh atau ajukan pinjaman lewat aplikasi ini.",
  "Jangan berikan data pribadi, foto KTP, kode OTP, atau kata sandi.",
  "Kalau sudah terpasang, cabut izin akses kontak dan galeri, lalu hapus aplikasinya.",
  "Simpan bukti (tangkapan layar chat, nomor penagih) dan laporkan ke sipasti.ojk.go.id atau Kontak OJK 157.",
];

export const LANGKAH_TIDAK_DITEMUKAN = [
  "Cek langsung di daftar resmi OJK. Ini cara paling akurat.",
  "Hubungi WhatsApp OJK 081 157 157 157 untuk konfirmasi.",
  "Waspada jika aplikasinya minta akses kontak/galeri, diunduh dari link, atau menawarkan lewat SMS/WA tanpa diminta.",
  "Kalau tetap ragu, lebih baik tidak melanjutkan.",
];