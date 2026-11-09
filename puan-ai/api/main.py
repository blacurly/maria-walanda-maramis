"""Layanan API Puan AI (FastAPI) — dipanggil oleh web EduPuan (Next.js Route Handler).

Jalankan (dari folder puan-ai):
    uvicorn api.main:app --reload --port 8000
Lalu buka http://localhost:8000/docs untuk mencoba langsung dari browser.

Endpoint:
    GET  /health  -> cek layanan hidup + versi knowledge base yang dipakai
    POST /chat    -> {pesan, riwayat} -> {jawaban, status, krisis, sumber, topik, situasi}
    POST /umpan-balik -> {nilai, topik, situasi, status} -> {ok}   (suka/tidak suka, ANONIM, tanpa isi chat)

Environment variable:
    GEMINI_API_KEY     wajib
    PUAN_API_KEY       disarankan: kunci rahasia; Next.js harus mengirim header X-Puan-Key dengan nilai ini
    ALLOWED_ORIGINS    daftar origin web yang boleh memanggil langsung, dipisah koma (bawaan: http://localhost:3000)
    PUAN_EMBED         gemini | e5          PUAN_PECAH_HURUF  0 | 1
    PUAN_DEBUG         1 = sertakan kueri & skor di respons (jangan di produksi)
    PUAN_CATAT_STATISTIK, SUPABASE_URL, SUPABASE_SECRET_KEY   rekap & umpan balik anonim (lihat puan_rag/statistik.py)
"""
from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / '.env')
except ImportError:
    pass

# Server web: saat Gemini sibuk, coba 2 kali saja dengan jeda singkat (2 detik) supaya user tidak menunggu lama.
# Script di Colab/laptop tidak membaca baris ini, jadi tetap memakai jeda panjang.
os.environ.setdefault('PUAN_PERCOBAAN', '2')
os.environ.setdefault('PUAN_JEDA', '2')

from puan_rag import Pengaturan, Pesan, PuanAI  # noqa: E402
from puan_rag import statistik  # noqa: E402
from puan_rag.gemini import GeminiSibuk  # noqa: E402

log = logging.getLogger('puan_ai')


# ------------------------------------------------------------------ bentuk data
class PesanRiwayat(BaseModel):
    peran: Literal['user', 'puan']
    teks: str = Field(..., max_length=4000)


class PermintaanChat(BaseModel):
    pesan: str = Field(..., min_length=1, max_length=2000, examples=['DC nagih ke kantor dan bilang ke atasan aku, boleh gak?'])
    riwayat: list[PesanRiwayat] = Field(default_factory=list, max_length=20)


class Sumber(BaseModel):
    id: str
    label: str
    peran: str


Status = Literal['pasal', 'butuh_dana', 'di_luar_topik', 'tidak_ada_pasal']


class JawabanChat(BaseModel):
    jawaban: str
    status: Status   # 'butuh_dana' wajib ada di sini (jalur [F]); kalau tidak, jawaban BUTUH_DANA gagal dikirim (error 500)
    krisis: bool = Field(description='true jika pesan mengandung tanda krisis: web sebaiknya menampilkan info Healing119')
    sumber: list[Sumber]
    kueri: str | None = None
    skor_tertinggi: float | None = None
    topik: str | None = None      # label anonim [G], dipakai tombol suka/tidak suka di web
    situasi: str | None = None


class PermintaanUmpanBalik(BaseModel):
    nilai: Literal[1, -1]
    topik: str = Field(..., max_length=40)
    situasi: str = Field(..., max_length=40)
    status: Status


# ------------------------------------------------------------------ siklus hidup
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.puan, app.state.galat = None, None
    try:
        app.state.puan = PuanAI.dari_folder(Pengaturan())
        log.info('Puan AI siap.')
    except Exception as e:  # noqa: BLE001 - layanan tetap hidup agar /health bisa menjelaskan masalahnya
        app.state.galat = str(e)
        log.error('Puan AI gagal dimuat: %s', e)
    yield


app = FastAPI(title='Puan AI — EduPuan', version='1.0', lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',') if o.strip()],
    allow_methods=['GET', 'POST'],
    allow_headers=['Content-Type', 'X-Puan-Key'],
)


def ambil_puan() -> PuanAI:
    puan = app.state.puan
    if puan is None:
        raise HTTPException(503, f'Puan AI belum siap: {app.state.galat}')
    return puan


def cek_kunci(x_puan_key: str | None = Header(default=None)):
    kunci = os.getenv('PUAN_API_KEY')
    if kunci and x_puan_key != kunci:
        raise HTTPException(401, 'Kunci API tidak valid.')


# ------------------------------------------------------------------ endpoint
@app.get('/health')
def health():
    puan = app.state.puan
    if puan is None:
        return {'status': 'gagal', 'galat': app.state.galat}
    cfg = puan.cfg
    return {'status': 'ok', 'model_embedding': cfg.model_embedding, 'pecah_huruf': cfg.pecah_huruf, 'ambang': cfg.ambang,
            'jumlah_parent': len(puan.pencari.id_ke_parent), 'jumlah_child_dicari': len(puan.pencari.indeks.ids),
            'model_jawab': cfg.model_jawab}


@app.post('/chat', response_model=JawabanChat, response_model_exclude_none=True, dependencies=[Depends(cek_kunci)])
def chat(req: PermintaanChat, puan: PuanAI = Depends(ambil_puan)):
    # fungsi biasa (bukan async): FastAPI menjalankannya di thread terpisah sehingga panggilan Gemini tidak memblokir server
    try:
        h = puan.jawab(req.pesan, [Pesan(m.peran, m.teks) for m in req.riwayat])
    except GeminiSibuk:
        raise HTTPException(503, 'Puan AI sedang sibuk melayani banyak orang. Coba kirim lagi sebentar lagi ya.')
    except Exception:  # noqa: BLE001
        log.exception('Gagal menjawab')
        raise HTTPException(500, 'Maaf, ada gangguan saat menyiapkan jawaban. Coba lagi sebentar lagi ya.')
    data = h.ke_dict()
    if os.getenv('PUAN_DEBUG') != '1':
        data.pop('kueri', None)
        data.pop('skor_tertinggi', None)
    return data


@app.post('/umpan-balik', dependencies=[Depends(cek_kunci)])
def umpan_balik(req: PermintaanUmpanBalik):
    # Hanya nilai + label yang diterima. Isi pertanyaan/jawaban memang tidak ada di bentuk data ini.
    return {'ok': statistik.catat_umpan_balik(req.nilai, req.topik, req.situasi, req.status)}