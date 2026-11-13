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

-- Indeks HNSW: pencarian vektor cepat berdasarkan jarak cosine.
create index if not exists potongan_pasal_embedding_idx
  on public.potongan_pasal using hnsw (embedding extensions.vector_cosine_ops);

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