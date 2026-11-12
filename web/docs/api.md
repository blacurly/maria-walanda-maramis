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

Data uji sudah dihapus; database kembali ke 524 pinjol.