"""Membangun knowledge base parent-child dari teks peraturan yang sudah dibersihkan.

- PARENT (induk) = satu pasal utuh (POJK/UU) atau satu angka (SEOJK). Inilah yang dibaca Gemini saat menjawab.
- CHILD  (anak)  = potongan kecil di dalam parent: ayat (POJK/UU), huruf (SEOJK panjang), atau definisi.
                   Child dipakai untuk PENCARIAN karena potongan kecil lebih tepat dicocokkan dengan pertanyaan.

Alurnya: cari child yang paling mirip -> naik ke parent-nya -> parent dikirim ke Gemini sebagai bahan bacaan.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from . import kurasi

# =============================================================================================
# 1. POJK & UU: pasal -> ayat
# =============================================================================================

def _rapikan_pasal(baris_list):
    """Gabungkan baris yang terpotong, tapi pertahankan baris baru untuk awal daftar (a., 1., (1))."""
    hasil = []
    for b in baris_list:
        b = b.strip()
        if not b:
            continue
        awal_daftar = re.match(r'^(\(\d+\)|[a-z]\.|\d+\.|\d+\)|Huruf [a-z]$|Angka \d+$)\s?', b)
        if hasil and not awal_daftar:
            hasil[-1] += b if (hasil[-1].endswith('-') and b[:1].islower()) else ' ' + b
        else:
            hasil.append(b)
    return '\n'.join(hasil)


def _potong_pasal(teks, loncat_maks=1):
    """Pecah batang tubuh jadi daftar pasal, sambil mencatat BAB/Bagian/Paragraf tempat pasal itu berada."""
    baris = teks.split('\n')
    pola_judul = r'^(BAB [IVXLC]+|Bagian [A-Z][a-z]+|Paragraf \d+|Pasal \d+)$'
    posisi = {'bab': '', 'bagian': '', 'paragraf': ''}
    pasal_list, sekarang, nomor_terakhir = [], None, 0
    i = 0
    while i < len(baris):
        b = baris[i].strip()
        if re.match(pola_judul, b) and not b.startswith('Pasal'):
            judul, j = [], i + 1                       # judul bisa berlanjut beberapa baris
            while j < len(baris) and baris[j].strip() and not re.match(pola_judul, baris[j].strip()):
                judul.append(baris[j].strip())
                j += 1
            nama = f"{b} {' '.join(judul)}"
            if b.startswith('BAB'):
                posisi = {'bab': nama, 'bagian': '', 'paragraf': ''}
            elif b.startswith('Bagian'):
                posisi['bagian'], posisi['paragraf'] = nama, ''
            else:
                posisi['paragraf'] = nama
            i = j
            continue
        m = re.match(r'^Pasal (\d+)$', b)
        # nomor pasal harus naik (cegah "Pasal 10" di dalam kalimat rujukan terbaca sebagai pasal baru)
        if m and nomor_terakhir < int(m.group(1)) <= nomor_terakhir + loncat_maks:
            nomor_terakhir = int(m.group(1))
            sekarang = {'pasal': nomor_terakhir, **posisi, 'baris': []}
            pasal_list.append(sekarang)
        elif sekarang is not None:
            sekarang['baris'].append(b)
        i += 1
    return pasal_list


def _potong_ayat(teks_pasal):
    """Pecah teks pasal per ayat (1), (2), ... yang berurutan. Tanpa ayat -> satu bagian utuh."""
    ayat, nomor = [], 0
    for b in teks_pasal.split('\n'):
        m = re.match(r'^\((\d+)\)\s', b)
        if m and int(m.group(1)) == nomor + 1:
            nomor += 1
            ayat.append([nomor, b])
        elif ayat:
            ayat[-1][1] += '\n' + b
        else:
            ayat.append([None, b])
    return ayat if ayat and ayat[0][0] is not None else [[None, teks_pasal]]


def _potong_penjelasan(teks):
    """Penjelasan pasal demi pasal -> {nomor_pasal: {'umum': teks, nomor_ayat: teks}}."""
    baris = teks[teks.find('PASAL DEMI PASAL'):].split('\n')
    hasil, pasal, ayat, nomor_terakhir = {}, None, None, 0
    for b in baris:
        b = b.strip()
        m_pas = re.match(r'^Pasal (\d+)$', b)
        m_ay = re.match(r'^Ayat \((\d+)\)$', b)
        if m_pas and int(m_pas.group(1)) > nomor_terakhir:
            pasal = nomor_terakhir = int(m_pas.group(1))
            ayat = 'umum'
            hasil[pasal] = {'umum': []}
            continue
        if pasal is None or not b:
            continue
        if m_ay:
            ayat = int(m_ay.group(1))
            hasil[pasal][ayat] = []
            continue
        hasil[pasal][ayat].append(b)
    bersih = {}
    for p, isi in hasil.items():
        for a, bl in isi.items():
            t = _rapikan_pasal(bl)
            t = re.sub(r'^((Huruf [a-z]|Angka \d+) )?Cukup jelas\.?$', '', t, flags=re.M)   # buang "Cukup jelas"
            t = re.sub(r'^(Huruf [a-z]|Angka \d+) ', r'\1: ', t, flags=re.M)
            t = re.sub(r'\n{2,}', '\n', t).strip()
            if len(t.split()) >= 5:
                bersih.setdefault(p, {})[a] = t
    return bersih


def _cari_rujukan(teks, pasal_sendiri):
    """Pasal lain di dokumen yang sama yang dirujuk: '...sebagaimana dimaksud dalam Pasal 8, Pasal 9, dan Pasal 13'."""
    hasil = set()
    pola = (r'dimaksud dalam ((?:Pasal \d+(?: ayat \(\d+\))?(?: huruf [a-z])?'
            r'(?:,\s*(?:dan(?:/atau)?\s+|atau\s+)?|\s+dan(?:/atau)?\s+|\s+atau\s+|\s+sampai dengan\s+)?)+)')
    for m in re.finditer(pola, teks):
        if re.match(r'\s*(Undang|Peraturan|UU)', teks[m.end():m.end() + 25]):   # rujukan ke peraturan lain
            continue
        daftar = m.group(1)
        nomor = [int(n) for n in re.findall(r'Pasal (\d+)', daftar)]
        for a, b in re.findall(r'Pasal (\d+)(?: ayat \(\d+\))?\s+sampai dengan\s+Pasal (\d+)', daftar):
            nomor += list(range(int(a), int(b) + 1))
        hasil |= set(nomor)
    hasil.discard(pasal_sendiri)
    return sorted(hasil)


def chunk_dokumen_pasal(dok, batang, penjelasan):
    kode, nama, diambil = dok['kode'], dok['nama'], dok['pasal_diambil']
    parents, children = [], []
    penj = _potong_penjelasan(penjelasan) if penjelasan else {}
    for p in _potong_pasal(batang, dok['loncat_maks']):
        if p['pasal'] not in diambil:
            continue
        teks = _rapikan_pasal(p['baris'])
        lokasi = ' › '.join(x for x in [nama, p['bab'], p['bagian'], p['paragraf']] if x)
        pid = f"{kode}:{p['pasal']}"
        penj_pasal = penj.get(p['pasal'], {})
        parents.append({'id': pid, 'dokumen': nama, 'pasal': p['pasal'], 'lokasi': lokasi, 'teks': teks,
                        'penjelasan': '\n'.join(penj_pasal.values()),
                        'rujukan': [f'{kode}:{n}' for n in _cari_rujukan(teks, p['pasal']) if n in diambil]})
        if p['pasal'] == 1:                                            # Pasal 1 = definisi: satu child per angka
            for d in re.split(r'\n(?=\d+\.\s)', teks)[1:]:
                n = d.split('.')[0]
                children.append({'id': f'{pid}.def{n}', 'parent_id': pid, 'jenis': 'definisi',
                                 'header': f'{lokasi} › Pasal 1 angka {n}', 'teks': d, 'penjelasan': ''})
            continue
        for nomor_ayat, isi in _potong_ayat(teks):
            label = f"Pasal {p['pasal']}" + (f' ayat ({nomor_ayat})' if nomor_ayat else '')
            sanksi = re.search(kurasi.POLA_SANKSI, isi) and p['pasal'] not in dok['bab_sanksi']
            tambahan = penj_pasal.get(nomor_ayat) or (penj_pasal.get('umum') if nomor_ayat is None else None)
            children.append({'id': pid + (f'.{nomor_ayat}' if nomor_ayat else ''), 'parent_id': pid,
                             'jenis': 'sanksi' if sanksi else 'isi', 'header': f'{lokasi} › {label}',
                             'teks': isi, 'penjelasan': tambahan or ''})
    return parents, children


# =============================================================================================
# 2. SEOJK: bagian romawi -> angka -> huruf
# =============================================================================================

def _rapikan_seojk(baris_list):
    hasil = []
    for b in baris_list:
        b = b.strip()
        if not b:
            continue
        awal_daftar = re.match(r'^(\d+\.|[a-z]\.|\d+\)|[a-z]\))\s', b) or b.startswith('Berikut simulasi')
        if hasil and not awal_daftar:
            hasil[-1] += b if (hasil[-1].endswith('-') and b[:1].islower()) else ' ' + b
        else:
            hasil.append(b)
    return '\n'.join(hasil)


def _potong_romawi(teks):
    baris = teks.split('\n')
    bagian, sekarang, i = [], None, 0
    while i < len(baris):
        b = baris[i].strip()
        m = re.match(r'^([IVX]+)\.\s+([A-Z][A-Z ,/()\-]+)$', b)
        if m:
            judul, j = [m.group(2)], i + 1
            while j < len(baris) and re.match(r'^[A-Z][A-Z ,/()\-]+$', baris[j].strip()):
                judul.append(baris[j].strip())
                j += 1
            sekarang = {'romawi': m.group(1), 'judul': ' '.join(judul), 'baris': []}
            bagian.append(sekarang)
            i = j
            continue
        if sekarang:
            sekarang['baris'].append(b)
        i += 1
    return bagian


def _potong_berurutan(teks, pola):
    """Pecah teks di penanda berurutan (1., 2., ... atau a., b., ...). Teks sebelum penanda pertama = pembuka."""
    potongan, pembuka, harap = [], [], 1
    for b in teks.split('\n'):
        m = re.match(pola, b)
        nomor = None
        if m:
            k = m.group(1)
            nomor = int(k) if k.isdigit() else ord(k) - 96
        if nomor == harap:
            potongan.append([m.group(1), b])
            harap += 1
        elif potongan:
            potongan[-1][1] += '\n' + b
        else:
            pembuka.append(b)
    return '\n'.join(pembuka), potongan


def chunk_seojk(dok, teks):
    kode, nama = dok['kode'], dok['nama']
    parents, children = [], []
    for bag in _potong_romawi(teks):
        r = bag['romawi']
        if r not in dok['romawi_diambil']:
            continue
        isi = _rapikan_seojk(bag['baris'])
        lokasi = f"{nama} › {r}. {bag['judul']}"
        _, angka_list = _potong_berurutan(isi, r'^(\d+)\.\s')
        if r == 'I':                                                   # Bagian I = definisi
            pid = f'{kode}:I'
            parents.append({'id': pid, 'dokumen': nama, 'pasal': 'I', 'lokasi': lokasi, 'teks': isi,
                            'penjelasan': '', 'rujukan': []})
            for n, d in angka_list:
                children.append({'id': f'{pid}.def{n}', 'parent_id': pid, 'jenis': 'definisi',
                                 'header': f'{lokasi} › angka {n}', 'teks': d, 'penjelasan': ''})
            continue
        for n, teks_angka in (angka_list or [[None, isi]]):
            pid = f'{kode}:{r}' + (f'.{n}' if n else '')
            label = f'{r}. angka {n}' if n else f'{r}.'
            simulasi = ''
            if '\nBerikut simulasi' in teks_angka:                     # contoh perhitungan dipisah jadi child sendiri
                teks_angka, simulasi = teks_angka.split('\nBerikut simulasi', 1)
                simulasi = 'Berikut simulasi' + simulasi
            rujukan = sorted({f'{kode}:{r}.{x}' for x in re.findall(r'dimaksud pada angka (\d+)', teks_angka) if x != n})
            parents.append({'id': pid, 'dokumen': nama, 'pasal': label, 'lokasi': lokasi,
                            'teks': teks_angka + ('\n' + simulasi if simulasi else ''), 'penjelasan': '', 'rujukan': rujukan})
            pembuka, huruf_list = _potong_berurutan(teks_angka, r'^([a-z])\.\s')
            if huruf_list and len(teks_angka.split()) > 120:            # angka panjang -> child per huruf
                for h, teks_huruf in huruf_list:
                    children.append({'id': f'{pid}.{h}', 'parent_id': pid, 'jenis': 'isi',
                                     'header': f'{lokasi} › {label} huruf {h}', 'teks': pembuka + '\n' + teks_huruf,
                                     'penjelasan': ''})
            else:
                children.append({'id': pid, 'parent_id': pid, 'jenis': 'isi', 'header': f'{lokasi} › {label}',
                                 'teks': teks_angka, 'penjelasan': ''})
            if simulasi:
                children.append({'id': f'{pid}.simulasi', 'parent_id': pid, 'jenis': 'contoh_perhitungan',
                                 'header': f'{lokasi} › {label} (simulasi perhitungan)', 'teks': simulasi,
                                 'penjelasan': ''})
    return parents, children


# =============================================================================================
# 3. Opsi: pecah "daftar panjang" per huruf
# =============================================================================================

_POLA_HURUF = re.compile(r'(?m)^([a-z])\. ')


def perlu_dipecah(c) -> bool:
    return (c['jenis'] != 'sanksi' and len(c['teks'].split()) >= kurasi.PECAH_MIN_KATA
            and len(_POLA_HURUF.findall(c['teks'])) >= kurasi.PECAH_MIN_HURUF)


def pecah_per_huruf(c):
    """Child berisi daftar a., b., c. -> satu child per huruf. Kalimat pembuka & penjelasan hurufnya ikut."""
    potongan = _POLA_HURUF.split(c['teks'])              # [pembuka, 'a', isi_a, 'b', isi_b, ...]
    pembuka = potongan[0].strip()
    bagian_penj = re.split(r'\n(?=Huruf [a-z]\b)', c.get('penjelasan') or '')
    penj_umum = bagian_penj[0] if not bagian_penj[0].startswith('Huruf ') else ''
    penj_huruf = {b[6]: b for b in bagian_penj if b.startswith('Huruf ')}
    return [{'id': f"{c['id']}.{h}", 'parent_id': c['parent_id'], 'jenis': 'isi',
             'header': f"{c['header']} huruf {h}", 'teks': f'{pembuka}\n{h}. {isi.strip()}',
             'penjelasan': '\n'.join(x for x in (penj_umum, penj_huruf.get(h, '')) if x)}
            for h, isi in zip(potongan[1::2], potongan[2::2])]


# =============================================================================================
# 4. Gabungkan semua dokumen + tautan antar-dokumen
# =============================================================================================

def _pasang_terkait(parents):
    id_parent = {p['id']: p for p in parents}

    def anggota(kode):
        return [kode] if kode in id_parent else [pid for pid in id_parent if pid.startswith(kode + '.')]

    for p in parents:
        p['terkait'] = []
    salah = []
    for a, b, _alasan in kurasi.TERKAIT:
        A, B = anggota(a), anggota(b)
        if not A or not B:
            salah.append((a, b))
            continue
        for x in A:
            for y in B:
                if y not in id_parent[x]['terkait']:
                    id_parent[x]['terkait'].append(y)
                if x not in id_parent[y]['terkait']:
                    id_parent[y]['terkait'].append(x)
    return salah


def periksa(kb) -> dict:
    """Pemeriksaan otomatis. Semua angka harus 0."""
    id_parent = {p['id'] for p in kb['parents']}
    id_child = [c['id'] for c in kb['children']]
    return {
        'ID parent dobel': len(kb['parents']) - len(id_parent),
        'ID child dobel': len(id_child) - len(set(id_child)),
        'child tanpa parent': sum(c['parent_id'] not in id_parent for c in kb['children']),
        'rujukan ke pasal yang tidak ada': sum(r not in id_parent for p in kb['parents'] for r in p['rujukan']),
        'tautan TERKAIT yang salah kode': len(kb.get('_terkait_salah', [])),
        'parent tanpa child yang bisa dicari': len(id_parent - {c['parent_id'] for c in kb['children'] if c['jenis'] != 'sanksi'}),
    }


def bangun(folder_bersih: Path, pecah_huruf: bool = False) -> dict:
    folder_bersih = Path(folder_bersih)
    baca = lambda nama: (folder_bersih / nama).read_text(encoding='utf-8')
    parents, children = [], []
    for dok in kurasi.DOKUMEN_PASAL:
        p, c = chunk_dokumen_pasal(dok, baca(dok['file_batang']), baca(dok['file_penjelasan']))
        parents += p
        children += c
    p, c = chunk_seojk(kurasi.SEOJK, baca(kurasi.SEOJK['file_batang']))
    parents += p
    children += c
    if pecah_huruf:
        children = [x for c in children for x in (pecah_per_huruf(c) if perlu_dipecah(c) else [c])]
    salah = _pasang_terkait(parents)
    kb = {'parents': parents, 'children': children, 'pecah_huruf': pecah_huruf}
    if salah:
        kb['_terkait_salah'] = salah
    return kb


def simpan(kb, file: Path):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(kb, ensure_ascii=False, indent=1), encoding='utf-8')


def muat(file: Path) -> dict:
    return json.loads(Path(file).read_text(encoding='utf-8'))


def child_dicari(kb):
    """Child yang ikut pencarian (ayat sanksi dilewati)."""
    return [c for c in kb['children'] if c['jenis'] != 'sanksi']


def teks_untuk_embed(c) -> str:
    """Yang diubah jadi vektor: alamat (header) + isi child + penjelasan resminya."""
    t = c['header'] + '\n' + c['teks']
    if c.get('penjelasan'):
        t += '\nPenjelasan: ' + c['penjelasan']
    return t


def label_sumber(p) -> str:
    """Label rapi untuk ditampilkan ke user: 'POJK 22/2023 Pasal 62' atau 'SEOJK 19/2025 angka romawi VIII angka 1'."""
    if isinstance(p['pasal'], int):
        return f"{p['dokumen'].replace(' (PDP)', '')} Pasal {p['pasal']}"
    romawi, _, angka = p['id'].split(':')[1].partition('.')
    return f"{p['dokumen']} angka romawi {romawi}" + (f' angka {angka}' if angka else '')
