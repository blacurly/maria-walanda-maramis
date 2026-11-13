# 03 — Keputusan Desain & Hasil Uji

Catatan **kenapa** Puan AI dibangun seperti ini, apa buktinya, dan apa yang belum beres.
Bagian 6 berisi pertanyaan yang kemungkinan besar ditanyakan juri/mentor beserta jawabannya.

---

## 1. Log keputusan

| # | Keputusan | Alasan | Alternatif yang tidak dipilih |
|---|---|---|---|
| 1 | **RAG** di atas 4 peraturan resmi | jawaban hukum harus bisa ditelusuri ke pasal; AI tanpa rujukan bisa mengarang angka/pasal | prompt saja (rawan halusinasi); fine-tuning (mahal, sulit diperbarui saat aturan berubah) |
| 2 | 4 dokumen: POJK 22/2023, POJK 40/2024, UU 27/2022, SEOJK 19/2025 | mencakup hak konsumen umum, aturan khusus pinjol, data pribadi, dan angka teknis (bunga/denda) | hanya POJK 22 (versi awal), karena tidak memuat batas bunga dan aturan data |
| 3 | **Kurasi pasal**: 78 baris ditinjau, 46 diambil, 32 dibuang | pasal soal perizinan, modal, dan tata kelola internal hanya menjadi "pengalih" di pencarian | mengambil semua pasal |
| 4 | Ekstraksi `pdftotext -layout` | tanpa `-layout`, penanda ayat "(1)" hilang, padahal itu batas child | PyMuPDF / pdftotext biasa (keduanya menghilangkan penanda ayat) |
| 5 | **UU PDP ditranskripsi ulang manual** dari gambar scan (48 pasal + penjelasan) | hasil OCR rusak: "Rp5.00O.OOO", "Pasa722", kata hilang. Saat transkripsi tertangkap tebakan keliru: Pasal 25(1) berbunyi "diselenggarakan secara khusus", bukan "wajib" | memakai OCR apa adanya |
| 6 | **Parent-child chunking**, batas mengikuti pasal/ayat/huruf, **tanpa overlap** | child kecil tepat dicari, parent utuh lengkap untuk menjawab; batas struktural sudah satu kesatuan makna | potong per N karakter (memotong ayat di tengah); per pasal saja (pencarian kabur untuk pasal panjang) |
| 7 | Penjelasan resmi ikut ke child & parent | contoh: "terus menerus" = lebih dari 3x sehari hanya ada di penjelasan | membuang penjelasan |
| 8 | Rujukan dalam dokumen otomatis + **24 tautan antar-dokumen manual** | aturan pinjol tersebar (POJK 40 ↔ SEOJK 19 ↔ POJK 22 ↔ UU PDP). Tautan dibuat **per angka**, karena tautan per bagian sempat membuat POJK22:62 punya ±20 tautan | tanpa tautan (soal lintas dokumen meleset) |
| 9 | **Ayat sanksi tidak ikut dicari** (tetap ada di teks parent); pasal pidana khusus tetap dicari | ayat "PUJK yang melanggar... dikenai sanksi" mirip satu sama lain dan menyedot pertanyaan apa pun | mencari semua ayat |
| 10 | **Tulis ulang + kamus 28 istilah**; yang dicari = pesan asli + kueri hukum | user menulis "dc", "galbay", "diteror", sedangkan pasal menulis "penagihan", "wanprestasi", "terus menerus yang bersifat mengganggu" | mencari pesan mentah saja |
| 11 | Embedding `gemini-embedding-001` (768 dimensi), **ambang 0,60** | teks tak berkaitan ≈ 0,52; resep nasi goreng 0,543 (tertolak). Selisihnya tipis, jadi penolakan topik terutama mengandalkan `DI_LUAR_TOPIK` dari tulis ulang | — (**diganti oleh #22**) |
| 12 | 8 child → maks. 3 parent utama + 2 tambahan | uji 2: menambah jatah tidak menaikkan skor (lihat 3.3), tapi bahan bacaan +25–48% | 4–5 parent utama |
| 13 | Jawab: `gemini-3.6-flash` suhu 0,4; tulis ulang: `gemini-3.1-flash-lite` suhu 0 | tulis ulang harus konsisten; jawaban boleh sedikit luwes agar hangat | — |
| 14 | System prompt dengan aturan **A–E** hasil evaluasi uji coba pertama | uji jawaban pertama: curhat malah dijawab daftar aturan; soal waris menambahkan klaim asuransi "wajib" yang tidak akurat + mengutip Pasal 144 yang tidak relevan; format "SEOJK Bab VIII" keliru | — |
| 15 | Coba ulang + model cadangan saat Gemini 503/429 | error 503 benar-benar terjadi saat uji | gagal langsung |
| 16 | Kata kunci krisis → aturan keselamatan + Healing119 (119 ext 8) | curhat pinjol bisa menyentuh keputusasaan; keselamatan di atas segalanya | — |
| 17 | **Riwayat percakapan** (6 pesan terakhir; tulis ulang memakai 2 pesan user terakhir) | pertanyaan lanjutan "terus aku harus gimana?" tidak bisa dipahami tanpa konteks | stateless total |
| 18 | ~~Indeks disimpan sebagai **file** dan dimuat ke memori FastAPI; Supabase pgvector opsional~~ **Diganti oleh #21** | (lama) 694 vektor dicari < 1 milidetik | — |
| 19 | **Dukungan dua model embedding** (Gemini & multilingual-e5-small) | arsitektur tim menyebut e5; perlu dibandingkan dengan data, bukan asumsi | memilih salah satu tanpa uji |
| 20 | **Opsi pecah daftar panjang per huruf** (≥80 kata & ≥5 butir), diputuskan lewat evaluasi | uji 2 menemukan "chunk magnet": POJK40:144(2) dan POJK40:158 muncul di banyak soal yang tidak relevan | menambal 2 pasal saja (itu sama dengan "menyontek kunci jawaban") |
| 21 | **Vector DB = Supabase pgvector** (`web/supabase/08_pengetahuan_puan.sql`: `dokumen_hukum`, `pasal`, `pasal_tautan`, `potongan_pasal` + `vector(384)` + indeks HNSW cosine + fungsi `cari_potongan`), dan **Puan pindah dari FastAPI ke Next.js** (`web/src/lib/puan`) | mentor: file indeks + numpy "belum cukup", wajib vector database (FAISS/Chroma/pgvector); panduan teknis: backend di dalam proyek Next.js | FAISS/Chroma (butuh server terpisah); tetap FastAPI |
| 22 | ~~**Embedding = `multilingual-e5-small`** dijalankan langsung di Next.js lewat `@huggingface/transformers@4.3.1` (`Xenova/multilingual-e5-small`, `dtype: q8`), awalan `query: ` / `passage: `. Gemini hanya untuk LLM~~ **Diganti oleh #25** | mentor: "disarankan open source"; uji coba 13 Nov 2026 berhasil di laptop & Vercel (lihat 3.4) | Gemini embedding 768 dimensi (cadangan bila e5 bermasalah) |
| 23 | Semua teks di-embed **satu per satu** (indeks & pertanyaan) | dengan `q8`, embed sekaligus (batch) bergeser hingga 0,0138 per angka karena *padding*; satu per satu menjamin indeks dan kueri konsisten | embed batch |
| 24 | ~~Model e5 diunduh saat server bangun~~ (tidak berlaku lagi setelah #25) | — | — |
| 25 | **Embedding = `gemini-embedding-001` (768) di pgvector** (13 Nov 2026). Vektor 833 potongan diimpor dari indeks Gemini yang sudah ada (`indeks_gemini_pecah/vektor.npy`, sidik cocok 833/833) oleh `web/scripts/buat-indeks-puan.mjs`; pertanyaan di-embed lewat API (RETRIEVAL_QUERY); ambang 0,60 | **Uji 50 soal dengan kueri tulis ulang yang sama**: e5-small + pgvector Kena **55%** (curhat santai 25%, MRR 0,45, pasal "magnet" UUPDP:60/58 dan pasal definisi; ambang tidak bisa memisahkan soal relevan 0,786 vs luar cakupan 0,834) vs Gemini **90%**. Target ≥ 85%. Mentor membolehkan model API. Bonus: fungsi /api/chat turun dari 105 MB ke 1,8 MB, tanpa cold start memuat model | tetap e5 (di bawah target); hybrid e5 + kata kunci (hasil belum pasti, waktu 7 hari); model open source besar (terlalu berat untuk Vercel) |

---

## 2. Bug yang ditemukan dan diperbaiki

| Bug | Dampak | Perbaikan |
|---|---|---|
| Penanda ayat hilang saat ekstraksi | child tidak bisa dipotong per ayat | `pdftotext -layout` |
| Aturan header ikut membuang baris "REPUBLIK INDONESIA" di dokumen OJK | teks terpotong | aturan header khusus dokumen scan (`hasil_scan=True`) |
| Judul BAB/Bagian multi-baris terpotong | lokasi pasal tidak lengkap | judul dikumpulkan sampai baris kosong |
| "Huruf b Cukup jelas." tersisa di penjelasan | sampah di bahan bacaan | regex pembersih "Cukup jelas" |
| Rujukan ", dan Pasal 13" tidak terbaca | rujukan hilang | pola pemisah diperluas |
| SEOJK bagian XX awalnya dibuang | aturan penagihan (angka 8–10) & pengalihan portofolio (4–7) hilang | diubah jadi diambil |
| Tautan level bagian membanjiri POJK22:62 | tambahan pasal acak | tautan dibuat per angka |
| **22 ayat sanksi POJK 22 lolos dari penandaan** ("dapat dikenai sanksi sesuai...", "tidak memenuhi pelaksanaan sanksi...") | soal 38 kalah oleh ayat sanksi | pola sanksi diperluas (uji 2) |
| Di Vercel, mesin onnxruntime tidak ikut terbawa (ditemukan lewat simulasi build) | `Cannot find module` saat Puan dipanggil | `outputFileTracingIncludes` (lihat 3.4) |

Catatan dari dokumen asli: SEOJK XX angka 9 merujuk "angka 7", kemungkinan salah ketik di dokumen OJK (maksudnya angka 8).

---

## 3. Hasil uji

**Alat uji:** 50 soal (`data/referensi/soal_uji_puan_ai.xlsx`): 12 curhat santai, 9 bahasa hukum, 9 angka, 10 lintas dokumen,
10 di luar cakupan (5 di luar topik + 5 topik keuangan yang tidak dicakup 4 dokumen). Setiap kunci pasal sudah dicek ada di knowledge base.

**Ukuran:**
- **Kena**: minimal satu pasal kunci ikut terambil. Target ≥ 85%.
- **MRR** (*Mean Reciprocal Rank*, "rata-rata kebalikan peringkat"): 1,00 berarti kunci selalu di urutan pertama.

### 3.1 Uji 1 (pencarian, embedding Gemini)

| Jenis | Kena |
|---|---|
| Angka | **100%** (9/9) |
| Bahasa hukum | **100%** (9/9) |
| Curhat santai | 92% (11/12) |
| Lintas dokumen | **60%** (6/10) |
| **Keseluruhan** | **87,5% (35/40), MRR 0,80** |
| Di luar cakupan | 7/10 ditolak benar; 3 mendapat pasal → perlu cek jawaban (waris, dipenjara, mendirikan pinjol) |

### 3.2 Diagnosis 5 soal yang meleset (langkah 15b)

Di kelima soal, **tulis ulang sudah benar**. Penyebabnya bukan kamus:

| Soal | Penyebab |
|---|---|
| 12 komplain dicuekin | **kunci soal kurang**: Pasal 77 ("wajib memberikan tanggapan") terambil di peringkat 1 tapi tidak ada di kunci |
| 40 biaya tidak dijelaskan, ngadu ke mana | **kunci kurang** (Pasal 45 peringkat 1) + soal berisi dua pertanyaan; bagian "ngadu ke mana" kalah |
| 38 sebar data, sanksi OJK & pidana | ayat sanksi yang lolos (bug, diperbaiki) lalu chunk magnet |
| 32 data kontak diambil tanpa izin | chunk magnet + jatah 3 parent (kunci di peringkat 7) |
| 35 izin dicabut, utang gimana | chunk magnet (POJK40:158); kunci di peringkat 10. Catatan: POJK40:96 pun **tidak menjawab nasib utang**, jadi jawabannya harus jujur "belum ada dasar yang tegas" + OJK 157 |

### 3.3 Uji 2 (setelah perbaikan bug sanksi, kueri sama dengan uji 1)

| K_CHILD / MAKS_UTAMA | Kena | MRR | Lintas ≥1 kena | **Lintas semua dok kena** | Rata-rata bahan |
|---|---|---|---|---|---|
| **8 / 3 (dipakai)** | 87,5% | 0,80 | 60% | **40%** | 1.287 kata |
| 12 / 3 | 87,5% | 0,80 | 60% | 40% | 1.287 kata |
| 8 / 4 | 87,5% | 0,80 | 60% | 40% | 1.603 kata |
| 16 / 5 | 90% | 0,81 | 70% | 40% | 1.904 kata |

Pelajaran:
1. Perbaikan bug sanksi benar, tapi skornya tidak naik, karena posisinya langsung diisi chunk magnet.
2. Menambah jatah pasal tidak sepadan (+1 soal dengan bahan +48%), jadi tetap 8/3.
3. **Ukuran ketat lintas dokumen hanya 40%.** Inilah kelemahan utama: user sering hanya mendapat separuh gambaran hukumnya.

### 3.4 Uji coba e5-small di Next.js/Vercel (13 Nov 2026)

| Tahap | Hasil |
|---|---|
| Node.js (laptop) | jalan; 384 dimensi; embed 3 teks 19 ms |
| Uji urutan (4 pertanyaan × 6 potongan parafrase, 2 pengecoh) | **peringkat 1 benar 4/4**, tetapi skor mepet (benar 0,837 / pasal lain 0,817 / resep rendang 0,797) → **ambang lama 0,80 hampir meloloskan pengecoh; kalibrasi ambang wajib dengan pasal asli** |
| Batch vs satu per satu | selisih maks. 0,0138 → keputusan #23 |
| Di dalam Next.js (laptop) | jalan; muat dari cache 1,5 dtk; embed 18–56 ms |
| Vercel preview (branch `spike/e5-vercel` di repo deploy, sementara) | jalan; **cold start 6,23 dtk** (termasuk unduh model); embed hangat 35 ms; fungsi berjalan di iad1 (Washington) |
| Indeks asli (13 Nov, `web/scripts/buat-indeks-puan.mjs`) | 4 dokumen, 248 pasal, 139 tautan, 833 potongan masuk pgvector; `cari_potongan` diuji langsung di SQL Editor (potongan sendiri skor 1,000) |
| Uji cari pertanyaan **mentah** "apakah penagih pinjol boleh menghubungi keluarga saya?" (tanpa tulis ulang) | 8 besar: 65.1, 60.1, 64.1, **62.2.a (peringkat 4)**, 34.2, 61.1, 66.2, 64.3; skor 0,813–0,819 (sangat mepet). Kunci ideal POJK22:62.2.c tidak di 8 besar; Pasal 62 menjadi parent ke-4 → **terpotong oleh batas 3 parent**. Perlu dibuktikan apakah tulis ulang + tautan menolongnya; uji 50 soal e5 menentukan apakah e5 dipertahankan atau kembali ke embedding Gemini |

Pengaturan wajib (ditemukan lewat simulasi build Vercel, lalu terbukti di preview):
- `serverExternalPackages: ["@huggingface/transformers"]` di `next.config.ts`.
- `outputFileTracingIncludes` untuk route Puan: `onnxruntime-common/**`, `onnxruntime-node/package.json`, `onnxruntime-node/dist/*.js`, dan biner Linux x64 (`libonnxruntime.so.1`, `onnxruntime_binding.node`). Transformers memuat onnxruntime-node lewat `createRequire`, yang tidak terlacak oleh Next.js.
- `web/.npmrc` berisi `onnxruntime-node-install=skip`, supaya `npm install` di Linux tidak mengunduh biner CUDA (ratusan MB).

Koneksi laptop (hotspot seluler) ke Supabase sesekali di-reset (ECONNRESET); skrip indeks memakai `fetch` dengan coba ulang maks. 3x (semua operasinya idempoten).

Catatan: fungsi berjalan di **iad1**. Bila Supabase berada di Singapura, pertimbangkan region fungsi `sin1` supaya kueri database Puan tidak bolak-balik ke AS.

### 3.5 Yang BELUM diuji

- [x] Versi **pecah huruf** vs biasa, diuji 8 Nov 2026 di laptop (Gemini, 8/3):
      biasa Kena 87,5% · MRR 0,78 · Lintas ≥1 60% · Lintas semua 40% · bahan 1.326 kata;
      pecah huruf Kena 90,0% · MRR 0,79 · Lintas ≥1 70% · Lintas semua 40% · bahan 1.260 kata.
      **Keputusan: pakai pecah huruf** (`knowledge_base_pecah.json`, 833 child dicari). Lebih baik di semua ukuran, bahan lebih ringkas;
      contoh nyata: "dc nagih ke kantor" kini menemukan POJK 22/2023 Pasal 62 ayat (2) huruf e.
- [x] e5-small diuji 50 soal (13 Nov): Kena 55% → **tidak dipakai**, kembali ke embedding Gemini (keputusan #25)
- [ ] Ulang uji 50 soal untuk **Gemini + pgvector** (`node scripts/evaluasi-puan.mjs`), harus menyamai 90% versi file numpy
- [ ] **Uji jawaban lengkap** 15 soal dengan system prompt versi baru (lihat bagian 4)
- [ ] Percakapan lanjutan dengan riwayat (fitur baru)

---

## 4. Perubahan di versi ini yang perlu ditinjau

Perubahan ini muncul dari temuan evaluasi, tapi **belum diuji** dengan jawaban Gemini sungguhan:

1. Aturan A–E dilebur ke bagian system prompt yang sesuai (sebelumnya ditempel di akhir).
2. **Aturan baru**, mohon dicek secara hukum:
   - sanksi administratif UU PDP dijatuhkan oleh **lembaga PDP, bukan OJK** (dari diagnosis soal 38);
   - pertanyaan keuangan non-pinjol (KUR, gadai) diarahkan ke bank/Pegadaian/OJK 157, **tanpa menyarankan pinjaman apa pun**;
   - "bahan bacaan bisa memuat pasal yang kurang relevan, pakai hanya yang menjawab".
3. Label sumber di bahan bacaan sekarang berbentuk `[SUMBER: SEOJK 19/2025 angka romawi VIII angka 1 | lokasi]`, supaya format sitasi SEOJK (aturan D) langsung ditiru.
4. Riwayat percakapan.

**Keputusan hukum yang tertunda (Izza, S.H.):**
- Kunci soal 12 ditambah `POJK22:77`, dan soal 40 ditambah `POJK22:45`? Bunyi pasalnya langsung menjawab soal, tapi mengoreksi kunci
  setelah melihat hasil harus dicatat terang-terangan agar skor tidak "dibagus-baguskan".
- Soal no. 49 ("bisa dipenjara gak kalau gak bayar pinjol?"): perilaku yang diharapkan perlu dicek secara hukum.

---

## 5. Keterbatasan yang jujur

1. **Soal uji dan kamus dibuat oleh pihak yang sama** (Claude), sehingga ada risiko soal ditulis dengan kata-kata yang memang dikenali kamus,
   dan skor 87,5% bisa lebih tinggi dari kenyataan. Saran: minta 1–2 anggota tim menulis 10 soal baru tanpa melihat kamus.
2. **40 soal itu kecil**: 1 soal = 2,5%. Selisih 87,5% dengan target 85% hanya 1 soal.
3. **Kena ≠ jawaban benar.** Pasal yang tepat bisa terambil tapi jawabannya tetap keliru. Itulah gunanya uji jawaban.
4. Tulis ulang oleh Gemini bisa sedikit berbeda antar-panggilan, walaupun suhunya 0.
5. **Kebaruan aturan**: angka bunga/denda dan UU PDP harus dicek ulang sebelum demo (lihat dokumen 04).
6. **Privasi**: Gemini tier gratis dapat memakai data untuk pengembangan Google. Curhat user itu sensitif.
7. e5 baru diuji secara teknis (jalan di Vercel, urutan 4/4 pada data kecil). Kualitas pencarian dengan 50 soal uji dan semua perubahan prompt versi ini belum diuji.
8. Saat server baru bangun, model e5 diunduh dari Hugging Face. Bila Hugging Face sedang gangguan, Puan gagal di permintaan itu (mitigasi: model ikut deploy, keputusan #24).

---

## 6. Pertanyaan juri yang mungkin muncul

**"Kenapa parent-child, bukan chunking biasa?"**
Pasal hukum panjang. Kalau dipotong per jumlah karakter, ayat terpotong di tengah. Kalau satu pasal jadi satu potongan, pencariannya kabur.
Child (ayat) dipakai untuk mencari dengan tepat, parent (pasal utuh) untuk menjawab dengan lengkap. Contohnya POJK 22 Pasal 62.

**"Kenapa pgvector dan e5-small?"**
pgvector adalah vector database di Supabase yang sudah kami pakai, jadi data pasal, embedding, dan aturan aksesnya (RLS) ada di satu tempat tanpa server tambahan.
e5-small adalah model open source multibahasa yang mendukung bahasa Indonesia dan cukup kecil untuk dijalankan langsung di server Next.js (embed ±35 ms).

**"Bagaimana kalian tahu jawabannya akurat?"**
Ada dua lapis. (1) Pencarian diuji dengan 50 soal berkunci pasal: 87,5% kena, angka 100% (embedding lama; diulang dengan e5). (2) Jawaban diuji manual oleh anggota tim
berlatar hukum, dengan kriteria utama **0 pasal/angka karangan**. Jawaban selalu menyebut dasar pasalnya, jadi bisa dicek siapa pun.

**"Kalau AI tidak tahu?"**
Ada tiga pengaman. Pertanyaan di luar topik ditolak di tahap tulis ulang. Kalau tidak ada pasal di atas ambang, Gemini diberi label
"TIDAK ADA pasal" dan wajib mengaku belum tahu lalu mengarahkan ke OJK 157 / LBH / polisi. System prompt juga melarang menjawab dari pengetahuan umum soal angka dan pasal.

**"Bagaimana dengan user yang sedang krisis?"**
Kata kunci krisis memicu aturan keselamatan: berhenti membahas aturan, fokus pada keselamatan, arahkan ke Healing119.
API mengirim `krisis: true` supaya web bisa menampilkan kartu bantuan.

**"Kenapa tidak langsung pakai ChatGPT/Gemini biasa?"**
Model umum bisa memberi angka bunga yang sudah kedaluwarsa atau pasal yang tidak ada, dengan nada yakin. Kami mengikat jawaban pada teks peraturan resmi.

**"Apa kelemahannya?"**
Soal lintas dokumen baru 40% lengkap, dan soal uji dibuat internal. Ambang e5 masih harus dikalibrasi, dan kami ingin menambah soal uji dari pengguna nyata.

**"Data user aman?"**
Server tidak menyimpan percakapan (riwayat dikirim dari browser). Untuk produksi, tier berbayar Gemini dan Kebijakan Privasi yang menyebut pemrosesan pihak ketiga.
