"""Tes rekap anonim [G]: pemisahan baris LABEL dan pencatatan yang aman. Tidak memanggil Gemini atau Supabase."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from puan_rag import statistik  # noqa: E402
from puan_rag.chatbot import PuanAI  # noqa: E402
from puan_rag.config import Pengaturan  # noqa: E402


def test_label_dipisahkan_dari_kueri():
    kueri, topik, situasi = statistik.pisahkan_label(
        'larangan penagih menghubungi rekan kerja debitur\nLABEL: penagihan/menghubungi_orang_lain')
    assert kueri == 'larangan penagih menghubungi rekan kerja debitur'
    assert (topik, situasi) == ('penagihan', 'menghubungi_orang_lain')


def test_label_tidak_dikenal_jadi_lainnya():
    assert statistik.pisahkan_label('kueri\nLABEL: penagihan/ngawur')[1:] == ('penagihan', 'lainnya')
    assert statistik.pisahkan_label('kueri\nLABEL: asal/asal')[1:] == ('lainnya', 'lainnya')
    assert statistik.pisahkan_label('kueri tanpa label')[1:] == ('lainnya', 'lainnya')


def test_catat_mati_tanpa_pengaturan(monkeypatch):
    monkeypatch.delenv('PUAN_CATAT_STATISTIK', raising=False)
    assert statistik.catat('penagihan', 'lainnya', 'pasal', False, 100) is False


class LLMTiruan:
    def tulis(self, model, contents, sistem=None, suhu=0.0, berpikir=None):
        if isinstance(contents, str):
            return 'larangan penagih menghubungi rekan kerja\nLABEL: penagihan/menghubungi_orang_lain'
        return 'Penagih tidak boleh menghubungi rekan kerjamu.'


class PencariTiruan:
    def __init__(self):
        self.kueri_diterima = None

    def cari(self, teks):
        self.kueri_diterima = teks
        return {'nyambung': False, 'skor_tertinggi': 0.3, 'parents': []}

    def daftar_sumber(self, *a, **k):
        return []


def test_jawab_membawa_label_dan_kueri_bersih(monkeypatch):
    dicatat = {}
    monkeypatch.setattr('puan_rag.chatbot.catat', lambda *a: dicatat.setdefault('isi', a))
    pencari = PencariTiruan()
    hasil = PuanAI(Pengaturan(), LLMTiruan(), pencari, kamus={}).jawab('DC nagih ke kantor aku, boleh gak?')
    assert (hasil.topik, hasil.situasi) == ('penagihan', 'menghubungi_orang_lain')
    assert 'LABEL' not in pencari.kueri_diterima          # baris LABEL tidak ikut dipakai mencari pasal
    assert dicatat['isi'][:3] == ('penagihan', 'menghubungi_orang_lain', 'tidak_ada_pasal')
    assert 'nagih ke kantor' not in str(dicatat['isi'])    # isi pesan user tidak ikut dicatat