"""Langkah 2: ubah setiap child jadi vektor dan simpan indeksnya -> output/indeks_<model>[_pecah]/

Hanya child yang belum punya vektor yang di-embed (vektor dari indeks lain dengan model yang sama dipakai ulang),
jadi mengganti --pecah-huruf hanya meng-embed potongan baru.

Contoh:
    python scripts/buat_indeks.py --model gemini
    python scripts/buat_indeks.py --model gemini --pecah-huruf
    python scripts/buat_indeks.py --model e5
    # pakai embedding dari notebook lama (hemat ~7 menit & kuota):
    python scripts/buat_indeks.py --model gemini --impor-lama /content/drive/MyDrive/edupuan-rag/output
"""
from pathlib import Path

from _umum import argumen_umum, pengaturan_dari

from puan_rag import knowledge_base as K
from puan_rag.embedding import buat_embedder
from puan_rag.indeks import bangun_indeks, impor_embedding_lama


def main():
    p = argumen_umum('Buat indeks vektor')
    p.add_argument('--impor-lama', type=Path, help='folder berisi embeddings.npy + embedding_ids.json dari notebook lama (khusus gemini)')
    args = p.parse_args()
    cfg = pengaturan_dari(args)
    if not cfg.file_kb.exists():
        raise SystemExit(f'{cfg.file_kb} belum ada. Jalankan dulu: python scripts/bangun_kb.py' + (' --pecah-huruf' if cfg.pecah_huruf else ''))
    kb = K.muat(cfg.file_kb)

    if args.impor_lama:
        if cfg.model_embedding != 'gemini':
            raise SystemExit('--impor-lama hanya untuk embedding Gemini.')
        impor_embedding_lama(kb, args.impor_lama / 'embeddings.npy', args.impor_lama / 'embedding_ids.json', cfg.folder_indeks)

    # vektor dari indeks lain dengan model yang sama ikut dipakai ulang (versi pecah <-> tidak pecah)
    saudara = cfg.folder_output / f"indeks_{cfg.model_embedding}{'' if cfg.pecah_huruf else '_pecah'}"
    indeks = bangun_indeks(kb, buat_embedder(cfg), cfg.folder_indeks, folder_tambahan=[saudara])
    print(f'Indeks {cfg.model_embedding}: {len(indeks.ids)} vektor x {indeks.vektor.shape[1]} angka -> {cfg.folder_indeks}')


if __name__ == '__main__':
    main()
