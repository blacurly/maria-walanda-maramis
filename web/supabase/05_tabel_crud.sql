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

 

-- =====================================================================
-- BAGIAN 2: LEMBAGA BANTUAN & SITUASI DARURAT
-- =====================================================================

-- 2a. Jenis lembaga (kepolisian, layanan-perempuan, kesehatan-jiwa, darurat)
create table if not exists public.jenis_lembaga (
  id     smallint generated always as identity primary key,
  kode   text not null unique check (kode ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label  text not null check (length(trim(label)) > 0)
);


-- 2b. Lembaga bantuan: SATU baris = SATU cara menghubungi --------------
create table if not exists public.lembaga (
  id                bigint generated always as identity primary key,
  nama              text not null unique check (length(trim(nama)) > 0),
  penyelenggara     text,
  jenis_lembaga_id  smallint not null
                    references public.jenis_lembaga (id) on delete restrict,
  kanal             text not null check (kanal in ('telepon', 'whatsapp', 'situs')),
  nomor             text not null check (length(trim(nomor)) > 0),
  tautan            text not null check (tautan ~ '^(tel:|https://)'),
  aktif             boolean not null default true,
  dibuat_pada       timestamptz not null default now(),
  diubah_pada       timestamptz not null default now()
);

create index if not exists lembaga_jenis_idx on public.lembaga (jenis_lembaga_id);

drop trigger if exists lembaga_diubah_pada on public.lembaga;
create trigger lembaga_diubah_pada
  before update on public.lembaga
  for each row execute function public.atur_diubah_pada();


-- 2c. Situasi darurat (ancaman, kbgo, kdrt, tekanan) ------------------
create table if not exists public.situasi_darurat (
  id           smallint generated always as identity primary key,
  kode         text not null unique check (kode ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ikon         text,
  pilihan      text not null check (length(trim(pilihan)) > 0),
  judul        text not null check (length(trim(judul)) > 0),
  info         text not null check (length(trim(info)) > 0),
  urutan       smallint not null default 0,
  aktif        boolean not null default true,
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

drop trigger if exists situasi_darurat_diubah_pada on public.situasi_darurat;
create trigger situasi_darurat_diubah_pada
  before update on public.situasi_darurat
  for each row execute function public.atur_diubah_pada();


-- 2d. Penghubung lembaga <-> situasi (banyak-ke-banyak) ----------------
create table if not exists public.lembaga_situasi (
  situasi_id    smallint not null
                references public.situasi_darurat (id) on delete cascade,
  lembaga_id    bigint not null
                references public.lembaga (id) on delete cascade,
  urutan        smallint not null default 0,
  label_khusus  text,          -- mis. "Polisi Unit Siber" untuk situasi KBGO
  primary key (situasi_id, lembaga_id)
);

create index if not exists lembaga_situasi_lembaga_idx on public.lembaga_situasi (lembaga_id);


-- 2e. Kunci akses: publik hanya membaca yang aktif ---------------------
alter table public.jenis_lembaga   enable row level security;
alter table public.lembaga         enable row level security;
alter table public.situasi_darurat enable row level security;
alter table public.lembaga_situasi enable row level security;

drop policy if exists "Publik membaca jenis lembaga" on public.jenis_lembaga;
create policy "Publik membaca jenis lembaga"
  on public.jenis_lembaga for select
  to anon, authenticated
  using (true);

drop policy if exists "Publik membaca lembaga aktif" on public.lembaga;
create policy "Publik membaca lembaga aktif"
  on public.lembaga for select
  to anon, authenticated
  using (aktif);

drop policy if exists "Publik membaca situasi aktif" on public.situasi_darurat;
create policy "Publik membaca situasi aktif"
  on public.situasi_darurat for select
  to anon, authenticated
  using (aktif);

drop policy if exists "Publik membaca penghubung yang aktif" on public.lembaga_situasi;
create policy "Publik membaca penghubung yang aktif"
  on public.lembaga_situasi for select
  to anon, authenticated
  using (
    exists (select 1 from public.lembaga l where l.id = lembaga_id and l.aktif)
    and exists (select 1 from public.situasi_darurat s where s.id = situasi_id and s.aktif)
  ); 

  

-- =====================================================================
-- BAGIAN 3: SUMBER DATA PINJOL
-- =====================================================================

-- 3a. Sumber data resmi (direktori OJK, siaran pers Satgas PASTI) ------
create table if not exists public.sumber_data (
  id           bigint generated always as identity primary key,
  nama         text not null unique check (length(trim(nama)) > 0),
  penerbit     text not null check (length(trim(penerbit)) > 0),
  tautan       text check (tautan is null or tautan ~ '^https://'),
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

drop trigger if exists sumber_data_diubah_pada on public.sumber_data;
create trigger sumber_data_diubah_pada
  before update on public.sumber_data
  for each row execute function public.atur_diubah_pada();

alter table public.sumber_data enable row level security;

drop policy if exists "Publik membaca sumber data" on public.sumber_data;
create policy "Publik membaca sumber data"
  on public.sumber_data for select
  to anon, authenticated
  using (true);


-- 3b. Isi 2 sumber yang sudah dipakai di tabel pinjol -----------------
-- Teks "nama" HARUS sama persis dengan isi kolom pinjol.sumber yang lama.
insert into public.sumber_data (nama, penerbit) values
  ('OJK, Direktori LPBBTI Juli 2026',                  'Otoritas Jasa Keuangan (OJK)'),
  ('Satgas PASTI, Lampiran Siaran Pers periode April 2026', 'Satgas PASTI')
on conflict (nama) do nothing;


-- 3c. Hubungkan tabel pinjol ke sumber_data ---------------------------
-- Kolom lama "sumber" SENGAJA dipertahankan sampai tugas 3
-- (halaman Cek Legalitas masih membacanya).
alter table public.pinjol
  add column if not exists sumber_id    bigint
                           references public.sumber_data (id) on delete restrict,
  add column if not exists dibuat_pada  timestamptz not null default now(),
  add column if not exists diubah_pada  timestamptz not null default now();

-- Isi sumber_id berdasarkan teks sumber yang lama
update public.pinjol p
set    sumber_id = s.id
from   public.sumber_data s
where  s.nama = p.sumber
  and  p.sumber_id is null;

-- Setelah terisi semua, sumber_id wajib ada.
-- Kalau ada baris yang tidak cocok, perintah ini GAGAL (sengaja, sebagai alarm).
alter table public.pinjol alter column sumber_id set not null;

create index if not exists pinjol_sumber_idx on public.pinjol (sumber_id);

drop trigger if exists pinjol_diubah_pada on public.pinjol;
create trigger pinjol_diubah_pada
  before update on public.pinjol
  for each row execute function public.atur_diubah_pada();