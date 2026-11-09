"""Tes umpan balik anonim [G] dan skema API. Tidak memanggil Gemini atau Supabase."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from puan_rag import statistik  # noqa: E402


def test_skema_api_menerima_butuh_dana():
    # Mencegah error 500: jawaban berstatus butuh_dana harus lolos validasi respons API
    from api.main import JawabanChat
    j = JawabanChat(jawaban='x', status='butuh_dana', krisis=False, sumber=[], topik='butuh_dana', situasi='butuh_dana')
    assert j.status == 'butuh_dana'


def test_label_sah():
    assert statistik.label_sah('penagihan', 'menghubungi_orang_lain') == ('penagihan', 'menghubungi_orang_lain')
    assert statistik.label_sah('butuh_dana', 'butuh_dana') == ('butuh_dana', 'butuh_dana')
    assert statistik.label_sah('penagihan', 'ngawur') == ('penagihan', 'lainnya')
    assert statistik.label_sah('<script>', 'x') == ('lainnya', 'lainnya')


def test_umpan_balik_menolak_nilai_aneh(monkeypatch):
    dikirim = []
    monkeypatch.setattr(statistik, '_kirim', lambda tabel, data, bw: dikirim.append((tabel, data)) or True)
    assert statistik.catat_umpan_balik(5, 'biaya', 'lainnya', 'pasal') is False
    assert statistik.catat_umpan_balik(-1, 'biaya', 'bingung_hitungan', 'status_palsu') is False
    assert statistik.catat_umpan_balik(-1, 'biaya', 'bingung_hitungan', 'pasal') is True
    assert dikirim == [('umpan_balik_puan', {'nilai': -1, 'topik': 'biaya', 'situasi': 'bingung_hitungan', 'status': 'pasal'})]


def test_umpan_balik_mati_tanpa_pengaturan(monkeypatch):
    monkeypatch.delenv('PUAN_CATAT_STATISTIK', raising=False)
    assert statistik.catat_umpan_balik(1, 'biaya', 'lainnya', 'pasal') is False