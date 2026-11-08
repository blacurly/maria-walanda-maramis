"""Pembungkus Gemini API dengan pengaman: coba ulang saat server sibuk (503) atau kuota per menit habis (429),
lalu pindah ke model cadangan kalau model utama terus gagal."""
from __future__ import annotations

import logging
import os
import time

log = logging.getLogger('puan_ai')

TANDA_SIBUK = ('503', 'UNAVAILABLE', '429', 'RESOURCE_EXHAUSTED', '500', 'INTERNAL')


class GeminiSibuk(RuntimeError):
    """Semua percobaan (termasuk model cadangan) gagal karena server sibuk / kuota habis."""


def buat_client(api_key: str | None = None):
    from google import genai
    kunci = api_key or os.getenv('GEMINI_API_KEY')
    if not kunci:
        raise RuntimeError('GEMINI_API_KEY belum diisi. Di Colab: Secrets > GEMINI_API_KEY. Di server: file .env')
    return genai.Client(api_key=kunci)


def coba_berulang(fungsi, keterangan, percobaan=None, jeda=None, **argumen):
    """Jalankan fungsi; kalau server sibuk, tunggu lalu coba lagi. Error lain langsung dilempar.

    Bawaan: 3 percobaan, jeda 10 lalu 20 detik (cocok untuk script di Colab/laptop).
    Server web memakai PUAN_PERCOBAAN dan PUAN_JEDA yang lebih pendek (diatur di api/main.py),
    supaya user tidak menunggu lama saat Gemini sibuk.
    """
    percobaan = percobaan or int(os.getenv('PUAN_PERCOBAAN', '3'))
    jeda = jeda or int(os.getenv('PUAN_JEDA', '10'))
    for ke in range(percobaan):
        try:
            return fungsi(**argumen)
        except Exception as e:  # noqa: BLE001 - SDK melempar beberapa jenis error
            if not any(t in str(e) for t in TANDA_SIBUK):
                raise
            if ke == percobaan - 1:      # percobaan terakhir: tidak perlu menunggu lagi
                break
            tunggu = jeda * (ke + 1)
            log.warning('%s sibuk (%s), coba lagi dalam %s detik...', keterangan, str(e)[:60], tunggu)
            time.sleep(tunggu)
    return None


class GeminiLLM:
    """Menghasilkan teks dengan Gemini, lengkap dengan model cadangan."""

    def __init__(self, client, model_cadangan=()):
        self.client = client
        self.model_cadangan = tuple(model_cadangan)

    def tulis(self, model, contents, sistem=None, suhu=0.0, berpikir=None) -> str:
        from google.genai import types

        def buat_config(dengan_berpikir: bool):
            pikir = types.ThinkingConfig(thinking_level=berpikir) if (berpikir and dengan_berpikir) else None
            return types.GenerateContentConfig(system_instruction=sistem, temperature=suhu, thinking_config=pikir)

        for m in [model] + [c for c in self.model_cadangan if c != model]:
            try:
                try:
                    hasil = coba_berulang(self.client.models.generate_content, m, model=m, contents=contents,
                                          config=buat_config(True))
                except Exception as e:  # noqa: BLE001
                    # model ini tidak mengenal pengaturan "berpikir" (400): ulangi tanpa pengaturan itu
                    if not berpikir or not any(t in str(e) for t in ('400', 'INVALID_ARGUMENT')):
                        raise
                    log.warning('%s menolak pengaturan berpikir=%s, dicoba tanpa pengaturan itu', m, berpikir)
                    hasil = coba_berulang(self.client.models.generate_content, m, model=m, contents=contents,
                                          config=buat_config(False))
            except Exception as e:  # noqa: BLE001
                if m == model:
                    raise
                # model cadangan bermasalah (mis. 404 nama model tidak tersedia): lewati, coba cadangan berikutnya
                log.warning('model cadangan %s tidak bisa dipakai (%s), dilewati', m, str(e)[:80])
                continue
            if hasil is not None:
                if m != model:
                    log.warning('dijawab oleh model cadangan: %s', m)
                return (hasil.text or '').strip()
        raise GeminiSibuk('Semua model Gemini sedang sibuk. Coba lagi beberapa menit lagi.')