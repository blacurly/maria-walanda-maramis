"""Pengaturan Puan AI.

Semua angka yang memengaruhi perilaku RAG dikumpulkan di sini supaya mudah dicari dan diubah.
Setiap nilai bisa ditimpa lewat environment variable (file .env, Colab, atau server) tanpa mengubah kode.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(os.getenv('PUAN_ROOT', Path(__file__).resolve().parent.parent))


def _env_bool(nama: str, bawaan: bool) -> bool:
    nilai = os.getenv(nama)
    return bawaan if nilai is None else nilai.strip().lower() in ('1', 'true', 'ya', 'yes', 'on')


# Ambang kemiripan minimum agar sebuah child dianggap "nyambung" dengan pertanyaan.
# Tiap model embedding punya skala skor berbeda, jadi ambangnya juga berbeda.
AMBANG_BAWAAN = {
    'gemini': 0.60,   # teruji: teks tak berkaitan ~0.52, pertanyaan relevan ~0.64–0.75
    'e5': 0.80,       # SEMENTARA — belum teruji. Wajib dikalibrasi dengan scripts/evaluasi.py
}


@dataclass
class Pengaturan:
    # ---- Lokasi folder ----
    folder_data: Path = field(default_factory=lambda: ROOT / 'data')
    folder_output: Path = field(default_factory=lambda: ROOT / 'output')

    # ---- Pilihan utama ----
    model_embedding: str = field(default_factory=lambda: os.getenv('PUAN_EMBED', 'gemini'))      # 'gemini' atau 'e5'
    pecah_huruf: bool = field(default_factory=lambda: _env_bool('PUAN_PECAH_HURUF', False))      # pecah daftar panjang per huruf

    # ---- Pencarian (retrieval) ----
    ambang: float | None = field(default_factory=lambda: float(os.environ['PUAN_AMBANG']) if os.getenv('PUAN_AMBANG') else None)
    k_child: int = 8          # berapa child teratas yang dilihat
    maks_utama: int = 3       # maksimal parent utama
    maks_tambah: int = 2      # maksimal parent tambahan dari rujukan/terkait

    # ---- Model Gemini ----
    model_gemini_embed: str = 'gemini-embedding-001'
    dimensi_gemini: int = 768
    model_e5: str = 'intfloat/multilingual-e5-small'
    model_tulis_ulang: str = field(default_factory=lambda: os.getenv('PUAN_MODEL_TULIS_ULANG', 'gemini-3.1-flash-lite'))
    model_jawab: str = field(default_factory=lambda: os.getenv('PUAN_MODEL_JAWAB', 'gemini-3.6-flash'))
    model_cadangan: tuple = ('gemini-flash-latest', 'gemini-3.1-flash-lite')
    suhu_jawab: float = 0.4

    # ---- Percakapan ----
    maks_riwayat: int = 6     # berapa pesan terakhir (user + Puan) yang ikut dikirim ke Gemini

    def __post_init__(self):
        if self.model_embedding not in AMBANG_BAWAAN:
            raise ValueError(f"model_embedding harus 'gemini' atau 'e5', bukan {self.model_embedding!r}")
        if self.ambang is None:
            self.ambang = AMBANG_BAWAAN[self.model_embedding]
        self.folder_data = Path(self.folder_data)
        self.folder_output = Path(self.folder_output)

    # ---- Nama file hasil ----
    @property
    def akhiran(self) -> str:
        return '_pecah' if self.pecah_huruf else ''

    @property
    def file_kb(self) -> Path:
        return self.folder_output / f'knowledge_base{self.akhiran}.json'

    @property
    def folder_indeks(self) -> Path:
        return self.folder_output / f'indeks_{self.model_embedding}{self.akhiran}'

    @property
    def file_kamus(self) -> Path:
        return self.folder_data / 'kamus_istilah.json'

    @property
    def file_soal(self) -> Path:
        return self.folder_data / 'referensi' / 'soal_uji_puan_ai.xlsx'
