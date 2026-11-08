"""Bantuan bersama untuk semua script: tambahkan folder proyek ke sys.path dan baca pilihan dari baris perintah."""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

try:                                   # isi .env (kalau ada) ikut terbaca oleh semua script
    from dotenv import load_dotenv
    load_dotenv(ROOT / '.env')
except ImportError:
    pass

from puan_rag.config import Pengaturan  # noqa: E402


def argumen_umum(deskripsi):
    p = argparse.ArgumentParser(description=deskripsi)
    p.add_argument('--model', choices=['gemini', 'e5'], help='model embedding (bawaan: PUAN_EMBED atau gemini)')
    p.add_argument('--pecah-huruf', action='store_true', help='pakai knowledge base yang daftar panjangnya dipecah per huruf')
    return p


def pengaturan_dari(args, **tambahan) -> Pengaturan:
    kw = dict(tambahan)
    if getattr(args, 'model', None):
        kw['model_embedding'] = args.model
    if getattr(args, 'pecah_huruf', False):
        kw['pecah_huruf'] = True
    return Pengaturan(**kw)
