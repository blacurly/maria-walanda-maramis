"""Tahap 0 (sekali saja): PDF peraturan -> teks bersih (batang tubuh + penjelasan).

Hasilnya SUDAH tersedia di data/bersih/, jadi tahap ini hanya perlu dijalankan kalau PDF-nya diganti.
Butuh program pdftotext (paket poppler-utils). Opsi -layout dipakai karena tanpa itu penanda ayat "(1)" hilang.

PENTING: UU 27/2022 (PDP) adalah PDF hasil scan yang rusak saat diekstrak ("Rp5.00O.OOO", "Pasa722", kata hilang).
Yang dipakai sistem adalah file KOREKSI manual (uu_27_2022_pdp_*_koreksi.txt) yang ditranskripsi dari gambar scan.
Menjalankan ulang tahap ini TIDAK menimpa file koreksi tersebut.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

SAMPAH = [
    r'^-\s*[\dtlIO ]{1,4}\s*-$',        # nomor halaman: -5- / - 84 - / -t2- (hasil scan)
    r'^https?://\S+$',                   # alamat website di kaki halaman
    r'^SK No\b.*$',                      # kode salinan Setneg (UU)
    r'^.{0,40}(\. \. \.|\.\.\.)$',       # penanda sambungan: "Pasal 66. . ."
]

# nama file, judul bagian pertama, judul penjelasan, apakah hasil scan
DOKUMEN = [
    ('pojk_22_2023', 'BAB I', 'PENJELASAN', False),
    ('pojk_40_2024', 'BAB I', 'PENJELASAN', False),
    ('uu_27_2022_pdp', 'BAB I', 'PENJEI,ASAN', True),     # ejaan rusak dari hasil scan, memang begitu di teksnya
    ('seojk_19_2025', 'I. KETENTUAN UMUM', None, False),
]


def _header_scan(b):
    """Header UU hasil scan: 'PRESIDEN' / 'REPUBLIK INDONESIA' dengan ejaan rusak."""
    return len(b) <= 25 and b.upper() == b and any(k in b for k in ['IDEN', 'IOEN', 'SID', 'NDONES', 'NOONES', 'BLIK'])


def ekstrak_pdf(pdf: Path, txt: Path):
    subprocess.run(['pdftotext', '-layout', str(pdf), str(txt)], check=True)


def bersihkan(teks_mentah, awal, judul_penjelasan=None, hasil_scan=False, lampiran='LAMPIRAN'):
    baris_bersih = []
    for halaman in teks_mentah.split('\f'):
        isi = 0
        for baris in halaman.split('\n'):
            b = re.sub(r'\s+', ' ', baris).strip()
            if b:
                isi += 1
            if any(re.match(p, b) for p in SAMPAH) or (hasil_scan and isi <= 4 and _header_scan(b)):
                continue
            baris_bersih.append(b)
    teks = re.sub(r'\n{3,}', '\n\n', '\n'.join(baris_bersih))
    teks = teks[teks.find(f'\n{awal}\n') + 1:]                 # buang pembukaan (Menimbang/Mengingat)
    if lampiran and f'\n{lampiran}\n' in teks:
        teks = teks[:teks.find(f'\n{lampiran}\n')]
    if judul_penjelasan:
        posisi = teks.find(f'\n{judul_penjelasan}\n')
        return teks[:posisi], teks[posisi + 1:]
    return teks, ''


def jalankan(folder_mentah: Path, folder_bersih: Path):
    folder_mentah, folder_bersih = Path(folder_mentah), Path(folder_bersih)
    folder_bersih.mkdir(parents=True, exist_ok=True)
    for nama, awal, judul_penj, scan in DOKUMEN:
        txt = folder_bersih / f'{nama}_mentah.txt'
        ekstrak_pdf(folder_mentah / f'{nama}.pdf', txt)
        batang, penj = bersihkan(txt.read_text(encoding='utf-8'), awal, judul_penj, scan)
        (folder_bersih / f'{nama}_batang.txt').write_text(batang, encoding='utf-8')
        if penj:
            (folder_bersih / f'{nama}_penjelasan.txt').write_text(penj, encoding='utf-8')
        print(f'{nama}: batang {len(batang.split()):,} kata, penjelasan {len(penj.split()):,} kata')
