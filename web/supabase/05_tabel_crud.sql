-- =====================================================================
-- 05_tabel_crud.sql
-- Tabel konten yang dikelola admin (CRUD): artikel, lembaga bantuan,
-- dan sumber data pinjol.
-- Aman dijalankan ulang (if not exists / create or replace / drop if exists).
--
-- AKSES: RLS aktif di semua tabel. Publik (anon) HANYA boleh membaca.
--        Menambah, mengubah, menghapus HANYA lewat server (secret key).
-- =====================================================================


-- 0. Fungsi bersama: isi kolom diubah_pada otomatis setiap baris diubah --
create or replace function public.atur_diubah_pada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.diubah_pada := now();
  return new;
end;
$$;


-- =====================================================================
-- BAGIAN 1: ARTIKEL EDUKASI
-- =====================================================================

-- 1a. Kategori artikel (pinjaman, hak-hukum, penagihan) -----------------
create table if not exists public.kategori_artikel (
  id      smallint generated always as identity primary key,
  kode    text not null unique check (kode ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label   text not null check (length(trim(label)) > 0),
  urutan  smallint not null default 0
);


-- 1b. Artikel ---------------------------------------------------------
create table if not exists public.artikel (
  id                bigint generated always as identity primary key,
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  judul             text not null check (length(trim(judul)) > 0),
  ringkasan         text not null check (length(trim(ringkasan)) > 0),
  kategori_id       smallint not null
                    references public.kategori_artikel (id) on delete restrict,
  bentuk            text not null default 'artikel'
                    check (bentuk in ('artikel', 'panduan')),
  menit_baca        smallint not null check (menit_baca between 1 and 60),
  gambar_url        text,
  isi               jsonb not null default '[]'::jsonb
                    check (jsonb_typeof(isi) = 'array'),
  catatan           text,
  fitur_label       text,
  fitur_tautan      text,
  diterbitkan_pada  timestamptz,          -- kosong = masih draf
  dibuat_pada       timestamptz not null default now(),
  diubah_pada       timestamptz not null default now(),
  -- label dan tautan fitur harus diisi berpasangan, atau kosong keduanya
  check ((fitur_label is null) = (fitur_tautan is null))
);

create index if not exists artikel_kategori_idx on public.artikel (kategori_id);

drop trigger if exists artikel_diubah_pada on public.artikel;
create trigger artikel_diubah_pada
  before update on public.artikel
  for each row execute function public.atur_diubah_pada();


-- 1c. Rujukan artikel (dasar hukum & sumber bacaan) -------------------
create table if not exists public.rujukan_artikel (
  id          bigint generated always as identity primary key,
  artikel_id  bigint not null
              references public.artikel (id) on delete cascade,
  jenis       text not null check (jenis in ('dasar_hukum', 'sumber')),
  teks        text not null check (length(trim(teks)) > 0),
  tautan      text,
  urutan      smallint not null default 0
);

create index if not exists rujukan_artikel_artikel_idx on public.rujukan_artikel (artikel_id);


-- 1d. Kunci akses: publik hanya membaca, dan hanya artikel yang sudah terbit
alter table public.kategori_artikel enable row level security;
alter table public.artikel          enable row level security;
alter table public.rujukan_artikel  enable row level security;

drop policy if exists "Publik membaca kategori artikel" on public.kategori_artikel;
create policy "Publik membaca kategori artikel"
  on public.kategori_artikel for select
  to anon, authenticated
  using (true);

drop policy if exists "Publik membaca artikel terbit" on public.artikel;
create policy "Publik membaca artikel terbit"
  on public.artikel for select
  to anon, authenticated
  using (diterbitkan_pada is not null and diterbitkan_pada <= now());

drop policy if exists "Publik membaca rujukan artikel terbit" on public.rujukan_artikel;
create policy "Publik membaca rujukan artikel terbit"
  on public.rujukan_artikel for select
  to anon, authenticated
  using (exists (
    select 1 from public.artikel a
    where a.id = artikel_id
      and a.diterbitkan_pada is not null
      and a.diterbitkan_pada <= now()
  ));