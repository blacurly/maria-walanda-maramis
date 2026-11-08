"""Rekap ANONIM topik pertanyaan Puan AI ke tabel Supabase `statistik_puan`.

Yang dicatat HANYA: topik, situasi, status, krisis, durasi_ms (waktu dicatat otomatis oleh database).
TIDAK PERNAH mencatat isi pesan, nama, nomor HP, alamat IP, atau ID pengguna.

Pencatatan hanya aktif jika ketiga pengaturan ini ada:
  PUAN_CATAT_STATISTIK=1, SUPABASE_URL, SUPABASE_SECRET_KEY
Jadi pytest dan evaluasi di laptop tidak mengotori rekap, kecuali sengaja dinyalakan.
Kalau pencatatan gagal (internet putus, kunci salah), jawaban Puan TETAP terkirim ke user.
"""
from __future__ import annotations

import json
import logging
import os
import re
import urllib.request

log = logging.getLogger('puan_ai')

# Daftar label yang disetujui (8 Nov 2026). Topik → situasi yang boleh dipilih.
LABEL = {
    'penagihan': ['ditagih_terus_menerus', 'menghubungi_orang_lain', 'ancaman_kata_kasar', 'data_foto_disebar',
                  'tanya_aturan_penagihan', 'lainnya'],
    'biaya': ['tagihan_membengkak', 'bingung_hitungan', 'biaya_tidak_transparan', 'lainnya'],
    'legalitas': ['cek_sebelum_pinjam', 'terlanjur_pinjol_ilegal', 'lainnya'],
    'tidak_sanggup_bayar': ['minta_keringanan', 'gali_lubang', 'bingung_mulai', 'lainnya'],
    'data_pribadi': ['akses_data_hp', 'pinjaman_atas_nama_orang', 'minta_hapus_data', 'lainnya'],
    'pengaduan': ['cara_melapor', 'laporan_tidak_ditanggapi', 'lainnya'],
    'keluarga': ['takut_cerita_keluarga', 'lainnya'],
    'lainnya': ['lainnya'],
}

_CARI_LABEL = re.compile(r'^\s*LABEL\s*:\s*([A-Za-z_]+)\s*/\s*([A-Za-z_]+)', re.MULTILINE)
_BARIS_LABEL = re.compile(r'^\s*LABEL\s*:.*$', re.MULTILINE | re.IGNORECASE)


def teks_daftar_label() -> str:
    """Daftar label untuk ditempel di akhir instruksi tulis ulang."""
    baris = [f'- {topik}: {", ".join(situasi)}' for topik, situasi in LABEL.items()]
    return '\n\nDAFTAR LABEL (topik: situasi yang boleh dipilih):\n' + '\n'.join(baris) + '\n'


def pisahkan_label(keluaran: str) -> tuple[str, str, str]:
    """Memisahkan hasil tulis ulang menjadi (kueri, topik, situasi).

    Label yang tidak ada di daftar diganti 'lainnya', supaya isi tabel selalu rapi.
    """
    keluaran = keluaran or ''
    cocok = _CARI_LABEL.search(keluaran)
    kueri = _BARIS_LABEL.sub('', keluaran).strip()
    topik, situasi = 'lainnya', 'lainnya'
    if cocok:
        t, s = cocok.group(1).lower(), cocok.group(2).lower()
        if t in LABEL:
            topik = t
            situasi = s if s in LABEL[t] else 'lainnya'
    return kueri, topik, situasi


def aktif() -> bool:
    return (os.environ.get('PUAN_CATAT_STATISTIK') == '1'
            and bool(os.environ.get('SUPABASE_URL'))
            and bool(os.environ.get('SUPABASE_SECRET_KEY')))


def catat(topik: str, situasi: str, status: str, krisis: bool, durasi_ms: int, batas_waktu: float = 2.0) -> bool:
    """Menulis 1 baris rekap anonim. Mengembalikan True jika berhasil. Tidak pernah melempar error."""
    if not aktif():
        return False
    kunci = os.environ['SUPABASE_SECRET_KEY']
    alamat = os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1/statistik_puan'
    isi = json.dumps({
        'topik': topik, 'situasi': situasi, 'status': status,
        'krisis': bool(krisis), 'durasi_ms': max(0, int(durasi_ms)),
    }).encode('utf-8')
    header = {'apikey': kunci, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}
    # Kunci baru (sb_secret_...) cukup di header apikey. Kunci lama (service_role, berbentuk JWT "eyJ...")
    # juga perlu dikirim di header Authorization supaya dikenali sebagai service_role.
    if kunci.startswith('eyJ'):
        header['Authorization'] = f'Bearer {kunci}'
    permintaan = urllib.request.Request(alamat, data=isi, method='POST', headers=header)
    try:
        with urllib.request.urlopen(permintaan, timeout=batas_waktu) as r:
            return 200 <= r.status < 300
    except Exception as e:  # noqa: BLE001 — pencatatan tidak boleh mengganggu jawaban
        kode = getattr(e, 'code', '')
        pesan = ''
        if hasattr(e, 'read'):
            try:
                pesan = e.read().decode('utf-8', 'replace')[:200]   # pesan error dari Supabase, tanpa kunci
            except Exception:  # noqa: BLE001
                pesan = ''
        log.warning('statistik: gagal mencatat (%s %s) %s', type(e).__name__, kode, pesan)
        return False