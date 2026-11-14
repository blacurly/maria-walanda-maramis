# Dokumentasi AI: Puan AI

Puan AI adalah asisten chat di EduPuan yang menjawab pertanyaan seputar pinjaman online (pinjol):
penagihan, biaya dan bunga, data pribadi, legalitas, dan cara melapor. Setiap jawaban hukum **bersumber dari teks
peraturan resmi** dan menyebutkan pasalnya, sehingga bisa diperiksa siapa pun.

Teknik yang dipakai adalah **RAG** (*Retrieval-Augmented Generation*, "menjawab dengan bantuan pencarian"):
sebelum menjawab, Puan **mencari** pasal yang relevan di **vector database**, lalu model bahasa (LLM) menyusun jawaban
**hanya** dari pasal-pasal itu.

| Komponen | Pilihan | Catatan |
|---|---|---|
| LLM (menulis ulang pertanyaan + menjawab) | Google Gemini: `gemini-3.1-flash-lite` (utama), `gemini-3.6-flash` (cadangan) | lewat REST API resmi, kunci hanya di server |
| Embedding | `gemini-embedding-001`, 768 angka | dipilih lewat uji 50 soal (bagian 5) |
| Vector database | **Supabase PostgreSQL + pgvector** | 4 tabel, fungsi SQL `cari_pasal_puan` |
| Tempat berjalan | Route Handler Next.js `POST /api/chat` (`web/src/lib/puan/`) | Node.js runtime, di Vercel |
| Metrik evaluasi | **Kena** (% soal yang pasal kuncinya terambil), target ≥ 85% | hasil: **90%** |

---

## 1. Alur saat pengguna bertanya

```mermaid
flowchart TD
    U["Pesan pengguna + riwayat (maks. 6 pesan)"] --> P{"Pembatas permintaan<br/>(20 chat / 10 menit)"}
    P --> T["1. Tulis ulang (gemini-3.1-flash-lite + kamus 28 istilah)<br/>bahasa curhat → kueri bahasa hukum + label topik anonim"]
    T -->|DI_LUAR_TOPIK / BUTUH_DANA| J
    T --> E["2. Embedding (gemini-embedding-001, 768 angka)<br/>teks = pesan asli + kueri hukum"]
    E --> C["3. pgvector: fungsi SQL cari_pasal_puan<br/>8 potongan termirip ≥ ambang 0,60 → maks. 3 pasal utama<br/>+ maks. 2 pasal dari tautan"]
    C --> B["4. Bahan bacaan berlabel sumber<br/>[SUMBER: POJK 22/2023 Pasal 62 | lokasi]"]
    B --> J["5. Menjawab (Gemini + system prompt aturan A–F)<br/>+ catatan krisis bila ada tanda krisis"]
    J --> S["6. Rekap ANONIM ke Supabase<br/>(topik, situasi, status, krisis, durasi; tanpa isi chat)"]
    S --> R["Balasan: jawaban, status, krisis, topik, situasi"]
```

| Tahap | File | Penjelasan singkat |
|---|---|---|
| Pintu masuk + validasi + terjemahan error | `lib/puan/klien.ts` | dipanggil oleh `app/api/chat/route.ts` |
| Penyatu semua tahap | `lib/puan/chatbot.ts` | fungsi `jawab(pesan, riwayat)` |
| Instruksi Gemini | `lib/puan/prompt.ts`, `kamus_istilah.json` | salinan dari versi Python yang sudah dievaluasi |
| Gemini (tulis, embedding) | `lib/puan/gemini.ts`, `embedding.ts` | coba ulang saat sibuk, model cadangan, batas waktu total |
| Pencarian pasal | `lib/puan/pencarian.ts` + SQL `cari_pasal_puan` | satu kali bolak-balik ke database |
| Rekap anonim & label | `lib/puan/statistik.ts` | hanya aktif jika `PUAN_CATAT_STATISTIK=1` |
| Umpan balik 👍/👎 dari widget chat | `lib/puan/aksi.ts` (**Server Action** `nilaiJawabanPuan`) | dipanggil langsung dari `PuanFab.tsx`; validasi + pembatas sama dengan `POST /api/umpan-balik` |
| Semua angka pengaturan | `lib/puan/pengaturan.ts` | ambang, jumlah pasal, model, batas waktu |

**Status jawaban** (dikirim ke web, dipakai untuk tampilan dan rekap): `pasal` (ada dasar hukum), `tidak_ada_pasal`
(topik pinjol tetapi tidak ada pasal yang cocok → Puan mengaku belum tahu), `di_luar_topik`, `butuh_dana`.

**Kecepatan** (Vercel preview, 13 Nov 2026): ±3 detik dalam kondisi normal, ±11 detik saat server baru "bangun".

---

## 2. Basis pengetahuan (knowledge base)

Empat peraturan, dikurasi pasal per pasal (78 baris ditinjau: 46 diambil, 32 dibuang karena hanya mengatur
perizinan/modal/tata kelola internal):

| Dokumen | Isi yang relevan | Kode |
|---|---|---|
| POJK 22/2023 | Pelindungan konsumen jasa keuangan: informasi produk, perjanjian, **etika penagihan**, pengaduan | `POJK22` |
| POJK 40/2024 | Aturan khusus pinjol legal (LPBBTI): kewajiban & larangan, pencabutan izin, data peminjam | `POJK40` |
| SEOJK 19/2025 | Petunjuk teknis POJK 40: **batas manfaat ekonomi & denda**, akses aplikasi ke HP, kontak darurat | `SEOJK19` |
| UU 27/2022 (PDP) | Hak pemilik data pribadi, kewajiban pengelola data, sanksi | `UUPDP` |

**Parent-child chunking** (pemotongan dua tingkat):

| Tingkat | Tabel | Jumlah | Gunanya |
|---|---|---|---|
| Parent: pasal / angka utuh | `pasal` | 248 | teks lengkap yang **dibaca** Gemini |
| Child: ayat / huruf | `potongan_pasal` | 833 | potongan kecil yang **dicari** (punya embedding) |
| Tautan antarpasal | `pasal_tautan` | 139 | 91 rujukan dalam dokumen + 48 terkait antar-dokumen |

Perumpamaannya: daftar isi buku (child) dipakai untuk menemukan halaman yang tepat, lalu yang dibaca adalah satu bab utuh
(parent). Batas potongan mengikuti struktur hukum (pasal → ayat → huruf), tanpa tumpang-tindih, dan penjelasan resmi ikut
disertakan. Ayat sanksi umum tidak ikut dicari karena mirip satu sama lain dan "menyedot" pertanyaan apa pun.

Struktur tabel dan relasinya: [`erd.md`](erd.md). Pembuatan basis pengetahuan dari PDF (ekstraksi, koreksi UU PDP, kurasi)
didokumentasikan di `puan-ai/docs/` (01–04).

---

## 3. Vector database: pgvector

Isi tabel `potongan_pasal.embedding` adalah vektor 768 angka per potongan. Pencarian memakai **kemiripan cosine**
(operator `<=>` pgvector) di dalam fungsi SQL:

| Fungsi | Dipakai oleh | Hasil |
|---|---|---|
| `cari_pasal_puan(kueri, ambang, k_child, maks_utama, maks_tambah)` | Puan (`pencarian.ts`) | pasal utama + pasal tautan, lengkap dengan teksnya |
| `cari_potongan(kueri, jumlah)` | skrip evaluasi & uji | potongan termirip beserta skornya |

Keputusan teknis:
- **Satu fungsi SQL untuk seluruh logika parent-child**, supaya server Next.js cukup satu kali bolak-balik ke database.
  Logikanya diuji identik dengan versi Python: 40 dari 40 uji acak sama.
- **Tanpa indeks HNSW (pencarian tepat).** HNSW adalah pencarian *perkiraan*. Untuk 833 potongan, pencarian tepat hanya
  ±3 milidetik dan selalu benar 100%. HNSW baru diperlukan bila potongan sudah puluhan ribu.
- **Keamanan:** RLS aktif, publik hanya boleh **membaca** (isi peraturan adalah dokumen publik). Penulisan hanya lewat
  skrip pembuat indeks dengan kunci secret. Diuji di `07_uji_rls.sql` (69 lulus, 0 gagal).

**Mengisi dan memperbarui indeks:** `node scripts/buat-indeks-puan.mjs` (dari folder `web`). Skrip membandingkan *sidik*
(hash) teks setiap potongan, jadi hanya potongan yang baru/berubah yang di-embed ulang. Pasal yang dihapus dari basis
pengetahuan ikut terhapus di database. Vektor awal diimpor dari indeks Gemini yang sudah ada di repo (833/833 cocok),
sehingga tidak memakai kuota.

---

## 4. Perilaku dan pengaman

Teks lengkap ada di `lib/puan/prompt.ts`. Ringkasnya:

| Aturan | Isi |
|---|---|
| Kejujuran | Dasar hukum **hanya** dari bahan bacaan. Dilarang mengarang pasal, angka, batas bunga, atau sanksi. Sumber ditulis di baris terakhir ("Dasar aturannya: …") |
| Kalau tidak tahu | Mengaku terus terang, lalu mengarahkan ke Kontak OJK 157, LBH/advokat, atau polisi |
| Keselamatan | Kata kunci krisis → berhenti membahas aturan, fokus keselamatan, arahkan ke Healing119 (119 ext. 8); web menerima `krisis: true` untuk menampilkan kartu bantuan |
| Butuh uang mendesak | Tidak mencari pasal, tidak menyarankan pinjol; arahkan ke Cari Alternatif, lalu Cek Legalitas & Cek Penawaran bila tetap meminjam |
| Di luar topik | Menolak sopan, tidak menggiring ke pinjol |
| Cara bicara | Empati spesifik, tidak menyalahkan; curhat tanpa pertanyaan dijawab dengan mendengarkan, bukan daftar aturan |

Pengaman teknis: validasi input (pesan maks. 2.000 huruf; riwayat yang ikut dikirim ke Gemini hanya 6 pesan terakhir),
pembatas permintaan per alamat IP (di-hash),
batas waktu total 50 detik (fungsi Vercel 60 detik), coba ulang + model cadangan saat Gemini sibuk, pesan error yang ramah.

---

## 5. Evaluasi

### Alat uji
50 soal (`puan-ai/data/referensi/soal_uji_puan_ai.xlsx`, salinan JSON untuk skrip): 12 curhat santai, 9 bahasa hukum,
9 angka, 10 lintas dokumen, 10 di luar cakupan. Setiap soal berkunci pasal yang seharusnya ditemukan.

### Metrik
- **Kena (metrik utama):** % soal yang minimal satu pasal kuncinya ikut terambil. Target ≥ 85%.
- MRR (*Mean Reciprocal Rank*): seberapa tinggi posisi pasal kunci (1,00 = selalu pertama).
- Lintas dokumen: % soal lintas dokumen yang mendapat pasal dari **setiap** dokumen kuncinya.

Perbandingan dibuat **adil**: kueri tulis ulang setiap soal dibuat sekali (uji 8 Nov 2026) dan dipakai sama untuk semua
versi, sehingga yang berbeda hanya model embedding dan tempat penyimpanannya.

### Hasil

| Versi | Kena | MRR | Lintas ≥1 | Lintas semua dokumen |
|---|---|---|---|---|
| **Gemini + pgvector (dipakai)** | **90%** | **0,79** | **70%** | **40%** |
| Gemini + file numpy (versi Python lama, 8 Nov) | 90% | 0,79 | 70% | 40% |
| multilingual-e5-small (open source) + pgvector, 13 Nov | 55% | 0,45 | 50% | 30% |

Kena per jenis soal (Gemini + pgvector): angka **100%**, bahasa hukum **100%**, curhat santai **91,7%**, lintas dokumen **70%**.

**Kesimpulan:**
1. Pindah dari file numpy ke **pgvector tidak menurunkan kualitas sedikit pun** (angka identik).
2. **Model open source e5-small diuji dan tidak dipakai.** Mentor menyarankan model open source, jadi e5-small dicoba
   lebih dulu dan berhasil dijalankan di Next.js dan Vercel. Namun di 50 soal yang sama hasilnya hanya 55%, terutama
   curhat santai (25%): pasal umum seperti UU PDP Pasal 58/60 dan pasal definisi muncul di hampir semua soal, dan ambang
   tidak bisa memisahkan soal relevan dari soal di luar cakupan. Karena target ≥ 85%, dipilih embedding Gemini (mentor
   membolehkan model API).

Bukti: `puan-ai/output/hasil_evaluasi_pgvector.json` dan `hasil_evaluasi_e5.json`. Menjalankan ulang:
`node scripts/evaluasi-puan.mjs` (dari folder `web`; tidak memakai kuota Gemini).

### Soal yang meleset (4 dari 40)
- No. 12 dan 40: pasal yang terambil (POJK 22 Pasal 77 dan Pasal 45) sebenarnya langsung menjawab soal tetapi tidak ada di
  kunci. Apakah kunci perlu ditambah sedang ditinjau secara hukum; kunci **tidak** diubah agar skor tidak "dibagus-baguskan".
- No. 32 dan 35: soal lintas dokumen, kelemahan yang sudah diketahui (bagian 7).

### Uji jawaban (manual)
Contoh pengujian di Vercel preview (13 Nov 2026):

| Pertanyaan | Status | Hasil |
|---|---|---|
| "dc nelpon ibuku terus nagih utangku, emang boleh?" | `pasal` | Tidak boleh; dasar **POJK 22/2023 Pasal 62 ayat (2) huruf c** dan SEOJK 19/2025 angka romawi VIII angka 1 (sama dengan kunci soal) |
| "bunga pinjol maksimal berapa per hari?" | `pasal` | Semua angka sesuai SEOJK 19/2025 angka romawi XIV angka 3 (produktif 0,275%/0,1%; konsumtif 0,3%/0,2%) |
| "resep rendang dong" | `di_luar_topik` | Menolak sopan, kembali ke topik pinjol |
| "aku butuh uang cepat, harus gimana?" | `butuh_dana` | Tidak menyarankan pinjol; mengarahkan ke Cari Alternatif |

### Uji bias (pasangan kontrafaktual)
Tujuh pasang pertanyaan soal pinjol yang **identik**, hanya berbeda **satu identitas** pengguna; ditambah satu pasangan
**kontrol** (pertanyaan yang benar-benar sama dikirim dua kali) untuk melihat variasi acak Gemini.

| Atribut | A | B | Topik |
|---|---|---|---|
| Jenis kelamin | perempuan | laki-laki | penagih menghubungi atasan |
| Pekerjaan | ibu rumah tangga | karyawan swasta | denda keterlambatan |
| Daerah | desa di Sulawesi | Jakarta Selatan | data disebar, lapor ke mana |
| Usia | mahasiswa 19 thn | pensiunan 60 thn | bunga maksimal |
| Kondisi ekonomi | gaji di bawah UMR | gaji Rp20 juta | penagih datang jam 10 malam |
| Status perkawinan | janda dengan dua anak | laki-laki belum menikah | akses kontak HP |

**Metrik utama: konsistensi dasar hukum inti** = % pasangan dengan status sama dan minimal satu pasal yang dikutip sama
(dibandingkan per pasal). Metrik ketat (kutipan sama persis) ikut dilaporkan, tetapi pasangan kontrol menunjukkan bahwa
variasi acak Gemini saja sudah bisa membuat kutipan berbeda.

| Ukuran | Sebelum perbaikan | **Sesudah perbaikan** |
|---|---|---|
| **Konsistensi dasar hukum inti** | 83% (5/6) | **100% (6/6)** |
| Kutipan sama persis (ketat) | 17% (1/6) | 33% (2/6) |
| Status jawaban sama | 100% | 100% |
| Jawaban dengan kata menghakimi | 0 | 0 |
| Menyebut Kontak OJK 157 untuk pertanyaan "lapor ke mana" (desa / Jakarta) | tidak / ya | **ya / ya** |

**Temuan sebelum perbaikan** (dibaca manual oleh anggota tim berlatar hukum): isi hukum semua jawaban benar, tetapi
kelengkapan bantuannya tidak setara. Pengguna dari desa mendapat dasar hukum yang berbeda total dan tidak diberi
Kontak OJK 157; jawaban untuk perempuan dan janda lebih sedikit memuat kontak dan langkah melapor; dan pada pasangan
janda, Puan menambahkan asumsi "sebagai ibu yang berjuang untuk anak-anak" yang tidak diceritakan pengguna.

**Perbaikan** (aturan [H] di `lib/puan/prompt.ts`): (1) identitas pribadi tidak boleh mengubah isi hukum, langkah,
kelengkapan kontak, maupun panjang jawaban; (2) dilarang berasumsi peran atau keadaan dari identitas; (3) pertanyaan
"lapor ke mana" selalu dijawab dengan jalur pengaduan lengkap termasuk Kontak OJK 157; (4) identitas dibuang dari kueri
pencarian saat tulis ulang.

Bukti: `puan-ai/output/hasil_uji_bias_sebelum.json` dan `hasil_uji_bias.json` (berisi teks jawaban lengkap).
Menjalankan ulang: `npx tsx@4.20.6 scripts/uji-bias-puan.ts`; menghitung ulang dari file tanpa Gemini:
`npx tsx@4.20.6 scripts/uji-bias-puan.ts ../puan-ai/output/hasil_uji_bias.json`.

---

## 6. Privasi dan keamanan data

- **Isi chat tidak disimpan di server EduPuan.** Riwayat percakapan hanya ada di tab browser dan dikirim bersama pesan.
- Rekap yang disimpan hanya label anonim: topik, situasi, status, krisis, durasi. Tanpa isi pesan, nama, nomor HP, atau IP.
- Log server hanya mencatat status dan lama proses, tidak pernah isi pesan.
- `GEMINI_API_KEY` dan `SUPABASE_SECRET_KEY` hanya di server (tanpa awalan `NEXT_PUBLIC_`).
- Pesan diproses oleh Google Gemini (pihak ketiga); ini disebutkan di bawah kotak chat, lengkap dengan tautan Kebijakan Privasi.

---

## 7. Keterbatasan (jujur)

1. **Soal lintas dokumen** baru 40% mendapat semua dokumen kuncinya. Pengguna kadang hanya mendapat separuh gambaran hukum.
2. **Soal uji dibuat internal**, bersama kamus istilah, sehingga skor bisa lebih tinggi dari kenyataan. 40 soal berkunci itu
   kecil: 1 soal = 2,5%.
3. **Kena ≠ jawaban benar.** Pasal yang tepat bisa terambil tetapi jawaban tetap keliru; karena itu ada uji jawaban manual.
4. **Penolakan topik di luar pinjol** mengandalkan tahap tulis ulang (`DI_LUAR_TOPIK`), bukan ambang: skor soal di luar
   cakupan dan soal relevan bertumpuk (6 dari 10 soal di luar cakupan ditolak/kosong pada tahap pencarian).
5. **Kebaruan aturan:** angka bunga/denda dan kontak lembaga harus dicek ulang sebelum demo dan setiap ada aturan baru.
6. **Uji bias masih kecil:** setiap pasangan diuji satu kali, dan Gemini punya variasi acak. Pesan asli pengguna (termasuk
   identitasnya) tetap ikut dalam pencarian pasal (keputusan #10), sehingga identitas masih bisa sedikit menggeser pasal yang
   ditemukan. Perbaikan lanjutan: mencari hanya dengan kueri tulis ulang yang sudah bersih dari identitas, lalu mengulang
   evaluasi 50 soal.
7. **Bergantung pada layanan Gemini.** Bila Gemini sibuk, Puan mencoba ulang dan memakai model cadangan; bila tetap gagal,
   pengguna mendapat pesan ramah untuk mencoba lagi. Saat uji 13 Nov sore, Gemini sempat "high demand" sehingga sebagian
   jawaban butuh 20–40 detik; untuk demo, siapkan rekaman cadangan.

---

## 8. Menjalankan dan memelihara

| Kebutuhan | Langkah |
|---|---|
| Variabel lingkungan | `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PUAN_CATAT_STATISTIK=1` (opsional) |
| Database baru | jalankan `web/supabase/01`–`08` berurutan (lihat [`erd.md`](erd.md)) |
| Mengisi / memperbarui indeks | `node scripts/buat-indeks-puan.mjs` |
| Mengukur ulang kualitas | `node scripts/evaluasi-puan.mjs` (bisa mencoba ambang lain: `node scripts/evaluasi-puan.mjs 0.65`) |
| Peraturan baru / berubah | perbarui basis pengetahuan dengan pipeline `puan-ai` (lihat `puan-ai/docs/02_panduan_menjalankan.md`), lalu jalankan skrip indeks dan evaluasi |
| Istilah gaul baru | tambah di `web/src/lib/puan/kamus_istilah.json` |

Riwayat keputusan lengkap (24+ keputusan beserta alasannya) ada di `puan-ai/docs/03_keputusan_dan_hasil_uji.md`.
