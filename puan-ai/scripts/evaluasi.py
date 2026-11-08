"""Langkah 3: ukur kualitas PENCARIAN pasal dengan 50 soal uji (data/referensi/soal_uji_puan_ai.xlsx).

Yang diukur:
  Kena                    : % soal yang minimal satu pasal kuncinya ikut terambil (target >= 85%)
  MRR                     : seberapa tinggi posisi pasal kunci (1,00 = selalu urutan pertama)
  Lintas (semua dok kena) : % soal lintas dokumen yang mendapat pasal dari SETIAP dokumen kuncinya
  Rata2 bahan (kata)      : panjang bahan bacaan yang dikirim ke Gemini (makin panjang = makin lambat & rawan bingung)

Perbandingan yang adil: kueri tulis ulang dibuat SEKALI lalu dipakai sama untuk semua model dan semua versi,
jadi yang berbeda hanya model embedding / cara memotong. Kueri dan vektor soal disimpan (cache), sehingga
menjalankan ulang tidak memakai kuota lagi.

Contoh:
    python scripts/evaluasi.py --model gemini
    python scripts/evaluasi.py --model gemini e5 --pecah 0 1 --grid
    python scripts/evaluasi.py --model gemini --kueri-dari /content/drive/MyDrive/edupuan-rag/output/hasil_uji_1.xlsx
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
from _umum import ROOT  # noqa: F401  (menambahkan folder proyek ke sys.path)

from puan_rag import knowledge_base as K
from puan_rag.chatbot import PuanAI
from puan_rag.config import Pengaturan
from puan_rag.embedding import buat_embedder
from puan_rag.gemini import GeminiLLM, buat_client
from puan_rag.indeks import Indeks
from puan_rag.retrieval import Pencari

GRID = [(8, 3), (12, 3), (8, 4), (12, 4), (16, 5)]      # (K_CHILD, MAKS_UTAMA)


# ------------------------------------------------------------------------------------------------
def baca_soal(file):
    soal = pd.read_excel(file, header=3)
    soal = soal[soal['Pertanyaan'].notna()].reset_index(drop=True)
    soal['kunci'] = soal['Kunci pasal'].apply(
        lambda s: [k.strip() for k in str(s).split(';') if k.strip() not in ('', '-', 'nan')])
    return soal


def siapkan_kueri(soal, cfg, file_cache, kueri_dari=None, client=None):
    """Kueri tulis ulang untuk setiap soal (dari cache / file uji lama / dibuat baru dengan Gemini)."""
    cache = json.loads(file_cache.read_text(encoding='utf-8')) if file_cache.exists() else {}
    if kueri_dari:
        lama = pd.read_excel(kueri_dari)
        for _, r in lama.iterrows():
            p = soal.loc[soal['No'] == r['No'], 'Pertanyaan']
            if len(p):
                cache[p.iloc[0]] = str(r['Kueri tulis ulang'])
    perlu = [q for q in soal['Pertanyaan'] if q not in cache]
    if perlu:
        print(f'Menulis ulang {len(perlu)} soal dengan Gemini...')
        kamus = json.loads(cfg.file_kamus.read_text(encoding='utf-8'))
        penulis = PuanAI(cfg, GeminiLLM(client or buat_client(), cfg.model_cadangan), pencari=None, kamus=kamus)
        for q in perlu:
            cache[q] = penulis.tulis_ulang(q)
            file_cache.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding='utf-8')
            time.sleep(2)
    file_cache.parent.mkdir(parents=True, exist_ok=True)
    file_cache.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding='utf-8')
    return cache


def siapkan_vektor(teks_list, embedder, file_cache):
    """Vektor kueri per model, disimpan supaya tidak di-embed ulang."""
    cache = json.loads(file_cache.read_text()) if file_cache.exists() else {}
    perlu = [t for t in dict.fromkeys(teks_list) if t not in cache]
    if perlu:
        print(f'  embed {len(perlu)} kueri dengan model {embedder.nama}...')
        for mulai in range(0, len(perlu), 20):
            vek = embedder.embed_kueri(perlu[mulai:mulai + 20])
            cache.update({t: v.tolist() for t, v in zip(perlu[mulai:mulai + 20], vek)})
        file_cache.write_text(json.dumps(cache))
    return {t: np.asarray(cache[t], dtype='float32') for t in teks_list}


# ------------------------------------------------------------------------------------------------
def nilai_satu(soal, kueri, vektor, pencari, k_child=None, maks_utama=None):
    baris = []
    for _, r in soal.iterrows():
        q, kunci = r['Pertanyaan'], r['kunci']
        kq = kueri[q]
        di_luar = 'DI_LUAR_TOPIK' in kq
        konteks = {'parents': [], 'skor_tertinggi': None} if di_luar else \
            pencari.cari_dari_vektor(vektor[q + '\n' + kq], k_child=k_child, maks_utama=maks_utama)
        terambil = [pid for pid, _ in konteks['parents']]
        posisi = next((n + 1 for n, pid in enumerate(terambil) if pid in kunci), None)
        if kunci:
            status = 'KENA' if posisi else 'MELESET'
        elif di_luar:
            status = 'DITOLAK (di luar topik)'
        else:
            status = 'ADA PASAL — cek jawabannya' if terambil else 'TIDAK ADA PASAL'
        dok_kunci = {k.split(':')[0] for k in kunci}
        dok_kena = {pid.split(':')[0] for pid in terambil if pid in kunci}
        baris.append({
            'No': int(r['No']), 'Jenis': r['Jenis'], 'Pertanyaan': q, 'Kunci': '; '.join(kunci) or '-',
            'Kueri tulis ulang': kq,
            'Skor teratas': round(konteks['skor_tertinggi'], 3) if konteks['skor_tertinggi'] is not None else None,
            'Parent terambil': '; '.join(terambil), 'Posisi kunci': posisi, 'Status': status,
            'Semua dokumen kunci kena': (dok_kunci == dok_kena) if kunci else None,
            'Panjang bahan (kata)': len(pencari.susun_bahan(konteks).split()) if terambil else 0,
        })
    return pd.DataFrame(baris)


def ringkas(h):
    d = h[h['Kunci'] != '-']
    lintas = d[d['Jenis'] == 'Lintas dokumen']
    luar = h[h['Kunci'] == '-']
    hasil = {
        'Kena': round((d['Status'] == 'KENA').mean() * 100, 1),
        'MRR': round(d['Posisi kunci'].apply(lambda p: 1 / p if pd.notna(p) else 0).mean(), 2),
        'Lintas ≥1 kena': round((lintas['Status'] == 'KENA').mean() * 100, 1) if len(lintas) else None,
        'Lintas semua dok kena': round(lintas['Semua dokumen kunci kena'].astype(bool).mean() * 100, 1) if len(lintas) else None,
        'Di luar cakupan ditolak/kosong': f"{luar['Status'].isin(['DITOLAK (di luar topik)', 'TIDAK ADA PASAL']).sum()}/{len(luar)}",
        'Rata2 bahan (kata)': int(np.nan_to_num(h.loc[h['Panjang bahan (kata)'] > 0, 'Panjang bahan (kata)'].mean())),
    }
    for jenis, g in d.groupby('Jenis'):
        hasil[f'Kena: {jenis}'] = round((g['Status'] == 'KENA').mean() * 100, 1)
    return hasil


def kalibrasi(soal, vektor_mentah, pencari):
    """Bandingkan skor tertinggi soal yang PUNYA kunci vs soal di luar cakupan -> usulan ambang."""
    rows = []
    for _, r in soal.iterrows():
        top = float(pencari.indeks.skor(vektor_mentah[r['Pertanyaan']]).max())
        rows.append({'No': int(r['No']), 'Jenis': r['Jenis'], 'Punya kunci': bool(r['kunci']), 'Skor teratas (pesan saja)': round(top, 3)})
    df = pd.DataFrame(rows)
    dalam = df.loc[df['Punya kunci'], 'Skor teratas (pesan saja)']
    luar = df.loc[~df['Punya kunci'], 'Skor teratas (pesan saja)']
    batas_bawah, batas_atas = float(np.percentile(dalam, 5)), float(luar.max())
    usulan = round((batas_bawah + batas_atas) / 2, 2) if batas_bawah > batas_atas else None
    return df, {'5% terendah soal relevan': round(batas_bawah, 3), 'tertinggi soal di luar cakupan': round(batas_atas, 3),
                'usulan ambang': usulan}


# ------------------------------------------------------------------------------------------------
def main():
    p = argparse.ArgumentParser(description='Evaluasi pencarian pasal Puan AI')
    p.add_argument('--model', nargs='+', choices=['gemini', 'e5'], default=['gemini'])
    p.add_argument('--pecah', nargs='+', type=int, choices=[0, 1], default=[0], help='0 = tanpa pecah huruf, 1 = pecah huruf')
    p.add_argument('--grid', action='store_true', help='bandingkan juga beberapa pengaturan K_CHILD / MAKS_UTAMA')
    p.add_argument('--kueri-dari', type=Path, help='pakai kueri dari hasil_uji_1.xlsx notebook lama (perbandingan adil dengan uji 1–2)')
    p.add_argument('--ambang', type=float, help='coba ambang lain (bawaan: per model di puan_rag/config.py)')
    p.add_argument('--keluaran', type=Path, default=None)
    p.add_argument('--palsu', action='store_true', help='UJI MEKANIK SAJA: embedder & Gemini tiruan, skor tidak bermakna')
    args = p.parse_args()

    cfg0 = Pengaturan()
    soal = baca_soal(cfg0.file_soal)
    client = None
    if args.palsu:                                    # khusus uji mekanik tanpa API key
        from puan_rag.palsu import EmbedderKata, LLMPalsu
        kueri = {q: LLMPalsu().tulis('', q, sistem='KUERI PENCARIAN') for q in soal['Pertanyaan']}
    else:
        kueri = siapkan_kueri(soal, cfg0, cfg0.folder_output / 'cache_kueri.json', args.kueri_dari)
    print(f'{len(soal)} soal | kueri tulis ulang siap\n')

    ringkasan, detail, kal = [], {}, {}
    for model in args.model:
        cfg_m = Pengaturan(model_embedding=model)
        embedder = EmbedderKata() if args.palsu else buat_embedder(cfg_m, client)
        teks = [q + '\n' + kueri[q] for q in soal['Pertanyaan'] if 'DI_LUAR_TOPIK' not in kueri[q]] + list(soal['Pertanyaan'])
        vektor = siapkan_vektor(teks, embedder, cfg0.folder_output / f"cache_vektor_soal_{'palsu' if args.palsu else model}.json")
        for pecah in args.pecah:
            ambang = args.ambang if args.ambang is not None else (0.05 if args.palsu else None)
            cfg = Pengaturan(model_embedding=model, pecah_huruf=bool(pecah), ambang=ambang)
            if not (cfg.folder_indeks / 'meta.json').exists():
                print(f'  [lewati] indeks {cfg.folder_indeks.name} belum ada. Jalankan: python scripts/buat_indeks.py --model {model}'
                      + (' --pecah-huruf' if pecah else ''))
                continue
            pencari = Pencari(K.muat(cfg.file_kb), Indeks.muat(cfg.folder_indeks), embedder, cfg)
            nama = f"{model}{' + pecah huruf' if pecah else ''}"
            h = nilai_satu(soal, kueri, vektor, pencari)
            detail[nama] = h
            ringkasan.append({'Versi': nama, 'K_CHILD': cfg.k_child, 'MAKS_UTAMA': cfg.maks_utama, 'Ambang': cfg.ambang, **ringkas(h)})
            if not pecah:
                kal[model] = kalibrasi(soal, vektor, pencari)
            if args.grid:
                for k, m in GRID:
                    if (k, m) != (cfg.k_child, cfg.maks_utama):
                        ringkasan.append({'Versi': nama, 'K_CHILD': k, 'MAKS_UTAMA': m, 'Ambang': cfg.ambang,
                                          **ringkas(nilai_satu(soal, kueri, vektor, pencari, k, m))})

    if not ringkasan:
        raise SystemExit('Tidak ada indeks yang bisa dievaluasi.')
    tabel = pd.DataFrame(ringkasan)
    pd.set_option('display.width', 250)
    print('================ RINGKASAN (Kena & Lintas dalam %) ================')
    print(tabel[['Versi', 'K_CHILD', 'MAKS_UTAMA', 'Kena', 'MRR', 'Lintas ≥1 kena', 'Lintas semua dok kena',
                 'Di luar cakupan ditolak/kosong', 'Rata2 bahan (kata)']].to_string(index=False))
    for nama, h in detail.items():
        d = h[(h['Kunci'] != '-') & (h['Status'] == 'MELESET')]
        print(f'\n--- {nama}: soal MELESET ({len(d)}) ---')
        for _, r in d.iterrows():
            print(f"  {r['No']:2}. {r['Pertanyaan'][:60]}\n      kunci: {r['Kunci']}\n      dapat: {r['Parent terambil']}")
    for model, (_, info) in kal.items():
        print(f'\n--- Kalibrasi ambang {model} (ambang di config.py: {Pengaturan(model_embedding=model).ambang}) ---')
        for k, v in info.items():
            print(f'  {k}: {v}')
        if info['usulan ambang'] is None:
            print('  Skor soal relevan dan di luar cakupan BERTUMPUK: ambang saja tidak cukup memisahkan;'
                  ' penolakan topik tetap mengandalkan DI_LUAR_TOPIK dari tahap tulis ulang.')

    keluaran = args.keluaran or (cfg0.folder_output / 'hasil_evaluasi.xlsx')
    with pd.ExcelWriter(keluaran) as w:
        tabel.to_excel(w, sheet_name='Ringkasan', index=False)
        for nama, h in detail.items():
            h.to_excel(w, sheet_name=nama[:31], index=False)
        for model, (df, _) in kal.items():
            df.to_excel(w, sheet_name=f'Kalibrasi {model}', index=False)
    print(f'\nDetail tersimpan di {keluaran}')


if __name__ == '__main__':
    main()
