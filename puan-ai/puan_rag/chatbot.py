"""Puan AI: menyatukan semua tahap menjadi satu fungsi jawab(pesan, riwayat).

pesan user
  → [1] tulis ulang jadi kueri hukum (Gemini flash-lite + kamus)      → DI_LUAR_TOPIK / BUTUH_DANA? langsung ke [4]
  → [2] cari pasal parent-child (embedding + indeks)                  → tidak ada yang nyambung? ke [4]
  → [3] susun bahan bacaan berlabel sumber
  → [4] Gemini menjawab dengan system prompt + riwayat + bahan bacaan (+ catatan krisis bila perlu)
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field

from . import knowledge_base as kbmod
from .config import Pengaturan
from .embedding import buat_embedder
from .gemini import GeminiLLM, buat_client
from .indeks import Indeks
from .prompt import CATATAN_KRISIS, INSTRUKSI_TULIS_ULANG, KATA_KRISIS, LABEL_BAHAN, SYSTEM_PROMPT_PUAN
from .retrieval import Pencari

log = logging.getLogger('puan_ai')


@dataclass
class Pesan:
    peran: str          # 'user' atau 'puan'
    teks: str


@dataclass
class HasilJawaban:
    jawaban: str
    status: str                     # 'pasal' | 'di_luar_topik' | 'butuh_dana' | 'tidak_ada_pasal'
    krisis: bool
    sumber: list = field(default_factory=list)      # [{'id', 'label', 'peran'}]
    kueri: str = ''
    skor_tertinggi: float | None = None

    def ke_dict(self):
        return self.__dict__.copy()


def ada_tanda_krisis(teks: str) -> bool:
    t = teks.lower()
    return any(k in t for k in KATA_KRISIS)


def _teks_riwayat(riwayat):
    return '\n'.join(f"{'User' if m.peran == 'user' else 'Puan AI'}: {m.teks}" for m in riwayat)


class PuanAI:
    def __init__(self, cfg: Pengaturan, llm: GeminiLLM, pencari: Pencari, kamus: dict):
        self.cfg, self.llm, self.pencari = cfg, llm, pencari
        teks_kamus = '\n'.join(f"- {santai.replace('|', ' / ')} → {hukum}" for santai, hukum in kamus.items())
        self.instruksi_tulis_ulang = INSTRUKSI_TULIS_ULANG.format(kamus=teks_kamus)

    # ---------- cara membuat dari file di folder output ----------
    @classmethod
    def dari_folder(cls, cfg: Pengaturan | None = None, client=None) -> 'PuanAI':
        cfg = cfg or Pengaturan()
        client = client or buat_client()
        kb = kbmod.muat(cfg.file_kb)
        indeks = Indeks.muat(cfg.folder_indeks)
        if indeks.model != cfg.model_embedding:
            raise ValueError(f'Indeks dibuat dengan model {indeks.model}, tapi pengaturan memakai {cfg.model_embedding}.')
        embedder = buat_embedder(cfg, client)
        kamus = json.loads(cfg.file_kamus.read_text(encoding='utf-8'))
        return cls(cfg, GeminiLLM(client, cfg.model_cadangan), Pencari(kb, indeks, embedder, cfg), kamus)

    # ---------- tahap 1: tulis ulang ----------
    def tulis_ulang(self, pesan: str, riwayat=()) -> str:
        isi = pesan
        riwayat_user = [m for m in riwayat if m.peran == 'user'][-2:]          # cukup 2 pesan user terakhir
        if riwayat_user:
            isi = f'RIWAYAT PERCAKAPAN:\n{_teks_riwayat(riwayat_user)}\n\nPESAN TERBARU:\n{pesan}'
        return self.llm.tulis(self.cfg.model_tulis_ulang, isi, sistem=self.instruksi_tulis_ulang, suhu=0,
                              berpikir=self.cfg.berpikir_tulis_ulang)

    # ---------- tahap 1+2: tulis ulang lalu cari ----------
    def ambil_konteks(self, pesan: str, riwayat=()):
        kueri = self.tulis_ulang(pesan, riwayat)
        # [F] butuh uang / menimbang pinjam tanpa pertanyaan hukum: tidak perlu mencari pasal
        if 'BUTUH_DANA' in kueri:
            return kueri, {'nyambung': False, 'skor_tertinggi': None, 'parents': [], 'butuh_dana': True}
        if 'DI_LUAR_TOPIK' in kueri:
            return kueri, {'nyambung': False, 'skor_tertinggi': None, 'parents': [], 'di_luar_topik': True}
        # pesan asli + kueri hukum dicari bersama: bahasa sehari-hari dan istilah hukum sama-sama terwakili
        return kueri, self.pencari.cari(pesan + '\n' + kueri)

    # ---------- semua tahap ----------
    def jawab(self, pesan: str, riwayat=None) -> HasilJawaban:
        riwayat = [m if isinstance(m, Pesan) else Pesan(**m) for m in (riwayat or [])][-self.cfg.maks_riwayat:]
        t0 = time.perf_counter()
        kueri, konteks = self.ambil_konteks(pesan, riwayat)
        t1 = time.perf_counter()
        if konteks['nyambung']:
            status, bahan = 'pasal', self.pencari.susun_bahan(konteks)
        else:
            if konteks.get('butuh_dana'):
                status = 'butuh_dana'
            elif konteks.get('di_luar_topik'):
                status = 'di_luar_topik'
            else:
                status = 'tidak_ada_pasal'
            bahan = LABEL_BAHAN[status]
        krisis = ada_tanda_krisis(pesan)

        from google.genai import types
        contents = [types.Content(role='user' if m.peran == 'user' else 'model', parts=[types.Part(text=m.teks)])
                    for m in riwayat]
        isi_terbaru = f'PESAN USER:\n{pesan}\n\nBAHAN BACAAN:\n{bahan}' + (CATATAN_KRISIS if krisis else '')
        contents.append(types.Content(role='user', parts=[types.Part(text=isi_terbaru)]))

        jawaban = self.llm.tulis(self.cfg.model_jawab, contents, sistem=SYSTEM_PROMPT_PUAN, suhu=self.cfg.suhu_jawab,
                                 berpikir=self.cfg.berpikir_jawab)
        log.info('waktu: cari pasal %.1f dtk | susun jawaban %.1f dtk | total %.1f dtk',
                 t1 - t0, time.perf_counter() - t1, time.perf_counter() - t0)
        return HasilJawaban(jawaban=jawaban, status=status, krisis=krisis, kueri=kueri,
                            sumber=self.pencari.daftar_sumber(konteks) if status == 'pasal' else [],
                            skor_tertinggi=konteks.get('skor_tertinggi'))