"""Pengubah teks menjadi vektor (embedding). Dua pilihan model dengan cara pakai yang sama:

- 'gemini' : gemini-embedding-001 lewat API Google (768 angka per teks). Sudah teruji (uji 1–2).
- 'e5'     : intfloat/multilingual-e5-small, berjalan di komputer/server sendiri (384 angka per teks).
             Gratis dan data tidak dikirim ke luar, tapi perlu memasang torch (~1 GB) dan belum teruji.

Semua vektor dinormalisasi (panjangnya 1) sehingga kemiripan = hasil kali titik (dot product).
"""
from __future__ import annotations

import logging
import time

import numpy as np

from .gemini import GeminiSibuk, coba_berulang

log = logging.getLogger('puan_ai')


def _normalkan(v) -> np.ndarray:
    v = np.asarray(v, dtype='float32')
    return v / np.linalg.norm(v, axis=1, keepdims=True)


class EmbedderGemini:
    nama = 'gemini'

    def __init__(self, client, model='gemini-embedding-001', dimensi=768, ukuran_kelompok=50):
        self.client, self.model, self.dimensi, self.ukuran_kelompok = client, model, dimensi, ukuran_kelompok

    def _embed(self, teks, tugas):
        from google.genai import types
        hasil = []
        for mulai in range(0, len(teks), self.ukuran_kelompok):
            kelompok = teks[mulai:mulai + self.ukuran_kelompok]
            # kuota per menit embedding sering habis saat membuat ratusan vektor -> jeda lebih panjang (60 dtk)
            r = coba_berulang(self.client.models.embed_content, 'embedding Gemini', percobaan=5, jeda=60,
                              model=self.model, contents=kelompok,
                              config=types.EmbedContentConfig(task_type=tugas, output_dimensionality=self.dimensi))
            if r is None:
                raise GeminiSibuk('Server embedding Gemini sedang sibuk. Coba lagi beberapa menit lagi.')
            hasil += [e.values for e in r.embeddings]
            if len(teks) > self.ukuran_kelompok:
                log.info('   %s/%s teks di-embed', min(mulai + self.ukuran_kelompok, len(teks)), len(teks))
                time.sleep(1)
        return _normalkan(hasil)

    def embed_dokumen(self, teks):
        return self._embed(list(teks), 'RETRIEVAL_DOCUMENT')

    def embed_kueri(self, teks):
        return self._embed(list(teks), 'RETRIEVAL_QUERY')


class EmbedderE5:
    nama = 'e5'

    def __init__(self, model='intfloat/multilingual-e5-small', ukuran_kelompok=32):
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as e:
            raise ImportError('Model e5 butuh paket tambahan: pip install -r requirements-e5.txt') from e
        self.model = SentenceTransformer(model)
        self.dimensi = self.model.get_sentence_embedding_dimension()
        self.ukuran_kelompok = ukuran_kelompok
        # e5 hanya membaca maks. 512 token; teks yang lebih panjang terpotong (relevan untuk chunk daftar panjang)
        self.model.max_seq_length = 512

    def _embed(self, teks, awalan):
        # e5 WAJIB diberi awalan "passage: " untuk dokumen dan "query: " untuk pertanyaan
        v = self.model.encode([awalan + t for t in teks], batch_size=self.ukuran_kelompok,
                              normalize_embeddings=True, show_progress_bar=len(teks) > 100)
        return np.asarray(v, dtype='float32')

    def embed_dokumen(self, teks):
        return self._embed(list(teks), 'passage: ')

    def embed_kueri(self, teks):
        return self._embed(list(teks), 'query: ')


def buat_embedder(cfg, client=None):
    if cfg.model_embedding == 'gemini':
        if client is None:
            from .gemini import buat_client
            client = buat_client()
        return EmbedderGemini(client, cfg.model_gemini_embed, cfg.dimensi_gemini)
    return EmbedderE5(cfg.model_e5)
