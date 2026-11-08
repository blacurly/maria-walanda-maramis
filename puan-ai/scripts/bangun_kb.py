"""Langkah 1: bangun knowledge base parent-child dari data/bersih -> output/knowledge_base[_pecah].json

Contoh:
    python scripts/bangun_kb.py
    python scripts/bangun_kb.py --pecah-huruf
"""
from collections import Counter

from _umum import argumen_umum, pengaturan_dari

from puan_rag import knowledge_base as K


def main():
    args = argumen_umum('Bangun knowledge base parent-child').parse_args()
    cfg = pengaturan_dari(args)
    kb = K.bangun(cfg.folder_data / 'bersih', pecah_huruf=cfg.pecah_huruf)
    hasil_cek = K.periksa(kb)
    for nama, nilai in hasil_cek.items():
        print(f"{'OK     ' if nilai == 0 else 'MASALAH'} | {nama}: {nilai}")
    if any(hasil_cek.values()):
        raise SystemExit('Ada masalah di knowledge base. Periksa puan_rag/kurasi.py.')
    K.simpan(kb, cfg.file_kb)

    dicari = K.child_dicari(kb)
    per_dok = Counter(p['id'].split(':')[0] for p in kb['parents'])
    print(f"\nKnowledge base{' (pecah huruf)' if cfg.pecah_huruf else ''}: {len(kb['parents'])} parent | "
          f"{len(kb['children'])} child ({len(dicari)} dicari, {len(kb['children']) - len(dicari)} ayat sanksi dilewati)")
    print('Parent per dokumen:', dict(per_dok))
    print(f'Tersimpan di {cfg.file_kb}')


if __name__ == '__main__':
    main()
