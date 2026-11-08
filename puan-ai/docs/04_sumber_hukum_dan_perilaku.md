# 04 — Sumber Hukum & Perilaku Puan AI

Dokumen ini menjawab dua pertanyaan: **Puan AI belajar dari mana?** dan **Puan AI diatur untuk bersikap bagaimana?**
Tabel pasal, tautan, dan kamus di bawah dihasilkan langsung dari `puan_rag/kurasi.py` dan `data/kamus_istilah.json`.
Kalau salah satunya diubah, perbarui juga dokumen ini.

---

## 1. Empat sumber dokumen

| No | Dokumen | Judul lengkap | Isi singkat | Kode | Parent | Child dicari |
|---|---|---|---|---|---|---|
| 1 | **POJK No. 22 Tahun 2023** | Pelindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan | Aturan umum OJK tentang hak konsumen jasa keuangan: informasi produk yang jujur, perjanjian & klausul baku, etika penagihan, kerahasiaan data, cara mengadu dan menyelesaikan sengketa. | `POJK22` | 80 pasal | 305 |
| 2 | **POJK No. 40 Tahun 2024** | Layanan Pendanaan Bersama Berbasis Teknologi Informasi (LPBBTI) | Aturan khusus pinjol legal: kewajiban & larangan perusahaan pinjol, batas bunga dan biaya, isi perjanjian, pencabutan izin, pelindungan data peminjam. | `POJK40` | 23 pasal | 131 |
| 3 | **UU No. 27 Tahun 2022** | Pelindungan Data Pribadi (UU PDP) | Melindungi data pribadi setiap orang: hak pemilik data, kewajiban pengelola data, kewajiban memberi tahu bila data bocor, sanksi administratif & pidana. | `UUPDP` | 48 pasal | 107 |
| 4 | **SEOJK No. 19/SEOJK.06/2025** | Penyelenggaraan Layanan Pendanaan Bersama Berbasis Teknologi Informasi | Petunjuk teknis POJK 40/2024: angka batas bunga & denda harian, batas maksimum pinjaman, akses aplikasi ke HP (hanya kamera, lokasi, mikrofon), aturan kontak darurat dan penagihan. | `SEOJK19` | 97 angka | 151 |
| | **Total** | | | | **248** | **694** |

Keempatnya berlapis. **POJK 22** berlaku untuk semua lembaga jasa keuangan (bank, asuransi, pinjol). **POJK 40** khusus pinjol.
**SEOJK 19** merinci angka dan teknis dari POJK 40. **UU PDP** berada di luar sektor keuangan dan mengatur data pribadi siapa pun.

Angka child di atas untuk versi biasa. Dengan opsi pecah huruf, totalnya 833 child dicari.

---

## 2. Bagian yang diambil

Keputusan diambil dari `data/referensi/daftar_pasal_puan_ai.xlsx` (78 baris ditinjau: 46 diambil, 32 dibuang).

| Dokumen | Pasal yang diambil | Pasal sanksi yang tetap dicari |
|---|---|---|
| POJK 22/2023 | 1–10, 19–24, 29–40, 44–84, 92–100, 113–114 | 113–114 |
| POJK 40/2024 | 1, 56, 83–84, 96, 137–150, 158, 164–165, 179 | – |
| UU 27/2022 | 1–16, 20–26, 30, 32, 35–46, 57–60, 64–70 | 57, 67–70 (sanksi administratif & ketentuan pidana) |

**SEOJK 19/2025**: bagian romawi yang diambil

| Bagian | Jumlah parent (angka) |
|---|---|
| I. KETENTUAN UMUM | 1 |
| IV. PENGGUNAAN TENAGA KERJA ALIH DAYA | 11 |
| VI. INFORMASI DAN PERINGATAN PADA SISTEM ELEKTRONIK PENYELENGGARA | 7 |
| VII. PENGELOLAAN DATA DAN INFORMASI | 12 |
| VIII. KONFIRMASI PENGGUNAAN KONTAK DARURAT | 4 |
| IX. PEMBERI DANA DAN PENERIMA DANA | 7 |
| X. BATAS MAKSIMUM PENDANAAN KEPADA PENERIMA DANA | 4 |
| XI. MEKANISME PENYALURAN DAN PELUNASAN PENDANAAN | 8 |
| XIV. BATAS MAKSIMUM MANFAAT EKONOMI | 7 |
| XV. FASILITAS MITIGASI RISIKO BAGI PENGGUNA | 15 |
| XVII. PUBLIKASI KINERJA PENDANAAN | 9 |
| XIX. PERJANJIAN | 2 |
| XX. KETENTUAN LAIN-LAIN | 10 |

Teks UU PDP yang dipakai adalah **transkripsi koreksi manual** dari gambar scan (`data/bersih/uu_27_2022_pdp_*_koreksi.txt`,
daftar koreksinya di `data/referensi/koreksi_uu_pdp.xlsx`).

### Cara membaca kode ID

| Contoh | Artinya |
|---|---|
| `POJK22:62` | parent: POJK 22/2023 Pasal 62 |
| `POJK22:62.2` | child: Pasal 62 ayat (2) |
| `POJK22:62.2.d` | child versi pecah huruf: Pasal 62 ayat (2) huruf d |
| `POJK22:1.def5` | child: Pasal 1 angka 5 (definisi) |
| `SEOJK19:VIII.1` | parent: SEOJK 19/2025 bagian VIII angka 1 |
| `SEOJK19:XIV.3.b` | child: SEOJK bagian XIV angka 3 huruf b |
| `SEOJK19:XIV.3.simulasi` | child: contoh perhitungan di SEOJK XIV angka 3 |

---

## 3. Tautan antar-dokumen (24 pasang)

Kalau pasal di kolom kiri terambil, pasal di kolom kanan ikut menjadi kandidat tambahan (dan sebaliknya). Daftar ini ditulis manual dan
**perlu ditinjau orang hukum**.

| # | Pasal A | Pasal B | Alasan |
|---|---|---|---|
| 1 | SEOJK 19/2025 angka romawi XIV angka 3 | POJK 40/2024 Pasal 140 | Angka batas maksimum manfaat ekonomi (bunga/biaya) per hari |
| 2 | SEOJK 19/2025 angka romawi XIV angka 4 | POJK 40/2024 Pasal 140 | Batas maksimum denda keterlambatan |
| 3 | SEOJK 19/2025 angka romawi XIV angka 5 | POJK 40/2024 Pasal 140 | Total manfaat ekonomi + denda maksimal 100% nilai pinjaman |
| 4 | SEOJK 19/2025 angka romawi X angka 1 | POJK 40/2024 Pasal 137 | Batas maksimum pendanaan per peminjam |
| 5 | SEOJK 19/2025 angka romawi VI angka 1 | POJK 40/2024 Pasal 142 | Informasi wajib di aplikasi pinjol |
| 6 | SEOJK 19/2025 angka romawi VI angka 2 | POJK 40/2024 Pasal 142 | Peringatan risiko wajib di aplikasi |
| 7 | SEOJK 19/2025 angka romawi VII angka 1 | POJK 40/2024 Pasal 164 | Aplikasi hanya boleh akses kamera, lokasi, mikrofon |
| 8 | SEOJK 19/2025 angka romawi VII angka 2 | POJK 40/2024 Pasal 164 | Larangan menyebarkan data pribadi pengguna |
| 9 | SEOJK 19/2025 angka romawi VII angka 2 | UU 27/2022 Pasal 65 | Larangan mengungkapkan data pribadi orang lain |
| 10 | SEOJK 19/2025 angka romawi VII angka 10 | POJK 40/2024 Pasal 165 | Penghapusan data pribadi |
| 11 | SEOJK 19/2025 angka romawi IV angka 1 | POJK 40/2024 Pasal 56 | Alih daya pekerjaan ke pihak ketiga |
| 12 | SEOJK 19/2025 angka romawi IV angka 11 | POJK 40/2024 Pasal 56 | Penyelenggara tetap bertanggung jawab atas pihak ketiga |
| 13 | SEOJK 19/2025 angka romawi XV angka 1 | POJK 40/2024 Pasal 148 | Mitigasi risiko termasuk penagihan |
| 14 | SEOJK 19/2025 angka romawi XIX angka 1 | POJK 40/2024 Pasal 145 | Perjanjian pendanaan yang seimbang dan adil |
| 15 | SEOJK 19/2025 angka romawi VIII angka 1 | POJK 22/2023 Pasal 62 | Kontak darurat bukan untuk ditagih; penagihan tidak kepada pihak lain |
| 16 | SEOJK 19/2025 angka romawi XX angka 8 | POJK 40/2024 Pasal 56 | Penagihan boleh lewat pihak lain (alih daya) |
| 17 | SEOJK 19/2025 angka romawi XX angka 9 | POJK 22/2023 Pasal 62 | Penagihan wajib sesuai aturan pelindungan konsumen |
| 18 | SEOJK 19/2025 angka romawi XX angka 4 | POJK 40/2024 Pasal 96 | Pengalihan portofolio saat penyelenggara bermasalah |
| 19 | POJK 40/2024 Pasal 179 | POJK 22/2023 Pasal 3 | POJK 40 menunjuk prinsip pelindungan konsumen POJK 22 |
| 20 | POJK 40/2024 Pasal 164 | UU 27/2022 Pasal 20 | Persetujuan sebagai dasar pengambilan data pribadi |
| 21 | POJK 40/2024 Pasal 165 | UU 27/2022 Pasal 43 | Kewajiban menghapus data pribadi |
| 22 | POJK 22/2023 Pasal 19 | UU 27/2022 Pasal 20 | Data konsumen dan dasar pemrosesan data pribadi |
| 23 | POJK 22/2023 Pasal 62 | UU 27/2022 Pasal 65 | Menyebarkan utang ke kontak = mengungkapkan data pribadi orang lain |
| 24 | POJK 22/2023 Pasal 62 | UU 27/2022 Pasal 67 | Ancaman pidana atas pengungkapan data pribadi |

---

## 4. Kamus istilah (28 baris)

Dipakai saat menulis ulang pesan user menjadi kueri berbahasa hukum. Semua istilah hukum di kolom kanan sudah dicek ada di teks peraturan.

| Istilah sehari-hari | Istilah di peraturan |
|---|---|
| pinjol / pinjaman online / aplikasi pinjaman | LPBBTI, Penyelenggara, Layanan Pendanaan Bersama Berbasis Teknologi Informasi |
| minjem / ngutang / pinjaman / utang | Pendanaan |
| peminjam / nasabah / aku yang minjem | Penerima Dana, Konsumen, Pengguna |
| yang minjemin / lender / pemodal | Pemberi Dana |
| bunga / biaya admin / potongan / biaya tersembunyi | manfaat ekonomi, bunga, biaya administrasi |
| denda / denda telat | denda keterlambatan |
| telat bayar / nunggak / nggak bisa bayar | keterlambatan, wanprestasi |
| galbay / gagal bayar | wanprestasi |
| dc / debt collector / penagih / tukang tagih / kolektor | penagihan, pihak lain, alih daya |
| diteror / ditelpon terus / di-spam / dichat terus | penagihan, terus menerus yang bersifat mengganggu |
| diancam / dimaki / dikata-katain / dibentak | ancaman, kekerasan, tekanan secara fisik maupun verbal |
| dipermalukan / disebar ke grup / dibikin malu | mempermalukan, menyebarluaskan informasi |
| nagih ke keluarga / nagih ke kantor / nagih ke atasan / nagih ke teman | penagihan, pihak selain Konsumen |
| ditagih malam / ditagih tengah malam / ditagih hari minggu | pukul 08.00 – 20.00, hari Senin sampai dengan Sabtu |
| kontak darurat / nomor darurat | kontak darurat |
| sebar data / data disebar / data bocor / data dijual | mengungkapkan Data Pribadi, kegagalan Pelindungan Data Pribadi |
| akses kontak / akses galeri / izin aplikasi / akses hp | mengakses kamera, lokasi, dan mikrofon, Data Pribadi |
| ktp / data diri / foto selfie / nomor hp | Data Pribadi |
| hapus data / minta data dihapus | menghapus Data Pribadi, pemusnahan |
| lapor / ngadu / komplain / melapor | pengaduan, Layanan Pengaduan |
| ojk | Otoritas Jasa Keuangan |
| tenor / lama cicilan / jangka waktu | tenor, jangka waktu |
| kontrak / syarat dan ketentuan / s&k | perjanjian, perjanjian baku, klausul baku |
| utang dipindah / ganti perusahaan penagih | pengalihan portofolio Pendanaan |
| pinjol tutup / pinjol bangkrut / aplikasi hilang | pencabutan izin usaha |
| dipenjara / hukuman / dihukum | pidana penjara, pidana denda, sanksi |
| barang disita / barang ditarik | penarikan barang jaminan, agunan |
| nuntut / gugat / minta ganti rugi | menggugat dan menerima ganti rugi |

---

## 5. Perilaku Puan AI (ringkasan system prompt)

Teks lengkapnya ada di `puan_rag/prompt.py`. Ringkasnya:

**Cara bicara**
- Buka dengan empati yang **spesifik** terhadap situasi user; jangan pernah menyalahkan ("makanya jangan pinjol").
- **Curhat saja** (tanpa bertanya): dengarkan, validasi, "kamu tidak sendirian", tawarkan bantuan. Jangan ada aturan, angka,
  atau baris "Dasar aturannya"; maksimal 1 fitur ATAU 1 lembaga.
- **Bertanya**: empati singkat, lalu jawab dengan bahasa sehari-hari, maksimal ±200 kata.
- Sumber hanya di baris terakhir, dan hanya pasal yang benar-benar dipakai. Format SEOJK: "SEOJK 19/2025 angka romawi VIII angka 1".

**Kejujuran**
- Dasar hukum **hanya** dari bahan bacaan; dilarang mengarang pasal, angka, batas bunga, atau sanksi.
- Kalau tidak tahu: akui terus terang, jangan bilang "tidak diatur", jangan mengisi dengan info yang hanya mirip,
  lalu arahkan ke OJK 157 (aturan/lembaga jasa keuangan), LBH/advokat (hukum lain), atau polisi (ancaman/pidana).
- Tidak pernah menyebut meminjam sebagai pilihan "aman"/"boleh". EduPuan tidak merekomendasikan pinjol.

**Keselamatan (prioritas tertinggi)**
Tanda krisis → berhenti membahas aturan, fokus pada keselamatan, arahkan ke Healing119 (119 ekstensi 8 / www.healing119.id).

**Arahan fitur EduPuan** (maks. 1–2, di akhir): Cek Legalitas Pinjol · Cek Penawaran · Cari Alternatif (tanpa utang) ·
Rangkum Semua Utang · Baca & Analisis Pesan Penagih · Dokumentasi & Lapor. **Tidak pernah** menyarankan "Ceritakan Situasimu".

**Di luar topik**: jawab sopan dan singkat, tidak menggiring ke pinjol, tidak berasumsi user punya utang.

---

## 6. Kontak lembaga yang disebut Puan AI: WAJIB dicek ulang sebelum demo

Kontak ini tertulis di system prompt. Kalau salah, Puan AI akan menyebarkan informasi yang salah dengan sangat yakin.

| Lembaga | Yang tertulis di prompt | Sudah dicek ulang? |
|---|---|---|
| Kontak OJK 157 | telepon 157, WhatsApp 081-157-157-157, konsumen@ojk.go.id, kontak157.ojk.go.id | [ ] |
| Satgas PASTI (pinjol ilegal) | lewat Kontak OJK 157, satgaspasti@ojk.go.id | [ ] |
| Healing119 (Kemenkes) | telepon 119 ekstensi 8, www.healing119.id | [ ] |

Juga sebelum demo:
- [ ] Apakah ada perubahan/amandemen UU 27/2022 yang mengubah pasal yang dipakai?
- [ ] Apakah ada POJK/SEOJK baru yang mengubah batas manfaat ekonomi dan denda (SEOJK XIV)?

---

## 7. Pemeliharaan

- **Peraturan baru/berubah** → ikuti `docs/02_panduan_menjalankan.md` bagian H, lalu ulangi evaluasi.
- **Pasal penting ternyata belum diambil** (misalnya muncul di uji jawaban) → tambah di `kurasi.py`, bangun ulang, evaluasi.
- **Istilah baru dari user** (misalnya slang baru) → tambah di `data/kamus_istilah.json`, pastikan istilah hukumnya ada di teks peraturan.
