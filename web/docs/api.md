# Dokumentasi API EduPuan

Semua endpoint berada di `web/src/app/api/` (Next.js Route Handlers).
Logika bisnis dan akses data ada di `web/src/lib/` (route hanya mengatur alur).

- **Alamat dasar (laptop):** `http://localhost:3000`
- **Format kiriman & balasan:** JSON (`Content-Type: application/json`)
- **Database:** Supabase (lihat [ERD](./erd.md))

## Daftar endpoint

| Metode | Alamat | Fungsi | Akses | Batas permintaan |
|---|---|---|---|---|
| POST | `/api/chat` | Bertanya ke Puan AI | Publik | 20 / 10 menit |
| POST | `/api/umpan-balik` | Menilai jawaban Puan (membantu / belum) | Publik | 30 / 10 menit |
| GET | `/api/pinjol` | Daftar pinjol + cari + filter + halaman | Publik | 120 / 10 menit |
| GET | `/api/pinjol/cek` | Cek legalitas satu nama aplikasi | Publik | 120 / 10 menit |
| GET | `/api/pinjol/:id` | Detail satu pinjol | Publik | 120 / 10 menit |
| POST | `/api/pinjol` | Tambah pinjol | 🔑 Admin | 60 / 10 menit |
| PATCH | `/api/pinjol/:id` | Ubah sebagian data pinjol | 🔑 Admin | 60 / 10 menit |
| DELETE | `/api/pinjol/:id` | Hapus pinjol | 🔑 Admin | 60 / 10 menit |
| GET | `/api/artikel` | Daftar artikel terbit + filter kategori + cari + halaman | Publik | 120 / 10 menit |
| GET | `/api/artikel/:slug` | Satu artikel lengkap | Publik | 120 / 10 menit |
| POST | `/api/artikel` | Tambah artikel (bawaan: draf) | 🔑 Admin | 60 / 10 menit |
| PATCH | `/api/artikel/:slug` | Ubah sebagian / terbitkan artikel | 🔑 Admin | 60 / 10 menit |
| DELETE | `/api/artikel/:slug` | Hapus artikel beserta rujukannya | 🔑 Admin | 60 / 10 menit |
| GET | `/api/darurat` | Situasi darurat + kontak bantuannya | Publik | 120 / 10 menit |
| GET | `/api/lembaga` | Daftar lembaga bantuan + filter jenis + cari + halaman | Publik | 120 / 10 menit |
| GET | `/api/lembaga/:id` | Detail satu lembaga | Publik | 120 / 10 menit |
| POST | `/api/lembaga` | Tambah lembaga (+ situasinya) | 🔑 Admin | 60 / 10 menit |
| PATCH | `/api/lembaga/:id` | Ubah sebagian / nonaktifkan lembaga | 🔑 Admin | 60 / 10 menit |
| DELETE | `/api/lembaga/:id` | Hapus lembaga | 🔑 Admin | 60 / 10 menit |

Batas permintaan dihitung per alamat IP (disimpan sebagai *hash*, bukan IP asli) di tabel
`pembatas_permintaan`. Pengaturannya ada di `web/src/lib/api/pembatas.ts`.

## Aturan umum

### Kunci admin (🔑)

Endpoint tulis (tambah, ubah, hapus) wajib membawa header:

```
X-Admin-Key: <nilai ADMIN_API_KEY di server>
```

Tanpa kunci atau kunci salah → `401 TIDAK_DIIZINKAN`. EduPuan tidak memakai login;
pengunjung hanya bisa **membaca**. Kunci disimpan di `.env.local` (laptop) dan Environment Variables Vercel,
tidak pernah di repository.

### Format balasan berhasil

```json
{ "ok": true, ... }
```

### Format balasan error (sama untuk SEMUA endpoint)

```json
{
  "ok": false,
  "kode": "DATA_TIDAK_VALID",
  "detail": "Pesan yang jelas dalam bahasa Indonesia, siap ditampilkan ke pengguna."
}
```

| Status | Kode | Kapan terjadi |
|---|---|---|
| 400 | `FORMAT_TIDAK_DIKENALI` | Isi kiriman bukan JSON objek yang benar |
| 401 | `TIDAK_DIIZINKAN` | Endpoint 🔑 tanpa kunci admin / kunci salah |
| 404 | `TIDAK_DITEMUKAN` | Data dengan id tersebut tidak ada |
| 409 | `DATA_SUDAH_ADA` | Data yang sama sudah ada (misalnya nama + status pinjol) |
| 422 | `DATA_TIDAK_VALID` | Format benar, tetapi isinya tidak memenuhi aturan |
| 429 | `TERLALU_SERING` | Melewati batas permintaan. Ada header `Retry-After` (detik) |
| 500 | `LAYANAN_BELUM_SIAP` | Pengaturan server belum lengkap (environment variable kosong) |
| 502 | `GANGGUAN_LAYANAN` | Layanan di belakang (Supabase / Puan AI) membalas error |
| 503 | `LAYANAN_SIBUK` | Layanan di belakang tidak bisa dihubungi / sedang sibuk |
| 504 | `WAKTU_HABIS` | Layanan di belakang terlalu lama menjawab |

Daftar kode resmi: `web/src/lib/api/galat.ts`.

---

## Puan AI

### POST `/api/chat`

Mengirim pertanyaan ke Puan AI (RAG berbasis pasal POJK/SEOJK/UU). Batas waktu menunggu: 45 detik.

**Kiriman**

| Kolom | Tipe | Wajib | Aturan |
|---|---|---|---|
| `pesan` | string | ya | Tidak kosong, maksimal 2000 huruf |
| `riwayat` | array | tidak | Percakapan sebelumnya: `[{ "peran": "user" \| "puan", "teks": "..." }]`. Hanya 20 terakhir yang dipakai |

```json
{
  "pesan": "Apakah penagih boleh menghubungi keluargaku?",
  "riwayat": []
}
```

**Balasan 200**

```json
{
  "ok": true,
  "jawaban": "Tidak boleh. Menurut POJK 22/2023 Pasal 62 ...",
  "status": "pasal",
  "krisis": false,
  "topik": "penagihan",
  "situasi": "menghubungi_orang_lain"
}
```

| Kolom | Arti |
|---|---|
| `jawaban` | Teks jawaban Puan |
| `status` | `pasal` (dijawab dari pasal), `tidak_ada_pasal`, `butuh_dana`, atau `di_luar_topik` |
| `krisis` | `true` kalau pesan menunjukkan kondisi darurat (tampilan menampilkan kontak bantuan) |
| `topik`, `situasi` | Label anonim untuk statistik dan umpan balik |

**Error:** 400, 422 (pesan kosong / terlalu panjang), 429, 500, 502 (termasuk jawaban kosong), 503, 504.

### POST `/api/umpan-balik`

Menyimpan penilaian anonim "Apakah jawaban ini membantu?". Tidak menyimpan isi pertanyaan atau jawaban.

**Kiriman**

| Kolom | Tipe | Wajib | Aturan |
|---|---|---|---|
| `nilai` | number | ya | `1` (membantu) atau `-1` (belum membantu) |
| `topik` | string | ya | Huruf kecil dan `_`, maksimal 40 huruf |
| `situasi` | string | ya | Huruf kecil dan `_`, maksimal 40 huruf |
| `status` | string | ya | `pasal`, `butuh_dana`, `di_luar_topik`, atau `tidak_ada_pasal` |

```json
{ "nilai": 1, "topik": "penagihan", "situasi": "menghubungi_orang_lain", "status": "pasal" }
```

**Balasan 200**

```json
{ "ok": true }
```

**Error:** 400, 422, 429, 500, 502, 503, 504.

---

## Pinjol

Data pinjol berizin (OJK) dan ilegal (Satgas PASTI). Tabel: `pinjol` + `sumber_data`.

**Objek pinjol** (dipakai di beberapa balasan di bawah):

```json
{
  "id": 124,
  "nama": "Cash Aku - pinjaman kredit uang",
  "nama_perusahaan": null,
  "status": "ilegal",
  "alamat": "https://...",
  "diperbarui_pada": "2026-11-07",
  "sumber": {
    "id": 2,
    "nama": "Satgas PASTI, Lampiran Siaran Pers periode April 2026",
    "penerbit": "Satgas PASTI"
  }
}
```

> ⚠️ `alamat` pinjol **ilegal** berisi lokasi aplikasi ilegal ditemukan. Tampilan **tidak boleh** menjadikannya tautan yang bisa diklik.

### GET `/api/pinjol`

Daftar pinjol. Pencarian, filter, dan pembagian halaman dilakukan **di server**.

**Parameter alamat**

| Parameter | Wajib | Aturan | Bawaan |
|---|---|---|---|
| `q` | tidak | Kata dicari di nama aplikasi **atau** nama perusahaan, maksimal 100 huruf | (semua) |
| `status` | tidak | `legal` atau `ilegal` | (semua) |
| `halaman` | tidak | Bilangan bulat ≥ 1 | `1` |
| `per_halaman` | tidak | 1–100 | `20` |

Contoh: `GET /api/pinjol?q=kredit&status=ilegal&halaman=1&per_halaman=3`

**Balasan 200**

```json
{
  "ok": true,
  "data": [ { "id": 124, "nama": "Cash Aku - pinjaman kredit uang", "...": "objek pinjol" } ],
  "halaman": 1,
  "per_halaman": 3,
  "total": 63,
  "total_halaman": 21
}
```

**Error:** 422 (status / halaman / per_halaman tidak valid, `q` terlalu panjang), 429, 502.

### GET `/api/pinjol/cek`

Mencocokkan nama aplikasi dengan daftar OJK dan Satgas PASTI. Dipakai halaman **Cek Legalitas**.
Kalau database tidak bisa dihubungi, server memakai data cadangan (`dariDatabase: false`).

**Parameter alamat**

| Parameter | Wajib | Aturan |
|---|---|---|
| `nama` | ya | 2–100 huruf |

Contoh: `GET /api/pinjol/cek?nama=Kredit%20Pintar`

**Balasan 200**

```json
{
  "ok": true,
  "hasil": {
    "status": "legal",
    "data": {
      "nama": "Kredit Pintar",
      "nama_perusahaan": "PT Kredit Pintar Indonesia",
      "status": "legal",
      "alamat": "https://www.kreditpintar.com/",
      "sumber": "OJK, Direktori LPBBTI Juli 2026"
    },
    "tiruan": null
  },
  "saran": [ { "nama": "Kredit Pintar", "...": "..." } ],
  "dariDatabase": true
}
```

| `hasil.status` | Arti | Isi tambahan |
|---|---|---|
| `legal` | Cocok persis dengan pinjol berizin OJK | `data`, `tiruan` (aplikasi ilegal yang meniru namanya, atau `null`) |
| `ilegal` | Tercatat di daftar Satgas PASTI | `data` |
| `mirip` | Hanya mirip nama berizin — **bukan** jaminan legal | `data` (nama berizin yang mirip) |
| `tidak-ditemukan` | Tidak ada di kedua daftar — **bukan** berarti legal | — |

`saran`: maksimal 5 nama berizin + 3 nama ilegal yang memuat kata yang diketik.

**Error:** 422 (kurang dari 2 atau lebih dari 100 huruf), 429.

### GET `/api/pinjol/:id`

Contoh: `GET /api/pinjol/124`

**Balasan 200**

```json
{ "ok": true, "data": { "id": 124, "...": "objek pinjol" } }
```

**Error:** 422 (`id` bukan bilangan bulat positif), 404, 429, 502.

### POST `/api/pinjol` 🔑

**Kiriman**

| Kolom | Tipe | Wajib | Aturan |
|---|---|---|---|
| `nama` | string | ya | 1–120 huruf |
| `status` | string | ya | `legal` atau `ilegal` |
| `sumber_id` | number | ya | id di tabel `sumber_data` (1 = OJK, 2 = Satgas PASTI) |
| `nama_perusahaan` | string / null | tidak | Maksimal 200 huruf |
| `alamat` | string / null | tidak | Maksimal 300 huruf |
| `diperbarui_pada` | string | tidak | Tanggal `YYYY-MM-DD` (bawaan: hari ini, zona waktu UTC) |

Kolom lain ditolak (`422 Kolom tidak dikenal`).

```json
{ "nama": "UJI COBA EduPuan", "status": "ilegal", "sumber_id": 2 }
```

**Balasan 201**

```json
{ "ok": true, "data": { "id": 526, "nama": "UJI COBA EduPuan", "...": "objek pinjol" } }
```

**Error:** 401, 400, 422 (kolom wajib kosong / tidak valid / `sumber_id` tidak ada), 409 (nama + status sudah ada), 429, 500, 502.

### PATCH `/api/pinjol/:id` 🔑

Mengubah **sebagian** kolom. Kirim hanya kolom yang ingin diubah (aturan sama dengan POST).

```json
{ "nama_perusahaan": "PT Uji Coba (data sementara)" }
```

**Balasan 200**

```json
{ "ok": true, "data": { "id": 526, "nama_perusahaan": "PT Uji Coba (data sementara)", "...": "objek pinjol" } }
```

**Error:** 401, 400, 422 (tidak ada kolom yang diubah / isi tidak valid), 404, 409, 429, 500, 502.

### DELETE `/api/pinjol/:id` 🔑

**Balasan 200**

```json
{ "ok": true }
```

**Error:** 401, 422, 404 (sudah dihapus / tidak pernah ada), 429, 500, 502.

---

## Artikel edukasi

Tabel: `artikel` + `kategori_artikel` + `rujukan_artikel`. Halaman `/`, `/edukasi`, dan `/edukasi/:slug`
membaca dari tabel ini (cadangan: `data/artikel.ts`). Setelah tambah/ubah/hapus lewat API, halaman langsung diperbarui.

**Objek artikel** (bentuknya sama dengan yang dipakai tampilan):

```json
{
  "slug": "cara-lapor-pinjol",
  "judul": "Cara melapor pinjol: ke mana dan apa yang perlu disiapkan",
  "ringkasan": "...",
  "topik": "hak-hukum",
  "topikLabel": "Hak & Hukum",
  "kategori": "Panduan",
  "menit": 4,
  "gambar": "https://images.unsplash.com/...",
  "diperbarui": "November 2026",
  "bagian": [ { "judul": "Siapkan bukti lebih dulu", "daftar": ["..."] } ],
  "catatan": "...",
  "fitur": { "label": "Susun laporan kronologimu", "href": "/sudah-terjerat/dokumentasi-lapor" },
  "dasarHukum": ["POJK 22/2023 ..."],
  "sumber": [ { "label": "OJK – ...", "url": "https://..." } ]
}
```

Di endpoint **daftar**, `bagian`, `catatan`, `fitur`, `dasarHukum`, dan `sumber` tidak ikut (supaya ringan).

### GET `/api/artikel`

| Parameter | Wajib | Aturan | Bawaan |
|---|---|---|---|
| `kategori` | tidak | Kode kategori: `pinjaman`, `hak-hukum`, `penagihan` | (semua) |
| `q` | tidak | Dicari di judul **atau** ringkasan, maksimal 100 huruf | (semua) |
| `halaman` | tidak | Bilangan bulat ≥ 1 | `1` |
| `per_halaman` | tidak | 1–50 | `10` |

Hanya artikel yang **sudah terbit**. Balasan 200: `{ ok, data: [objek artikel], halaman, per_halaman, total, total_halaman }`.
**Error:** 422, 429, 502.

### GET `/api/artikel/:slug`

Balasan 200: `{ "ok": true, "data": { objek artikel lengkap } }`.
**Error:** 422 (slug tidak valid), 404 (tidak ada atau masih draf), 429, 502.

### POST `/api/artikel` 🔑

| Kolom | Tipe | Wajib | Aturan |
|---|---|---|---|
| `slug` | string | ya | Huruf kecil, angka, tanda hubung; maks. 80. **Tidak bisa diubah** setelah dibuat |
| `judul` | string | ya | Maks. 150 huruf |
| `ringkasan` | string | ya | Maks. 300 huruf |
| `kategori` | string | ya | Kode kategori yang ada |
| `menit_baca` | number | ya | 1–60 |
| `gambar_url` | string | ya | `https://images.unsplash.com/...` (host yang diizinkan `next.config.ts`) |
| `isi` | array | ya | 1–20 bagian: `{ "judul": "...", "paragraf": ["..."], "daftar": ["..."] }` (minimal salah satu) |
| `bentuk` | string | tidak | `artikel` (bawaan) atau `panduan` |
| `catatan` | string / null | tidak | Maks. 500 huruf |
| `fitur` | objek / null | tidak | `{ "label": "...", "tautan": "/halaman-edupuan" }` |
| `rujukan` | objek | tidak | `{ "dasar_hukum": ["..."], "sumber": [ { "teks": "...", "tautan": "https://..." } ] }`, maks. 20 |
| `terbit` | boolean | tidak | `true` = langsung tampil. **Bawaan: draf** (tidak terlihat publik) |

Balasan **201**: `{ ok, data: objek artikel }`.
**Error:** 401, 400, 422, 409 (slug sudah dipakai), 429, 500, 502.

### PATCH `/api/artikel/:slug` 🔑

Kirim hanya kolom yang diubah (aturan sama dengan POST, kecuali `slug`). `"terbit": true` menerbitkan draf,
`"terbit": false` menyembunyikan artikel. Kalau `rujukan` dikirim, seluruh rujukan lama **diganti**.

Balasan 200: `{ ok, data: objek artikel }`. **Error:** 401, 400, 422, 404, 409, 429, 500, 502.

### DELETE `/api/artikel/:slug` 🔑

Rujukannya ikut terhapus (ON DELETE CASCADE). Balasan 200: `{ "ok": true }`. **Error:** 401, 422, 404, 429, 500, 502.

---

## Bantuan darurat & lembaga

Tabel: `situasi_darurat` + `lembaga` + `jenis_lembaga` + `lembaga_situasi`. Halaman `/darurat` membaca dari tabel ini
(cadangan: `data/kontakDarurat.ts`). Tombol darurat di bagian atas (110, 112, WA SAPA) sengaja tetap di kode karena isinya tetap.

### GET `/api/darurat`

Situasi darurat beserta kontaknya, sudah urut. Hanya situasi dan lembaga yang **aktif**.

```json
{
  "ok": true,
  "data": [
    {
      "id": "kbgo",
      "ikon": "📵",
      "pilihan": "Ancaman sebar foto atau pelecehan online (KBGO)",
      "judul": "Ancaman sebar foto / pelecehan online",
      "info": "Jangan hapus pesan atau foto sebagai bukti. ...",
      "kontak": [
        { "label": "SAPA 129 — Telepon", "nomor": "129", "href": "tel:129", "warna": "bg-purple-600" },
        { "label": "Polisi Unit Siber", "nomor": "110", "href": "tel:110", "warna": "bg-red-600" }
      ]
    }
  ],
  "dariDatabase": true
}
```

`warna` adalah urusan tampilan: tidak disimpan di database, ditentukan dari jenis lembaga + kanal.
**Error:** 429.

**Objek lembaga:**

```json
{
  "id": 1,
  "nama": "Polisi 110",
  "penyelenggara": "Kepolisian Negara Republik Indonesia",
  "kanal": "telepon",
  "nomor": "110",
  "tautan": "tel:110",
  "aktif": true,
  "jenis": { "kode": "kepolisian", "label": "Kepolisian" },
  "situasi": [ { "kode": "kbgo", "urutan": 3, "label_khusus": "Polisi Unit Siber" } ]
}
```

### GET `/api/lembaga`

| Parameter | Wajib | Aturan | Bawaan |
|---|---|---|---|
| `jenis` | tidak | `kepolisian`, `layanan-perempuan`, `kesehatan-jiwa`, `darurat` | (semua) |
| `q` | tidak | Dicari di nama **atau** penyelenggara, maksimal 100 huruf | (semua) |
| `halaman` | tidak | Bilangan bulat ≥ 1 | `1` |
| `per_halaman` | tidak | 1–100 | `20` |

Balasan 200: `{ ok, data: [objek lembaga], halaman, per_halaman, total, total_halaman }`. **Error:** 422, 429, 502.

### GET `/api/lembaga/:id`

Balasan 200: `{ ok, data: objek lembaga }`. **Error:** 422, 404 (tidak ada atau nonaktif), 429, 502.

### POST `/api/lembaga` 🔑

| Kolom | Tipe | Wajib | Aturan |
|---|---|---|---|
| `nama` | string | ya | Unik, maks. 100 huruf |
| `jenis` | string | ya | Kode jenis lembaga yang ada |
| `kanal` | string | ya | `telepon`, `whatsapp`, atau `situs` |
| `nomor` | string | ya | Yang ditampilkan, maks. 40 huruf (mis. `08111-129-129`) |
| `tautan` | string | ya | `tel:<angka>` untuk telepon; `https://...` untuk whatsapp/situs |
| `penyelenggara` | string / null | tidak | Maks. 150 huruf |
| `aktif` | boolean | tidak | Bawaan `true` |
| `situasi` | array | tidak | `[ { "kode": "kbgo", "urutan": 4, "label_khusus": "..." } ]` — di situasi mana lembaga ini muncul |

Balasan **201**: `{ ok, data: objek lembaga }`. **Error:** 401, 400, 422 (termasuk kanal-tautan tidak cocok, situasi tidak ada), 409 (nama sudah ada), 429, 500, 502.

### PATCH `/api/lembaga/:id` 🔑

Kirim hanya kolom yang diubah. `"aktif": false` menyembunyikan lembaga dari halaman Darurat tanpa menghapusnya.
Kalau `situasi` dikirim, seluruh pasangan situasi lama **diganti**.

Balasan 200: `{ ok, data: objek lembaga }`. **Error:** 401, 400, 422, 404, 409, 429, 500, 502.

### DELETE `/api/lembaga/:id` 🔑

Pasangan situasinya ikut terhapus (ON DELETE CASCADE). Balasan 200: `{ "ok": true }`. **Error:** 401, 422, 404, 429, 500, 502.

---

## Hasil uji (Thunder Client, 13 Nov 2026)

| Permintaan | Status | Hasil |
|---|---|---|
| `GET /api/pinjol?q=kredit&per_halaman=3` | 200 | 3 data, `total` 63, `total_halaman` 21 |
| `GET /api/pinjol/cek?nama=Kredit Pintar` | 200 | `legal`, PT Kredit Pintar Indonesia |
| `GET /api/pinjol/124` | 200 | Detail Cash Aku |
| `GET /api/pinjol/abc` | 422 | `DATA_TIDAK_VALID` |
| `POST /api/pinjol` tanpa kunci | 401 | `TIDAK_DIIZINKAN` |
| `POST /api/pinjol` dengan kunci | 201 | Data uji id 526 dibuat |
| `POST /api/pinjol` data sama | 409 | `DATA_SUDAH_ADA` |
| `PATCH /api/pinjol/526` | 200 | Hanya `nama_perusahaan` berubah |
| `DELETE /api/pinjol/526` | 200 | Terhapus |
| `DELETE /api/pinjol/526` (ulang) | 404 | `TIDAK_DITEMUKAN` |
| `GET /api/pinjol/526` | 404 | `TIDAK_DITEMUKAN` |
| `POST /api/artikel` tanpa kunci | 401 | `TIDAK_DIIZINKAN` |
| `POST /api/artikel` dengan kunci | 201 | Artikel `uji-artikel` dibuat sebagai **draf** |
| `GET /api/artikel/uji-artikel` (draf) | 404 | Disembunyikan RLS dari publik |
| `PATCH /api/artikel/uji-artikel` `{ "terbit": true }` | 200 | Langsung tampil di `/edukasi` (kartu ke-7) |
| `GET /api/artikel/uji-artikel` (terbit) | 200 | Artikel lengkap + dasar hukum + sumber |
| `DELETE /api/artikel/uji-artikel` | 200 | Hilang dari `/edukasi`; rujukan ikut terhapus |
| `POST /api/lembaga` + situasi `kbgo` | 201 | Tombol baru muncul di `/darurat` → KBGO |
| `GET /api/lembaga?q=uji` | 200 | 1 hasil (pencarian di server) |
| `PATCH /api/lembaga/<id>` (bukan angka) | 422 | `DATA_TIDAK_VALID` |
| `PATCH /api/lembaga/8` `{ "aktif": false }` | 200 | Tombol hilang dari `/darurat` |
| `DELETE /api/lembaga/8` | 200 | Terhapus beserta pasangan situasinya |

Semua data uji sudah dihapus; database kembali ke 524 pinjol, 6 artikel, dan 6 lembaga.

**Temuan saat uji:** tanggal terbit artikel semula diambil dari jam komputer yang menjalankan Next.js.
Di laptop dengan zona waktu Windows yang salah, artikel tercatat "terbit di masa depan" sehingga disembunyikan RLS.
Diperbaiki: tanggal terbit kini diisi oleh database (`"now"`), sehingga tidak bergantung pada jam komputer.