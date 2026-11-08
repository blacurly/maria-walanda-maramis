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


def coba_berulang(fungsi, keterangan, percobaan=3, jeda=10, **argumen):
    """Jalankan fungsi; kalau server sibuk, tunggu (10, 20, 30 detik) lalu coba lagi. Error lain langsung dilempar."""
    for ke in range(percobaan):
        try:
            return fungsi(**argumen)
        except Exception as e:  # noqa: BLE001 - SDK melempar beberapa jenis error
            if not any(t in str(e) for t in TANDA_SIBUK):
                raise
            tunggu = jeda * (ke + 1)
            log.warning('%s sibuk (%s), coba lagi dalam %s detik...', keterangan, str(e)[:60], tunggu)
            time.sleep(tunggu)
    return None


class GeminiLLM:
    """Menghasilkan teks dengan Gemini, lengkap dengan model cadangan."""

    def __init__(self, client, model_cadangan=()):
        self.client = client
        self.model_cadangan = tuple(model_cadangan)

    def tulis(self, model, contents, sistem=None, suhu=0.0) -> str:
        from google.genai import types
        config = types.GenerateContentConfig(system_instruction=sistem, temperature=suhu)
        for m in [model] + [c for c in self.model_cadangan if c != model]:
            hasil = coba_berulang(self.client.models.generate_content, m, model=m, contents=contents, config=config)
            if hasil is not None:
                if m != model:
                    log.warning('dijawab oleh model cadangan: %s', m)
                return (hasil.text or '').strip()
        raise GeminiSibuk('Semua model Gemini sedang sibuk. Coba lagi beberapa menit lagi.')
