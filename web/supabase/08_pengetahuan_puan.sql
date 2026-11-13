-- =====================================================================
-- 08_pengetahuan_puan.sql
-- VECTOR DATABASE untuk Puan AI (RAG) di Supabase pgvector.
-- Menggantikan indeks file lama (puan-ai/output/indeks_*/vektor.npy + meta.json).
--
--   dokumen_hukum   : "koleksi" — satu baris per peraturan (POJK 22/2023, dst.)
--   pasal           : satu pasal utuh (PARENT) — teksnya yang dibaca Gemini
--   pasal_tautan    : pasal yang saling merujuk (dalam dokumen) / terkait (antar-dokumen)
--   potongan_pasal  : potongan kecil yang DICARI (CHILD) + embedding-nya
--
-- Embedding: intfloat/multilingual-e5-small → 384 angka per potongan.
-- Diisi oleh skrip web/scripts/buat-indeks-puan.mjs; dicari oleh web/src/lib/puan/pencarian.ts.
-- Aman dijalankan ulang (if not exists / create or replace / drop if exists).
--
-- AKSES: RLS aktif. Publik hanya boleh MEMBACA (isi peraturan adalah dokumen publik).
--        Menambah/mengubah/menghapus hanya lewat skrip pembuat indeks (kunci secret).
-- =====================================================================

-- 0. Aktifkan pgvector (di Supabase, ekstensi disimpan di skema "extensions")
create extension if not exists vector with schema extensions;


-- 1. Dokumen hukum (koleksi) ------------------------------------------
create table if not exists public.dokumen_hukum (
  id           smallint generated always as identity primary key,
  kode         text not null unique check (kode ~ '^[A-Z0-9]+$'),       -- mis. POJK22
  judul        text not null unique check (length(trim(judul)) > 0),    -- mis. POJK 22/2023
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

drop trigger if exists dokumen_hukum_diubah_pada on public.dokumen_hukum;
create trigger dokumen_hukum_diubah_pada
  before update on public.dokumen_hukum
  for each row execute function public.atur_diubah_pada();


-- 2. Pasal (PARENT) ----------------------------------------------------
create table if not exists public.pasal (
  id           text primary key,                                        -- mis. POJK22:62
  dokumen_id   smallint not null
               references public.dokumen_hukum (id) on delete restrict,
  label        text not null check (length(trim(label)) > 0),           -- mis. POJK 22/2023 Pasal 62
  lokasi       text not null,                                           -- mis. POJK 22/2023 › BAB II › ...
  teks         text not null check (length(trim(teks)) > 0),
  penjelasan   text not null default '',
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

create index if not exists pasal_dokumen_idx on public.pasal (dokumen_id);

drop trigger if exists pasal_diubah_pada on public.pasal;
create trigger pasal_diubah_pada
  before update on public.pasal
  for each row execute function public.atur_diubah_pada();


-- 3. Tautan antar-pasal (banyak-ke-banyak) -----------------------------
create table if not exists public.pasal_tautan (
  pasal_id   text not null references public.pasal (id) on delete cascade,
  tujuan_id  text not null references public.pasal (id) on delete cascade,
  jenis      text not null check (jenis in ('rujukan', 'terkait')),
  primary key (pasal_id, tujuan_id),
  check (pasal_id <> tujuan_id)
);

create index if not exists pasal_tautan_tujuan_idx on public.pasal_tautan (tujuan_id);


-- 4. Potongan pasal (CHILD) + embedding --------------------------------
create table if not exists public.potongan_pasal (
  id           text primary key,                                        -- mis. POJK22:62.2
  pasal_id     text not null references public.pasal (id) on delete cascade,
  jenis        text not null check (jenis in ('isi', 'definisi', 'contoh_perhitungan')),
  header       text not null,
  teks         text not null check (length(trim(teks)) > 0),
  penjelasan   text not null default '',
  -- Sidik (hash) teks yang di-embed: kalau teks tidak berubah, embedding tidak dibuat ulang.
  sidik        text not null check (sidik ~ '^[0-9a-f]{16}$'),
  model        text not null default 'multilingual-e5-small',
  embedding    extensions.vector(384) not null,
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

create index if not exists potongan_pasal_pasal_idx on public.potongan_pasal (pasal_id);

-- TANPA indeks HNSW (keputusan 13 Nov 2026): HNSW adalah pencarian PERKIRAAN (approximate).
-- Untuk ±833 potongan, pencarian TEPAT (membandingkan semua baris) hanya ±3 milidetik dan hasilnya 100% akurat,
-- sedangkan skor e5 antar-pasal sangat mepet sehingga perkiraan bisa menukar urutan pasal.
-- Tambahkan kembali indeks HNSW bila jumlah potongan sudah puluhan ribu.
drop index if exists public.potongan_pasal_embedding_idx;

drop trigger if exists potongan_pasal_diubah_pada on public.potongan_pasal;
create trigger potongan_pasal_diubah_pada
  before update on public.potongan_pasal
  for each row execute function public.atur_diubah_pada();


-- 5. Fungsi pencarian: potongan paling mirip dengan pertanyaan ---------
--    skor = kemiripan cosine (1 = identik, 0 = tidak berhubungan).
--    Ambang ("nyambung atau tidak") diputuskan di aplikasi (lib/puan).
create or replace function public.cari_potongan(kueri extensions.vector(384), jumlah int default 8)
returns table (id text, pasal_id text, skor real)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id,
         p.pasal_id,
         (1 - (p.embedding operator(extensions.<=>) kueri))::real as skor
  from public.potongan_pasal p
  order by p.embedding operator(extensions.<=>) kueri
  limit least(greatest(jumlah, 1), 50);
$$;


-- 5b. Fungsi pencarian lengkap untuk Puan (parent-child), dipanggil dari web/src/lib/puan/pencarian.ts
--    Sama dengan puan-ai/puan_rag/retrieval.py → Pencari.cari_dari_vektor(), tapi berjalan DI DATABASE
--    supaya cukup SATU kali bolak-balik dari server Next.js ke Supabase.
--      1) ambil k_child potongan paling mirip
--      2) potongan dengan skor >= ambang → pasal induknya (tanpa dobel), maks. maks_utama   → peran 'utama'
--      3) pasal yang dirujuk/terkait dari pasal utama → dinilai dari potongannya yang paling mirip,
--         ambil maks_tambah teratas                                                          → peran 'rujukan'
--    Hasil kosong = tidak ada pasal yang "nyambung" (di bawah ambang).
create or replace function public.cari_pasal_puan(
  kueri       extensions.vector(384),
  ambang      real,
  k_child     int default 8,
  maks_utama  int default 3,
  maks_tambah int default 2
)
returns table (pasal_id text, peran text, skor real, label text, lokasi text, teks text, penjelasan text)
language sql
stable
security invoker
set search_path = ''
as $$
  with teratas as (
    select p.pasal_id, (1 - (p.embedding operator(extensions.<=>) kueri))::real as skor
    from public.potongan_pasal p
    order by p.embedding operator(extensions.<=>) kueri
    limit least(greatest(k_child, 1), 50)
  ),
  utama as (
    select t.pasal_id, max(t.skor) as skor
    from teratas t
    where t.skor >= ambang
    group by t.pasal_id
    order by max(t.skor) desc
    limit least(greatest(maks_utama, 1), 10)
  ),
  kandidat as (
    select distinct pt.tujuan_id as pasal_id
    from public.pasal_tautan pt
    join utama u on u.pasal_id = pt.pasal_id
    where pt.tujuan_id not in (select u2.pasal_id from utama u2)
  ),
  tambahan as (
    select k.pasal_id,
           coalesce(max((1 - (c.embedding operator(extensions.<=>) kueri))::real), -1)::real as skor
    from kandidat k
    left join public.potongan_pasal c on c.pasal_id = k.pasal_id
    group by k.pasal_id
    order by 2 desc
    limit least(greatest(maks_tambah, 0), 10)
  ),
  hasil as (
    select u.pasal_id, 'utama'::text as peran, u.skor, 1 as urut from utama u
    union all
    select t.pasal_id, 'rujukan'::text, t.skor, 2 from tambahan t
  )
  select h.pasal_id, h.peran, h.skor, ps.label, ps.lokasi, ps.teks, ps.penjelasan
  from hasil h
  join public.pasal ps on ps.id = h.pasal_id
  order by h.urut, h.skor desc;
$$;


-- 6. Kunci akses: publik hanya membaca ----------------------------------
alter table public.dokumen_hukum  enable row level security;
alter table public.pasal          enable row level security;
alter table public.pasal_tautan   enable row level security;
alter table public.potongan_pasal enable row level security;

drop policy if exists "Publik membaca dokumen hukum" on public.dokumen_hukum;
create policy "Publik membaca dokumen hukum"
  on public.dokumen_hukum for select to anon, authenticated using (true);

drop policy if exists "Publik membaca pasal" on public.pasal;
create policy "Publik membaca pasal"
  on public.pasal for select to anon, authenticated using (true);

drop policy if exists "Publik membaca tautan pasal" on public.pasal_tautan;
create policy "Publik membaca tautan pasal"
  on public.pasal_tautan for select to anon, authenticated using (true);

drop policy if exists "Publik membaca potongan pasal" on public.potongan_pasal;
create policy "Publik membaca potongan pasal"
  on public.potongan_pasal for select to anon, authenticated using (true);

comment on table public.potongan_pasal is
  'Potongan pasal yang dicari Puan AI (RAG). embedding = multilingual-e5-small (384), teks diawali "passage: " saat di-embed.';