"""Langkah 4: Puan AI menjawab LENGKAP sebagian soal uji, lalu manusia menilai jawabannya.

Evaluasi pencarian (evaluasi.py) hanya mengukur apakah pasalnya ketemu. Langkah ini mengecek hal yang tidak bisa
dihitung otomatis: nada hangat, ketepatan hukum, kejujuran saat tidak tahu, dan arahan ke fitur/lembaga.
Hasil: output/uji_jawaban.xlsx dengan kolom penilaian kosong untuk diisi (sebaiknya oleh orang hukum).

Contoh:
    python scripts/uji_jawaban.py                         # bawaan: 10 soal di luar cakupan + 5 soal yang pernah meleset
    python scripts/uji_jawaban.py --soal 1-12              # semua soal curhat
    python scripts/uji_jawaban.py --soal 1,5,22,41-50 --pecah-huruf
"""
import time

import pandas as pd
from _umum import argumen_umum, pengaturan_dari

from puan_rag import PuanAI

BAWAAN = '41-50,12,32,35,38,40'


def urai_nomor(teks):
    hasil = []
    for bagian in teks.split(','):
        if '-' in bagian:
            a, b = bagian.split('-')
            hasil += list(range(int(a), int(b) + 1))
        elif bagian.strip():
            hasil.append(int(bagian))
    return hasil


def main():
    p = argumen_umum('Uji jawaban lengkap Puan AI untuk dinilai manusia')
    p.add_argument('--soal', default=BAWAAN, help=f'nomor soal (bawaan: {BAWAAN})')
    p.add_argument('--jeda', type=float, default=6, help='jeda antar soal dalam detik (jaga kuota)')
    args = p.parse_args()
    cfg = pengaturan_dari(args)
    puan = PuanAI.dari_folder(cfg)

    soal = pd.read_excel(cfg.file_soal, header=3)
    soal = soal[soal['No'].isin(urai_nomor(args.soal))]
    baris = []
    for _, r in soal.iterrows():
        h = puan.jawab(r['Pertanyaan'])
        print(f"\n{'=' * 80}\n{int(r['No'])}. {r['Pertanyaan']}\n[{h.status}] {', '.join(s['label'] for s in h.sumber) or '-'}\n{'-' * 80}\n{h.jawaban}")
        baris.append({
            'No': int(r['No']), 'Jenis': r['Jenis'], 'Pertanyaan': r['Pertanyaan'],
            'Perilaku yang diharapkan': r.get('Perilaku yang diharapkan', ''),
            'Status': h.status, 'Krisis': h.krisis, 'Kueri tulis ulang': h.kueri,
            'Pasal terambil': '; '.join(s['label'] for s in h.sumber), 'Jawaban Puan AI': h.jawaban,
            'Hangat & tidak menghakimi (1-3)': '', 'Akurat secara hukum (Ya/Tidak/-)': '',
            'Jujur saat tidak tahu (Ya/Tidak/-)': '', 'Arahan fitur/lembaga tepat (Ya/Tidak/-)': '',
            'Ada pasal/angka karangan? (Ya/Tidak)': '', 'Catatan penilai': '',
        })
        time.sleep(args.jeda)
    keluaran = cfg.folder_output / f'uji_jawaban{cfg.akhiran}.xlsx'
    pd.DataFrame(baris).to_excel(keluaran, index=False)
    print(f'\nTersimpan di {keluaran}. Isi kolom penilaian, terutama "Ada pasal/angka karangan?" (target: 0 Ya).')


if __name__ == '__main__':
    main()
