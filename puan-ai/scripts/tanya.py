"""Coba ngobrol dengan Puan AI dari terminal (riwayat percakapan ikut terbawa).

Contoh:
    python scripts/tanya.py "dc nagih ke kantor aku, boleh gak?"
    python scripts/tanya.py            # mode ngobrol; ketik 'keluar' untuk berhenti
    python scripts/tanya.py --detail "..."   # tampilkan juga kueri, skor, dan pasal yang terambil
"""
from _umum import argumen_umum, pengaturan_dari

from puan_rag import Pesan, PuanAI


def tampilkan(h, detail):
    print('\n' + h.jawaban)
    if detail:
        print(f'\n  [status: {h.status} | krisis: {h.krisis} | skor tertinggi: {h.skor_tertinggi}]')
        print(f'  [kueri : {h.kueri}]')
        for s in h.sumber:
            print(f"  [{s['peran']:7}] {s['label']}")


def main():
    p = argumen_umum('Ngobrol dengan Puan AI')
    p.add_argument('pesan', nargs='?', help='pesan (kosongkan untuk mode ngobrol)')
    p.add_argument('--detail', action='store_true')
    args = p.parse_args()
    puan = PuanAI.dari_folder(pengaturan_dari(args))
    if args.pesan:
        tampilkan(puan.jawab(args.pesan), args.detail)
        return
    riwayat = []
    while True:
        pesan = input('\nKamu: ').strip()
        if pesan.lower() in ('keluar', 'exit', 'quit', ''):
            break
        h = puan.jawab(pesan, riwayat)
        tampilkan(h, args.detail)
        riwayat += [Pesan('user', pesan), Pesan('puan', h.jawaban)]


if __name__ == '__main__':
    main()
