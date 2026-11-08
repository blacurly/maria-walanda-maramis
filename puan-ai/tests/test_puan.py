"""Uji otomatis TANPA API key (pakai komponen tiruan). Jalankan: python -m pytest tests -q

Yang dipastikan: knowledge base terbentuk sesuai versi teruji, pemecahan huruf benar, alur jawab tersambung,
dan API merespons dengan benar. Kualitas jawaban TIDAK diuji di sini (itu tugas scripts/evaluasi.py & uji_jawaban.py).
"""
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from puan_rag import Pengaturan, Pesan, PuanAI  # noqa: E402
from puan_rag import knowledge_base as K  # noqa: E402
from puan_rag.indeks import bangun_indeks  # noqa: E402
from puan_rag.palsu import EmbedderKata, LLMPalsu  # noqa: E402
from puan_rag.retrieval import Pencari  # noqa: E402


@pytest.fixture(scope='module')
def kb():
    return K.bangun(ROOT / 'data' / 'bersih')


@pytest.fixture(scope='module')
def puan(kb, tmp_path_factory):
    cfg = Pengaturan(ambang=0.05)
    indeks = bangun_indeks(kb, EmbedderKata(), tmp_path_factory.mktemp('indeks'))
    kamus = json.loads(cfg.file_kamus.read_text(encoding='utf-8'))
    return PuanAI(cfg, LLMPalsu(), Pencari(kb, indeks, EmbedderKata(), cfg), kamus)


def test_ukuran_kb_sesuai_versi_teruji(kb):
    assert len(kb['parents']) == 248
    assert len(kb['children']) == 889
    assert len(K.child_dicari(kb)) == 694
    assert not any(K.periksa(kb).values())


def test_ayat_sanksi_dilewati_tapi_pasal_pidana_tetap_dicari(kb):
    jenis = {c['id']: c['jenis'] for c in kb['children']}
    assert jenis['POJK22:19.9'] == 'sanksi'          # sempat lolos sebelum perbaikan (uji 1)
    assert jenis['POJK22:62.2'] == 'isi'
    assert jenis['UUPDP:67.1'] == 'isi'              # ketentuan pidana justru harus bisa dicari


def test_pecah_huruf(kb):
    kb2 = K.bangun(ROOT / 'data' / 'bersih', pecah_huruf=True)
    c = {x['id']: x for x in kb2['children']}
    assert 'POJK22:62.2' not in c and 'POJK22:62.2.d' in c
    assert 'lebih dari 3 (tiga) kali' in c['POJK22:62.2.d']['penjelasan']
    assert c['POJK22:62.2.d']['teks'].startswith('(2) Dalam memastikan tindakan penagihan')
    assert len(K.child_dicari(kb2)) == 833 and not any(K.periksa(kb2).values())


def test_label_sumber(kb):
    p = {x['id']: x for x in kb['parents']}
    assert K.label_sumber(p['POJK22:62']) == 'POJK 22/2023 Pasal 62'
    assert K.label_sumber(p['SEOJK19:VIII.1']) == 'SEOJK 19/2025 angka romawi VIII angka 1'


def test_alur_jawab(puan):
    h = puan.jawab('dc nagih ke kantor dan bilang ke atasan aku, boleh gak?')
    assert h.status == 'pasal' and h.sumber and not h.krisis
    assert puan.jawab('resep rendang yang enak gimana?').status == 'di_luar_topik'
    assert puan.jawab('aku capek banget pengen mati aja').krisis


def test_riwayat_ikut_terkirim(puan):
    riwayat = [Pesan('user', 'dc nyebar data aku ke kontak'), Pesan('puan', 'Itu tidak dibenarkan.')]
    puan.jawab('terus aku lapor ke mana?', riwayat)
    tulis_ulang, jawab = puan.llm.panggilan[-2], puan.llm.panggilan[-1]
    assert 'RIWAYAT PERCAKAPAN' in tulis_ulang['contents']
    assert [c.role for c in jawab['contents']] == ['user', 'model', 'user']


def test_api(puan):
    import os

    from fastapi.testclient import TestClient

    import api.main as M
    M.PuanAI.dari_folder = staticmethod(lambda cfg=None: puan)
    # kalau .env berisi PUAN_API_KEY, kirim kunci yang sama seperti yang dilakukan Next.js
    kunci = os.getenv('PUAN_API_KEY', '')
    header = {'X-Puan-Key': kunci}
    with TestClient(M.app) as c:
        assert c.get('/health').json()['status'] == 'ok'
        r = c.post('/chat', json={'pesan': 'bunga pinjol maksimal berapa?'}, headers=header)
        assert r.status_code == 200 and set(r.json()) >= {'jawaban', 'status', 'krisis', 'sumber'}
        assert c.post('/chat', json={'pesan': ''}, headers=header).status_code == 422
        if kunci:   # kunci salah harus ditolak
            assert c.post('/chat', json={'pesan': 'halo'}, headers={'X-Puan-Key': 'salah'}).status_code == 401