"""Pencarian pasal (retrieval) gaya parent-child.

1. Kueri diubah jadi vektor, lalu dibandingkan dengan vektor semua child.
2. Ambil K_CHILD child teratas yang skornya >= AMBANG.
3. Naik ke parent-nya (tanpa dobel), maksimal MAKS_UTAMA parent  -> peran 'utama'.
4. Dari parent utama, kumpulkan rujukan (dalam dokumen) + terkait (antar-dokumen); pilih MAKS_TAMBAH
   yang paling mirip dengan kueri                                  -> peran 'rujukan'.
5. Teks parent-parent itu disusun jadi BAHAN BACAAN untuk Gemini.
"""
from __future__ import annotations

import numpy as np

from .knowledge_base import label_sumber


class Pencari:
    def __init__(self, kb, indeks, embedder, cfg):
        self.indeks, self.embedder, self.cfg = indeks, embedder, cfg
        self.id_ke_parent = {p['id']: p for p in kb['parents']}
        self.id_ke_child = {c['id']: c for c in kb['children']}
        hilang = [cid for cid in indeks.ids if cid not in self.id_ke_child]
        if hilang:
            raise ValueError(f'Indeks tidak cocok dengan knowledge base ({len(hilang)} child tidak dikenal). '
                             'Jalankan ulang scripts/buat_indeks.py dengan pengaturan pecah_huruf yang sama.')
        self.baris_parent = {}
        for n, cid in enumerate(indeks.ids):
            self.baris_parent.setdefault(self.id_ke_child[cid]['parent_id'], []).append(n)

    def cari(self, kueri: str) -> dict:
        return self.cari_dari_vektor(self.embedder.embed_kueri([kueri])[0])

    def cari_dari_vektor(self, v, k_child=None, maks_utama=None, maks_tambah=None, ambang=None) -> dict:
        k_child = k_child or self.cfg.k_child
        maks_utama = maks_utama or self.cfg.maks_utama
        maks_tambah = self.cfg.maks_tambah if maks_tambah is None else maks_tambah
        ambang = self.cfg.ambang if ambang is None else ambang

        skor = self.indeks.skor(v)
        urutan = np.argsort(-skor)[:k_child]
        tertinggi = float(skor[urutan[0]])
        child_teratas = [(self.indeks.ids[i], round(float(skor[i]), 3)) for i in urutan]
        if tertinggi < ambang:
            return {'nyambung': False, 'skor_tertinggi': tertinggi, 'parents': [], 'child_teratas': child_teratas}

        utama = []
        for i in urutan:
            if skor[i] < ambang:
                break
            pid = self.id_ke_child[self.indeks.ids[i]]['parent_id']
            if pid not in utama:
                utama.append(pid)
            if len(utama) == maks_utama:
                break

        kandidat = set()
        for pid in utama:
            p = self.id_ke_parent[pid]
            kandidat |= set(p.get('rujukan', []) + p.get('terkait', []))
        kandidat -= set(utama)

        def nilai(pid):          # kandidat dinilai dari child-nya yang paling mirip dengan kueri
            return max((float(skor[i]) for i in self.baris_parent.get(pid, [])), default=-1.0)

        tambahan = sorted(kandidat, key=nilai, reverse=True)[:maks_tambah]
        return {'nyambung': True, 'skor_tertinggi': tertinggi, 'child_teratas': child_teratas,
                'parents': [(pid, 'utama') for pid in utama] + [(pid, 'rujukan') for pid in tambahan]}

    def susun_bahan(self, konteks) -> str:
        """Gabungkan teks parent jadi satu bahan bacaan berlabel sumber."""
        bagian = []
        for pid, _peran in konteks['parents']:
            p = self.id_ke_parent[pid]
            teks = f"[SUMBER: {label_sumber(p)} | {p['lokasi']}]\n{p['teks']}"
            if p['penjelasan']:
                teks += f"\nPenjelasan resmi: {p['penjelasan']}"
            bagian.append(teks)
        return '\n\n---\n\n'.join(bagian)

    def daftar_sumber(self, konteks):
        return [{'id': pid, 'label': label_sumber(self.id_ke_parent[pid]), 'peran': peran}
                for pid, peran in konteks['parents']]
