"""Komponen TIRUAN untuk menguji alur tanpa API key / tanpa internet.

- EmbedderKata : vektor dari kata-kata (bag of words). Kualitasnya jauh di bawah Gemini/e5,
                 tapi cukup untuk memastikan semua tahap tersambung dengan benar.
- LLMPalsu     : "Gemini" pura-pura yang membalas dengan teks tetap.
JANGAN dipakai untuk produksi atau untuk menilai kualitas Puan AI.
"""
from __future__ import annotations

import hashlib
import re

import numpy as np


class EmbedderKata:
    nama = 'kata'

    def __init__(self, dimensi=1024):
        self.dimensi = dimensi

    def _vektor(self, teks):
        v = np.zeros(self.dimensi, dtype='float32')
        for kata in re.findall(r'[a-z0-9]+', teks.lower()):
            if len(kata) > 2:
                v[int(hashlib.md5(kata.encode()).hexdigest(), 16) % self.dimensi] += 1
        n = np.linalg.norm(v)
        return v / n if n else v

    def embed_dokumen(self, teks):
        return np.vstack([self._vektor(t) for t in teks])

    embed_kueri = embed_dokumen


class LLMPalsu:
    def __init__(self):
        self.panggilan = []

    def tulis(self, model, contents, sistem=None, suhu=0.0, berpikir=None):
        self.panggilan.append({'model': model, 'contents': contents, 'sistem': sistem})
        teks = contents if isinstance(contents, str) else contents[-1].parts[0].text
        if sistem and 'KUERI PENCARIAN' in sistem:                        # tahap tulis ulang
            return 'DI_LUAR_TOPIK' if any(k in teks.lower() for k in ('resep', 'film', 'cuaca')) else teks[-200:]
        return '[jawaban tiruan Puan AI]'