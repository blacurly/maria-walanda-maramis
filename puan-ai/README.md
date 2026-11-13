# Puan AI — Chatbot RAG EduPuan

> **Catatan (13 Nov 2026):** Puan AI yang dipakai aplikasi sekarang berjalan **di dalam Next.js** (`web/src/lib/puan/`)
> dengan vector database **Supabase pgvector**, bukan lewat layanan FastAPI di folder ini. Folder `puan-ai/` tetap dipakai
> sebagai **laboratorium data**: teks peraturan, pembangunan knowledge base, dan evaluasi awal. Status dan angka di bawah
> adalah catatan versi Python. Dokumentasi terbaru ada di [`web/docs/ai.md`](../web/docs/ai.md).

Puan AI adalah teman curhat di **EduPuan** untuk perempuan yang mau pinjam, sudah terjerat, atau bingung soal pinjaman online.
Jawabannya bersumber dari **4 peraturan resmi** (POJK 22/2023, POJK 40/2024, UU 27/2022 tentang PDP, SEOJK 19/SEOJK.06/2025)
dengan metode **RAG parent-child**: ayat/huruf (child) dipakai untuk mencari, pasal utuh (parent) dipakai untuk menjawab.

```
pesan user ─► tulis ulang (bahasa hukum) ─► cari child ─► naik ke parent ─► Gemini menjawab + sumber pasal
```

## Mulai cepat

**Di Google Colab (disarankan):** unggah `puan-ai.zip` ke `MyDrive/edupuan-rag/`, buka `notebooks/puan_ai_pipeline.ipynb`, jalankan dari atas.

**Di komputer sendiri:**
```bash
pip install -r requirements.txt pytest
cp .env.example .env                    # isi GEMINI_API_KEY
python -m pytest tests -q               # 7 uji tanpa kuota
python scripts/bangun_kb.py             # knowledge base parent-child
python scripts/buat_indeks.py           # indeks vektor (Gemini)
python scripts/tanya.py --detail "dc nagih ke kantor aku, boleh gak?"
uvicorn api.main:app --reload --port 8000   # API untuk web → http://localhost:8000/docs
```

## Status

| Bagian | Status |
|---|---|
| Knowledge base (248 parent / 694 child dicari) | ✅ identik dengan versi yang teruji di notebook lama |
| Pencarian, embedding Gemini | ✅ teruji: **87,5% kena, MRR 0,80** (angka 100%, lintas dokumen 60% / ketat 40%) |
| Opsi pecah daftar panjang per huruf | ⏳ siap, belum dievaluasi dengan Gemini |
| Embedding multilingual-e5-small | ⏳ siap, belum dievaluasi; ambang 0,80 masih sementara |
| System prompt (aturan A–E dilebur + aturan baru) | ⏳ perlu uji jawaban (`scripts/uji_jawaban.py`) dan tinjauan hukum |
| Riwayat percakapan | ⏳ baru, belum diuji dengan Gemini |
| API FastAPI | ✅ teruji dengan komponen tiruan (respons, validasi, kunci, CORS, error) |

## Dokumen

| Dokumen | Isi |
|---|---|
| [01 Arsitektur & alur](docs/01_arsitektur_dan_alur.md) | cara kerja tahap demi tahap, diagram, peta file |
| [02 Panduan menjalankan](docs/02_panduan_menjalankan.md) | Colab, lokal, API, sambungan ke Next.js, deploy, masalah umum |
| [03 Keputusan & hasil uji](docs/03_keputusan_dan_hasil_uji.md) | alasan setiap keputusan, bug, skor uji, keterbatasan, pertanyaan juri |
| [04 Sumber hukum & perilaku](docs/04_sumber_hukum_dan_perilaku.md) | 4 dokumen, pasal yang diambil, tautan, kamus, aturan perilaku, kontak yang harus dicek |

## Struktur

```
puan_rag/   mesin RAG (config, kurasi hukum, chunking, embedding, indeks, retrieval, prompt, chatbot)
scripts/    bangun_kb · buat_indeks · tanya · evaluasi · uji_jawaban
api/        layanan FastAPI untuk web
notebooks/  pipeline lengkap di Colab
data/       teks peraturan bersih, PDF asli, kamus, soal uji
output/     hasil buatan script
docs/       4 dokumen pendukung
tests/      uji otomatis tanpa API key
supabase/   skema pgvector opsional
```
