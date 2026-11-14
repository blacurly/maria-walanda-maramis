// Layanan API "Cek Penawaran": validasi input + memanggil rumus resmi di features/cek-penawaran/hitung.ts.
// Rumus TIDAK ditulis ulang di sini, supaya hasil API selalu sama dengan hasil di halaman.
import {
  DEFAULT_INPUT,
  hitung,
  langkahHitung,
  teksVonis,
  type InputPenawaran,
  type Jenis,
  type SatuanDenda,
  type SatuanTenor,
  type Tujuan,
} from "@/features/cek-penawaran/hitung";
import { bacaBulat, bacaPilihan, bacaRupiah } from "./umum";

const JENIS: readonly Jenis[] = ["konsumtif", "produktif"];
const TUJUAN: readonly Tujuan[] = ["harian", "pendidikan", "kesehatan", "utang", "usaha"];
const SATUAN_LAMA: readonly SatuanTenor[] = ["hari", "bulan"];
const SATUAN_DENDA: readonly SatuanDenda[] = ["pct", "rp"];

// Nama kolom di API (mudah dibaca) → nama di rumus. Semua angka dalam rupiah, kecuali yang disebut lain.
const KOLOM_RUPIAH = {
  jumlah_pinjaman: "p", //      nilai pendanaan di kontrak
  uang_diterima: "d", //        uang yang benar-benar masuk ke rekening
  total_kembali: "t", //        total yang harus dikembalikan (tanpa denda)
  cicilan_terbesar: "cmax", //  cicilan terbesar dalam sebulan (opsional)
  bunga: "bunga",
  biaya_admin: "admin",
  biaya_layanan: "fee",
  biaya_lain: "lain",
  meterai_pajak: "excl", //     TTE bersertifikat, meterai, pajak
  denda_ditagih: "dendaTagih",
  penghasilan: "inc", //        penghasilan bersih per bulan (opsional)
  pengeluaran_wajib: "wajib",
  cicilan_lain: "lainCicil",
} as const;

/** Mengubah isi kiriman JSON menjadi input rumus. Mengembalikan teks error kalau ada yang tidak sah. */
export function periksaInputPenawaran(isi: Record<string, unknown>): InputPenawaran | string {
  const s: InputPenawaran = { ...DEFAULT_INPUT };

  for (const [kolom, kunci] of Object.entries(KOLOM_RUPIAH)) {
    const nilai = bacaRupiah(isi[kolom]);
    if (nilai === null) return `"${kolom}" harus berupa angka rupiah 0 sampai 10.000.000.000.`;
    s[kunci] = nilai;
  }

  const satuan = bacaPilihan(isi.satuan_lama, SATUAN_LAMA, "bulan");
  if (!satuan) return `"satuan_lama" harus "hari" atau "bulan".`;
  s.unit = satuan;
  const lama = bacaBulat(isi.lama, 0, satuan === "hari" ? 3650 : 120);
  if (lama === null) return `"lama" harus bilangan bulat (maksimal ${satuan === "hari" ? "3650 hari" : "120 bulan"}).`;
  s.ten = lama;

  const jenis = bacaPilihan(isi.jenis, JENIS, "konsumtif");
  if (!jenis) return `"jenis" harus "konsumtif" atau "produktif".`;
  s.jenis = jenis;
  const tujuan = bacaPilihan(isi.tujuan, TUJUAN, jenis === "produktif" ? "usaha" : "harian");
  if (!tujuan) return `"tujuan" harus salah satu dari: ${TUJUAN.join(", ")}.`;
  s.tujuan = tujuan;

  const satuanDenda = bacaPilihan(isi.satuan_denda, SATUAN_DENDA, "pct");
  if (!satuanDenda) return `"satuan_denda" harus "pct" (persen per hari) atau "rp" (rupiah per hari).`;
  s.dUnit = satuanDenda;
  const denda = isi.denda === undefined || isi.denda === null ? "" : String(isi.denda);
  if (denda.length > 20 || !/^[0-9.,]*$/.test(denda)) return `"denda" harus angka, misalnya "0,1" (persen) atau "5.000" (rupiah).`;
  s.dendaStr = denda;

  const aplikasi = bacaBulat(isi.aplikasi_lain, 0, 3);
  if (aplikasi === null) return `"aplikasi_lain" harus 0 sampai 3 (3 berarti 3 atau lebih).`;
  s.apps = aplikasi;

  // Tanpa penghasilan, bagian kemampuan bayar (Langkah 5) dianggap dilewati, sama seperti di halaman.
  s.skip = s.inc === 0;
  return s;
}

/** Menghitung dan menyusun balasan API (tanpa data tampilan seperti warna). */
export function cekPenawaran(s: InputPenawaran) {
  const h = hitung(s);
  if (h.missing.length) return { lengkap: false as const, pesan: `Lengkapi dulu: ${h.missing.join(", ")}.` };
  if (h.errs.length) return { lengkap: false as const, pesan: h.errs.join(" ") };

  const v = teksVonis(h);
  return {
    lengkap: true as const,
    hasil: {
      lampu: h.lampu, // hijau | kuning | risiko | biaya
      vonis: { label: v.tag, judul: v.title, teks: v.text, langkah_berikutnya: v.ctas },
      jumlah_temuan: h.jumlah,
      temuan: { aturan_ojk: h.ojk, rekomendasi_edupuan: h.edu, kelengkapan_data: h.data },
      angka: {
        total_biaya: h.allCost,
        manfaat_ekonomi: h.ME,
        persen_per_hari: Number(h.mePct.toFixed(4)),
        batas_per_hari: h.batas,
        kategori: h.kategori,
        lama_hari: h.H,
      },
      cara_hitung: langkahHitung(s, h),
      catatan: "Perkiraan berdasarkan angka yang dimasukkan. Bukan nasihat keuangan atau hukum. Batas mengikuti SEOJK 19/SEOJK.06/2025.",
    },
  };
}
