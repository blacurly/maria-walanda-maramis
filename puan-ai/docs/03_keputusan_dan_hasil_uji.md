# 03 — Keputusan Desain & Hasil Uji

Catatan **kenapa** Puan AI dibangun seperti ini, apa buktinya, dan apa yang belum beres.
Bagian 5 berisi pertanyaan yang kemungkinan besar ditanyakan juri/mentor beserta jawabannya.

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
| 11 | Embedding `gemini-embedding-001` (768 dimensi), **ambang 0,60** | teks tak berkaitan ≈ 0,52; resep nasi goreng 0,543 (tertolak). Selisihnya tipis, jadi penolakan topik terutama mengandalkan `DI_LUAR_TOPIK` dari tulis ulang | — (e5 sekarang didukung sebagai pembanding, lihat #19) |
| 12 | 8 child → maks. 3 parent utama + 2 tambahan | uji 2: menambah jatah tidak menaikkan skor (lihat 3.3), tapi bahan bacaan +25–48% | 4–5 parent utama |
| 13 | Jawab: `gemini-3.6-flash` suhu 0,4; tulis ulang: `gemini-3.1-flash-lite` suhu 0 | tulis ulang harus konsisten; jawaban boleh sedikit luwes agar hangat | — |
| 14 | System prompt dengan aturan **A–E** hasil evaluasi uji coba pertama | uji jawaban pertama: curhat malah dijawab daftar aturan; soal waris menambahkan klaim asuransi "wajib" yang tidak akurat + mengutip Pasal 144 yang tidak relevan; format "SEOJK Bab VIII" keliru | — |
| 15 | Coba ulang + model cadangan saat Gemini 503/429 | error 503 benar-benar terjadi saat uji | gagal langsung |
| 16 | Kata kunci krisis → aturan keselamatan + Healing119 (119 ext 8) | curhat pinjol bisa menyentuh keputusasaan; keselamatan di atas segalanya | — |
| 17 | **Riwayat percakapan** (6 pesan terakhir; tulis ulang memakai 2 pesan user terakhir) | pertanyaan lanjutan "terus aku harus gimana?" tidak bisa dipahami tanpa konteks | stateless total |
| 18 | Indeks disimpan sebagai **file** dan dimuat ke memori FastAPI; Supabase pgvector opsional | 694 vektor dicari < 1 milidetik; lebih sedikit bagian yang bisa rusak | langsung pgvector (lebih rumit, belum perlu) |
| 19 | **Dukungan dua model embedding** (Gemini & multilingual-e5-small) | arsitektur tim menyebut e5; perlu dibandingkan dengan data, bukan asumsi | memilih salah satu tanpa uji |
| 20 | **Opsi pecah daftar panjang per huruf** (≥80 kata & ≥5 butir), diputuskan lewat evaluasi | uji 2 menemukan "chunk magnet": POJK40:144(2) dan POJK40:158 muncul di banyak soal yang tidak relevan | menambal 2 pasal saja (itu sama dengan "menyontek kunci jawaban") |

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

Catatan dari dokumen asli: SEOJK XX angka 9 merujuk "angka 7", kemungkinan salah ketik di dokumen OJK (maksudnya angka 8).

---

## 3. Hasil uji

**Alat uji:** 50 soal (`data/referensi/soal_uji_puan_ai.xlsx`): 12 curhat santai, 9 bahasa hukum, 9 angka, 10 lintas dokumen,
10 di luar cakupan (5 di luar topik + 5 topik keuangan yang tidak dicakup 4 dokumen). Setiap kunci pasal sudah dicek ada di knowledge base.

**Ukuran:**
- **Kena**: minimal satu pasal kunci ikut terambil. Target ≥ 85%.
- **MRR** (*Mean Reciprocal Rank*, "rata-rata kebalikan peringkat"): 1,00 berarti kunci selalu di urutan pertama.

### 3.1 Uji 1 (pencarian)

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

### 3.4 Yang BELUM diuji (harus dijalankan di Colab, notebook bagian D–E)

- [ ] Versi **pecah huruf** vs biasa (`evaluasi.py --pecah 0 1`)
- [ ] **e5** vs Gemini, termasuk kalibrasi ambang e5 (ambang 0,80 di config masih tebakan sementara)
- [ ] **Uji jawaban lengkap** 15 soal (`uji_jawaban.py`) dengan system prompt versi baru (lihat bagian 4)
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
3. **Kena ≠ jawaban benar.** Pasal yang tepat bisa terambil tapi jawabannya tetap keliru. Itulah gunanya `uji_jawaban.py`.
4. Tulis ulang oleh Gemini bisa sedikit berbeda antar-panggilan, walaupun suhunya 0.
5. **Kebaruan aturan**: angka bunga/denda dan UU PDP harus dicek ulang sebelum demo (lihat dokumen 04).
6. **Privasi**: Gemini tier gratis dapat memakai data untuk pengembangan Google. Curhat user itu sensitif.
7. Embedder e5 dan semua perubahan prompt versi ini belum diuji.

---

## 6. Pertanyaan juri yang mungkin muncul

**"Kenapa parent-child, bukan chunking biasa?"**
Pasal hukum panjang. Kalau dipotong per jumlah karakter, ayat terpotong di tengah. Kalau satu pasal jadi satu potongan, pencariannya kabur.
Child (ayat) dipakai untuk mencari dengan tepat, parent (pasal utuh) untuk menjawab dengan lengkap. Contohnya POJK 22 Pasal 62.

**"Bagaimana kalian tahu jawabannya akurat?"**
Ada dua lapis. (1) Pencarian diuji dengan 50 soal berkunci pasal: 87,5% kena, angka 100%. (2) Jawaban diuji manual oleh anggota tim
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
Soal lintas dokumen baru 40% lengkap, dan soal uji dibuat internal. Kami sedang menguji pemecahan daftar panjang dan model e5,
dan ingin menambah soal uji dari pengguna nyata.

**"Data user aman?"**
Server tidak menyimpan percakapan (riwayat dikirim dari browser). Untuk produksi, tier berbayar Gemini dan Kebijakan Privasi yang menyebut pemrosesan pihak ketiga.
