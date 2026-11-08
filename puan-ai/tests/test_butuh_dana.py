"""Tes jalur BUTUH_DANA [F]: pesan "butuh uang cepat" tidak boleh dianggap di luar topik,
dan pencarian pasal harus dilewati. Tidak memanggil Gemini (memakai LLM tiruan)."""
import sys
from pathlib import Path

# Beri tahu Python letak folder puan-ai, supaya folder puan_rag bisa ditemukan
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from puan_rag.chatbot import PuanAI  # noqa: E402
from puan_rag.config import Pengaturan  # noqa: E402
from puan_rag.prompt import LABEL_BAHAN  # noqa: E402

class LLMTiruan:
    """Pura-pura jadi Gemini: langkah tulis ulang menjawab BUTUH_DANA, langkah jawab mencatat bahan yang diterima."""

    def __init__(self):
        self.bahan_jawab = None

    def tulis(self, model, contents, sistem=None, suhu=0.0, berpikir=None):
        if isinstance(contents, str):          # tahap tulis ulang
            return 'BUTUH_DANA'
        self.bahan_jawab = contents[-1].parts[0].text   # tahap jawab
        return 'Coba lihat dulu fitur Cari Alternatif.'


class PencariTidakBolehDipanggil:
    def cari(self, *a, **k):
        raise AssertionError('Pencarian pasal seharusnya dilewati untuk BUTUH_DANA')

    def susun_bahan(self, *a, **k):
        raise AssertionError('susun_bahan seharusnya tidak dipanggil')

    def daftar_sumber(self, *a, **k):
        return []


def test_butuh_dana_melewati_pencarian_pasal():
    llm = LLMTiruan()
    puan = PuanAI(Pengaturan(), llm, PencariTidakBolehDipanggil(), kamus={})
    hasil = puan.jawab('Aku butuh uang cepat, harus gimana?')
    assert hasil.status == 'butuh_dana'
    assert hasil.sumber == []
    assert LABEL_BAHAN['butuh_dana'] in llm.bahan_jawab