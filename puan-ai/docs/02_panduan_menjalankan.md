# 02 — Panduan Menjalankan Puan AI

Tiga cara, dari yang paling mudah:
**A. Google Colab** (membangun data & evaluasi) → **B. Komputer sendiri** (mengembangkan) → **C. Server FastAPI** (dipakai web).

---

## A. Google Colab (disarankan untuk membangun data dan evaluasi)

1. Unggah `puan-ai.zip` ke Google Drive, ke folder `MyDrive/edupuan-rag/` (folder yang sama dengan notebook lama, supaya
   embedding lama di `edupuan-rag/output/` bisa dipakai ulang).
2. Buka `puan-ai/notebooks/puan_ai_pipeline.ipynb` di Colab. Sel pertama akan membongkar zip-nya kalau belum dibongkar.
3. Pastikan **Secrets** (ikon kunci 🔑) berisi `GEMINI_API_KEY` dengan "Akses notebook" aktif.
4. Jalankan sel dari atas ke bawah. Setiap sel menjelaskan apa yang dilakukan, tujuannya, dan hasil yang benar.

Urutan minimal setelah Colab di-restart: **A1 → A2 → C1** (knowledge base dan indeks sudah tersimpan di Drive, jadi tidak perlu dibuat ulang).

---

## B. Komputer sendiri

```bash
cd puan-ai
python -m venv .venv
# Windows: .venv\Scripts\activate     |  Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt pytest
copy .env.example .env      # Mac/Linux: cp .env.example .env   → lalu isi GEMINI_API_KEY

python -m pytest tests -q                       # 7 passed (tanpa kuota)
python scripts/bangun_kb.py                     # knowledge base
python scripts/buat_indeks.py --model gemini    # indeks (±7 menit kalau tanpa --impor-lama)
python scripts/tanya.py --detail "dc nagih ke kantor aku, boleh gak?"
python scripts/tanya.py                         # mode ngobrol, ketik 'keluar' untuk berhenti
```

Semua script dan API otomatis membaca file `.env` di folder `puan-ai/`.

---

## C. Menjalankan API (FastAPI)

```bash
uvicorn api.main:app --reload --port 8000
```

- Buka **http://localhost:8000/docs** untuk mencoba langsung dari browser (tombol "Try it out").
- Cek kesehatan: **http://localhost:8000/health** harus berisi `"status": "ok"`. Kalau `"gagal"`, alasannya tertulis di `galat`
  (biasanya knowledge base atau indeks belum dibuat).

Contoh permintaan dan respons `POST /chat`:

```json
// permintaan
{ "pesan": "terus aku harus lapor ke mana?",
  "riwayat": [ {"peran": "user", "teks": "dc nyebarin data utang aku ke semua kontak"},
               {"peran": "puan", "teks": "Itu pasti bikin kamu malu dan takut banget..."} ] }

// respons
{ "jawaban": "....",
  "status": "pasal",                     // "pasal" | "di_luar_topik" | "tidak_ada_pasal"
  "krisis": false,                       // true -> tampilkan info Healing119 di web
  "sumber": [ {"id": "POJK22:62", "label": "POJK 22/2023 Pasal 62", "peran": "utama"}, ... ] }
```

Kode error: `401` kunci salah · `422` pesan kosong/terlalu panjang (maks. 2.000 karakter, riwayat maks. 20 pesan) ·
`503` Gemini sibuk atau Puan AI belum siap · `500` gangguan lain. Semua pesan error sudah dalam bahasa Indonesia yang ramah.

---

## D. Menghubungkan ke web Next.js

**Prinsip:** browser memanggil Route Handler Next.js, lalu Next.js memanggil FastAPI dengan kunci rahasia. Kunci tidak pernah sampai ke browser.

**1. `web/.env.local`** (jangan di-commit):
```
PUAN_API_URL=http://localhost:8000
PUAN_API_KEY=isi-sama-dengan-PUAN_API_KEY-di-server-FastAPI
```

**2. `web/app/api/chat/route.ts`** (backend Next.js, jalan di server):
```ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { pesan, riwayat = [] } = await req.json();
  if (typeof pesan !== 'string' || !pesan.trim()) {
    return NextResponse.json({ detail: 'Pesan tidak boleh kosong.' }, { status: 422 });
  }
  try {
    const r = await fetch(`${process.env.PUAN_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Puan-Key': process.env.PUAN_API_KEY ?? '' },
      body: JSON.stringify({ pesan, riwayat: riwayat.slice(-20) }),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch {
    return NextResponse.json({ detail: 'Puan AI belum bisa dihubungi. Coba lagi sebentar lagi ya.' }, { status: 503 });
  }
}
```

**3. Di komponen halaman chat** (frontend, `'use client'`), simpan riwayat di state lalu kirim setiap pesan:
```ts
type Pesan = { peran: 'user' | 'puan'; teks: string };

async function kirim(pesan: string, riwayat: Pesan[]) {
  const r = await fetch('/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pesan, riwayat }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail);
  return data as { jawaban: string; status: string; krisis: boolean; sumber: { id: string; label: string }[] };
}
// setelah dapat jawaban: setRiwayat([...riwayat, {peran:'user', teks: pesan}, {peran:'puan', teks: data.jawaban}])
// kalau data.krisis === true: tampilkan kartu Healing119 (119 ekstensi 8) di atas jawaban
```

Ini contoh minimal. Bentuk UI-nya mengikuti desain halaman chat EduPuan.

---

## E. Catatan deploy (untuk tim)

- Server FastAPI butuh folder `output/knowledge_base*.json` dan `output/indeks_*`. Pilihannya: **commit kedua hasil itu ke repo**
  (ukurannya kecil, ± 3 MB untuk Gemini), atau jalankan `bangun_kb.py` dan `buat_indeks.py` saat deploy (memakai kuota).
- **Embedding Gemini** ringan untuk server (hanya memanggil API). **e5** butuh `torch` (± 1 GB lebih) dan RAM ekstra, jadi periksa
  batas ukuran dan memori layanan hosting sebelum memilih e5.
- Isi `ALLOWED_ORIGINS` dengan domain web produksi, isi `PUAN_API_KEY` dengan nilai acak yang panjang, dan biarkan `PUAN_DEBUG=0`.
- **Privasi:** pada Gemini API tier gratis, data yang dikirim dapat dipakai Google untuk meningkatkan produknya. Curhat user itu
  sensitif, jadi untuk produksi pertimbangkan tier berbayar dan sebutkan pemrosesan oleh pihak ketiga di Kebijakan Privasi EduPuan.

---

## F. Pengaturan yang bisa diubah

| Variabel | Bawaan | Artinya |
|---|---|---|
| `PUAN_EMBED` | `gemini` | model embedding: `gemini` atau `e5` |
| `PUAN_PECAH_HURUF` | `0` | `1` = daftar panjang dipecah per huruf (putuskan dari hasil evaluasi) |
| `PUAN_AMBANG` | per model (0,60 / 0,80) | skor minimum agar pasal dianggap nyambung |
| `PUAN_MODEL_JAWAB` | `gemini-3.6-flash` | model penyusun jawaban |
| `PUAN_MODEL_TULIS_ULANG` | `gemini-3.1-flash-lite` | model penulis ulang kueri |
| `k_child`, `maks_utama`, `maks_tambah`, `maks_riwayat` | 8, 3, 2, 6 | di `puan_rag/config.py` |

Setelah mengganti `PUAN_EMBED` atau `PUAN_PECAH_HURUF`, indeks yang sesuai harus sudah dibuat (`buat_indeks.py --model ... [--pecah-huruf]`).

---

## G. Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| `GEMINI_API_KEY belum diisi` | kunci tidak terbaca | Colab: cek Secrets + "Akses notebook". Server: cek `.env` |
| `(... sibuk, coba lagi dalam 10 detik)` | server Gemini sibuk (503) / kuota per menit habis (429) | biarkan; sistem mencoba ulang lalu pindah ke model cadangan |
| `Indeks belum dibuat di ...` | `buat_indeks.py` belum dijalankan untuk model/versi itu | jalankan dengan `--model` dan `--pecah-huruf` yang sama |
| `Indeks tidak cocok dengan knowledge base` | KB dibangun ulang dengan pengaturan berbeda | jalankan ulang `buat_indeks.py` (hanya child baru yang di-embed) |
| Pertanyaan relevan dijawab "belum tahu" | skor di bawah ambang | lihat skor dengan `tanya.py --detail`; cek kalibrasi di `evaluasi.py` |
| Skor evaluasi Gemini ≠ uji 2 (87,5%) | kueri, KB, atau kunci soal berubah | pakai `--kueri-dari hasil_uji_1.xlsx`; cek apakah kunci soal diedit |

---

## H. Kalau peraturan atau kurasi berubah

1. PDF baru → taruh di `data/mentah/` → jalankan `ekstrak.jalankan(...)` (lihat `puan_rag/ekstrak.py`). UU PDP tetap memakai file koreksi.
2. Tambah/buang pasal atau tautan → edit `puan_rag/kurasi.py` (bagian yang perlu ditinjau orang hukum).
3. Jalankan `bangun_kb.py` → `buat_indeks.py` (hanya potongan yang berubah yang di-embed) → `evaluasi.py` → `uji_jawaban.py`.
4. Catat perubahannya di `docs/03_keputusan_dan_hasil_uji.md`.
