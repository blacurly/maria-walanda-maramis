"""Kurasi hukum: pasal mana yang dipakai dan bagaimana pasal antar-dokumen saling terkait.

File ini adalah bagian yang paling perlu ditinjau oleh orang hukum (bukan programmer).
Sumber keputusan: data/referensi/daftar_pasal_puan_ai.xlsx (kolom "Ambil").
Kalau pasal ditambah/dibuang di sini, jalankan ulang: scripts/bangun_kb.py lalu scripts/buat_indeks.py.
"""


def rentang(*bagian):
    """rentang((1, 10), 15) -> {1, 2, ..., 10, 15}"""
    hasil = set()
    for b in bagian:
        if isinstance(b, tuple):
            hasil |= set(range(b[0], b[1] + 1))
        else:
            hasil.add(b)
    return hasil


# ---------------------------------------------------------------------------------------------
# Dokumen berbentuk pasal & ayat (POJK dan UU)
# loncat_maks: seberapa jauh nomor pasal boleh "loncat". UU PDP = 15 karena file koreksinya
#              hanya berisi pasal yang dipakai (nomornya tidak berurutan).
# bab_sanksi : pasal yang ISINYA memang sanksi (mis. ketentuan pidana). Pasal ini tetap dicari,
#              karena justru itu jawabannya kalau user bertanya soal hukuman.
# ---------------------------------------------------------------------------------------------
DOKUMEN_PASAL = [
    {
        'kode': 'POJK22', 'nama': 'POJK 22/2023',
        'file_batang': 'pojk_22_2023_batang.txt', 'file_penjelasan': 'pojk_22_2023_penjelasan.txt',
        'pasal_diambil': rentang((1, 10), (19, 24), (29, 40), (44, 84), (92, 100), (113, 114)),
        'bab_sanksi': rentang((113, 114)), 'loncat_maks': 1,
    },
    {
        'kode': 'POJK40', 'nama': 'POJK 40/2024',
        'file_batang': 'pojk_40_2024_batang.txt', 'file_penjelasan': 'pojk_40_2024_penjelasan.txt',
        'pasal_diambil': rentang(1, 56, (83, 84), 96, (137, 150), 158, (164, 165), 179),
        'bab_sanksi': set(), 'loncat_maks': 1,
    },
    {
        'kode': 'UUPDP', 'nama': 'UU 27/2022 (PDP)',
        # teks UU PDP hasil scan rusak saat diekstrak -> dipakai versi koreksi manual dari gambar scan
        'file_batang': 'uu_27_2022_pdp_batang_koreksi.txt', 'file_penjelasan': 'uu_27_2022_pdp_penjelasan_koreksi.txt',
        'pasal_diambil': rentang((1, 16), (20, 26), 30, 32, (35, 46), (57, 60), (64, 70)),
        'bab_sanksi': rentang(57, (67, 70)), 'loncat_maks': 15,
    },
]

# ---------------------------------------------------------------------------------------------
# SEOJK berbentuk bagian romawi > angka > huruf
# ---------------------------------------------------------------------------------------------
SEOJK = {
    'kode': 'SEOJK19', 'nama': 'SEOJK 19/2025', 'file_batang': 'seojk_19_2025_batang.txt',
    'romawi_diambil': {'I', 'IV', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XIV', 'XV', 'XVII', 'XIX', 'XX'},
}

# ---------------------------------------------------------------------------------------------
# Tautan antar-dokumen (ditulis manual). Kalau parent A terambil, parent B ikut jadi kandidat tambahan.
# Kode tanpa angka (mis. 'SEOJK19:XIV') = semua angka di bagian itu. Pakai sesedikit mungkin:
# tautan level bagian terbukti membanjiri satu pasal dengan terlalu banyak tautan.
# ---------------------------------------------------------------------------------------------
TERKAIT = [
    # (kode A, kode B, alasan)
    ('SEOJK19:XIV.3',  'POJK40:140', 'Angka batas maksimum manfaat ekonomi (bunga/biaya) per hari'),
    ('SEOJK19:XIV.4',  'POJK40:140', 'Batas maksimum denda keterlambatan'),
    ('SEOJK19:XIV.5',  'POJK40:140', 'Total manfaat ekonomi + denda maksimal 100% nilai pinjaman'),
    ('SEOJK19:X.1',    'POJK40:137', 'Batas maksimum pendanaan per peminjam'),
    ('SEOJK19:VI.1',   'POJK40:142', 'Informasi wajib di aplikasi pinjol'),
    ('SEOJK19:VI.2',   'POJK40:142', 'Peringatan risiko wajib di aplikasi'),
    ('SEOJK19:VII.1',  'POJK40:164', 'Aplikasi hanya boleh akses kamera, lokasi, mikrofon'),
    ('SEOJK19:VII.2',  'POJK40:164', 'Larangan menyebarkan data pribadi pengguna'),
    ('SEOJK19:VII.2',  'UUPDP:65',   'Larangan mengungkapkan data pribadi orang lain'),
    ('SEOJK19:VII.10', 'POJK40:165', 'Penghapusan data pribadi'),
    ('SEOJK19:IV.1',   'POJK40:56',  'Alih daya pekerjaan ke pihak ketiga'),
    ('SEOJK19:IV.11',  'POJK40:56',  'Penyelenggara tetap bertanggung jawab atas pihak ketiga'),
    ('SEOJK19:XV.1',   'POJK40:148', 'Mitigasi risiko termasuk penagihan'),
    ('SEOJK19:XIX.1',  'POJK40:145', 'Perjanjian pendanaan yang seimbang dan adil'),
    ('SEOJK19:VIII.1', 'POJK22:62',  'Kontak darurat bukan untuk ditagih; penagihan tidak kepada pihak lain'),
    ('SEOJK19:XX.8',   'POJK40:56',  'Penagihan boleh lewat pihak lain (alih daya)'),
    ('SEOJK19:XX.9',   'POJK22:62',  'Penagihan wajib sesuai aturan pelindungan konsumen'),
    ('SEOJK19:XX.4',   'POJK40:96',  'Pengalihan portofolio saat penyelenggara bermasalah'),
    ('POJK40:179',     'POJK22:3',   'POJK 40 menunjuk prinsip pelindungan konsumen POJK 22'),
    ('POJK40:164',     'UUPDP:20',   'Persetujuan sebagai dasar pengambilan data pribadi'),
    ('POJK40:165',     'UUPDP:43',   'Kewajiban menghapus data pribadi'),
    ('POJK22:19',      'UUPDP:20',   'Data konsumen dan dasar pemrosesan data pribadi'),
    ('POJK22:62',      'UUPDP:65',   'Menyebarkan utang ke kontak = mengungkapkan data pribadi orang lain'),
    ('POJK22:62',      'UUPDP:67',   'Ancaman pidana atas pengungkapan data pribadi'),
]

# ---------------------------------------------------------------------------------------------
# Penanda ayat sanksi. Ayat yang hanya berisi ancaman sanksi TIDAK ikut dicari (isinya mirip satu
# sama lain dan "menyedot" pertanyaan apa pun yang menyebut sanksi), tapi tetap ada di teks pasal
# induk yang dibaca Gemini. Pola ini sudah diperluas setelah uji 1 (22 ayat POJK 22 sempat lolos).
# ---------------------------------------------------------------------------------------------
POLA_SANKSI = (r'dikenai sanksi|dikenakan sanksi|tidak memenuhi (pelaksanaan )?sanksi'
               r'|^\(\d+\) Sanksi (administratif|denda|sebagaimana)')

# Aturan pecah "daftar panjang" per huruf (opsi PUAN_PECAH_HURUF). Child dengan teks >= MIN_KATA kata
# dan >= MIN_HURUF butir a., b., c. dipecah jadi satu child per huruf.
PECAH_MIN_KATA = 80
PECAH_MIN_HURUF = 5
