"""Indeks vektor: menyimpan vektor setiap child yang dicari, lalu mencari yang paling mirip.

Disimpan sebagai file biasa di output/indeks_<model>[_pecah]/:
  vektor.npy  -> matriks angka (satu baris per child)
  meta.json   -> id child, sidik (hash) teksnya, nama model

Sidik teks dipakai agar embedding TIDAK dibuat ulang untuk child yang teksnya tidak berubah
(hemat kuota). Hanya child baru/berubah yang di-embed.
"""
from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path

import numpy as np

from .knowledge_base import child_dicari, teks_untuk_embed

log = logging.getLogger('puan_ai')


def sidik(teks: str) -> str:
    return hashlib.sha1(teks.encode('utf-8')).hexdigest()[:16]


class Indeks:
    def __init__(self, ids, vektor, model):
        self.ids = list(ids)
        self.vektor = np.asarray(vektor, dtype='float32')
        self.model = model
        self.posisi = {cid: i for i, cid in enumerate(self.ids)}

    def skor(self, v_kueri) -> np.ndarray:
        """Kemiripan kueri dengan SEMUA child (vektor sudah dinormalisasi -> dot product = cosine)."""
        return self.vektor @ np.asarray(v_kueri, dtype='float32')

    # ---------- simpan / muat ----------
    def simpan(self, folder: Path, sidik_teks: dict):
        folder = Path(folder)
        folder.mkdir(parents=True, exist_ok=True)
        np.save(folder / 'vektor.npy', self.vektor)
        (folder / 'meta.json').write_text(json.dumps(
            {'model': self.model, 'dimensi': int(self.vektor.shape[1]), 'ids': self.ids,
             'sidik': [sidik_teks[i] for i in self.ids]}, ensure_ascii=False), encoding='utf-8')

    @classmethod
    def muat(cls, folder: Path) -> 'Indeks':
        folder = Path(folder)
        if not (folder / 'meta.json').exists():
            raise FileNotFoundError(f'Indeks belum dibuat di {folder}. Jalankan: python scripts/buat_indeks.py')
        meta = json.loads((folder / 'meta.json').read_text(encoding='utf-8'))
        return cls(meta['ids'], np.load(folder / 'vektor.npy'), meta['model'])


def _cache_lama(folder: Path) -> dict:
    """{sidik_teks: vektor} dari indeks yang sudah ada (kalau ada)."""
    folder = Path(folder)
    if not (folder / 'meta.json').exists():
        return {}
    meta = json.loads((folder / 'meta.json').read_text(encoding='utf-8'))
    vektor = np.load(folder / 'vektor.npy')
    return dict(zip(meta['sidik'], vektor))


def bangun_indeks(kb, embedder, folder: Path, folder_tambahan=()) -> Indeks:
    """Buat/perbarui indeks. Vektor yang sudah ada (di folder ini atau folder_tambahan) dipakai ulang."""
    dicari = child_dicari(kb)
    teks = {c['id']: teks_untuk_embed(c) for c in dicari}
    sidik_teks = {cid: sidik(t) for cid, t in teks.items()}
    cache = {}
    for f in [folder, *folder_tambahan]:
        cache.update(_cache_lama(f))
    perlu = [cid for cid in teks if sidik_teks[cid] not in cache]
    log.info('%s child dicari | %s sudah punya vektor | %s perlu di-embed', len(teks), len(teks) - len(perlu), len(perlu))
    if perlu:
        baru = embedder.embed_dokumen([teks[cid] for cid in perlu])
        cache.update(zip([sidik_teks[cid] for cid in perlu], baru))
    ids = [c['id'] for c in dicari]
    indeks = Indeks(ids, np.vstack([cache[sidik_teks[i]] for i in ids]), embedder.nama)
    indeks.simpan(folder, sidik_teks)
    return indeks


def impor_embedding_lama(kb, file_vektor: Path, file_ids: Path, folder: Path, model='gemini') -> Indeks:
    """Pakai embedding Gemini yang sudah dibuat di notebook lama (output/embeddings.npy + embedding_ids.json)
    supaya tidak perlu embed ulang 694 child. Hanya child yang teksnya sama persis yang diimpor."""
    vektor_lama = np.load(file_vektor)
    ids_lama = json.loads(Path(file_ids).read_text())
    lama = dict(zip(ids_lama, vektor_lama))
    dicari = child_dicari(kb)
    cocok = [c for c in dicari if c['id'] in lama]
    sidik_teks = {c['id']: sidik(teks_untuk_embed(c)) for c in cocok}
    ids = [c['id'] for c in cocok]
    indeks = Indeks(ids, np.vstack([lama[i] for i in ids]), model)
    indeks.simpan(folder, sidik_teks)
    log.info('%s dari %s child diimpor dari embedding lama', len(ids), len(dicari))
    return indeks
