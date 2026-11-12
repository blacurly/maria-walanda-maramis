-- =====================================================================
-- 04_catatan_puan.sql
-- Dua tabel catatan ANONIM dari Puan AI:
--   1. statistik_puan   : topik setiap pertanyaan (untuk rekap & evaluasi)
--   2. umpan_balik_puan : tombol "membantu / belum membantu" dari user
--
-- Kedua tabel SUDAH ADA di Supabase (dibuat lewat website).
-- File ini mencatat strukturnya di repo supaya bisa dibuat ulang.
-- Aman dijalankan ulang: "if not exists" tidak menimpa tabel yang sudah ada.
--
-- PRIVASI: tidak ada kolom isi pesan, nama, nomor HP, IP, atau ID pengguna.
-- AKSES  : RLS aktif TANPA policy -> anon/browser tidak bisa baca atau tulis.
--          Yang bisa menulis hanya server dengan SUPABASE_SECRET_KEY.
-- =====================================================================


-- 1. Statistik pertanyaan ----------------------------------------------
create table if not exists public.statistik_puan (
  id         bigint generated always as identity primary key,
  dibuat     timestamptz not null default now(),
  topik      text not null,
  situasi    text not null,
  status     text not null
             check (status in ('pasal', 'butuh_dana', 'di_luar_topik', 'tidak_ada_pasal')),
  krisis     boolean not null default false,
  durasi_ms  integer not null check (durasi_ms >= 0)
);

alter table public.statistik_puan enable row level security;

comment on table public.statistik_puan is
  'Rekap anonim pertanyaan ke Puan AI: topik, situasi, status jawaban, krisis, dan lama proses. Tanpa isi pesan.';


-- 2. Umpan balik jawaban -----------------------------------------------
create table if not exists public.umpan_balik_puan (
  id       bigint generated always as identity primary key,
  dibuat   timestamptz not null default now(),
  nilai    smallint not null check (nilai in (1, -1)),
  topik    text not null,
  situasi  text not null,
  status   text not null
           check (status in ('pasal', 'butuh_dana', 'di_luar_topik', 'tidak_ada_pasal'))
);

alter table public.umpan_balik_puan enable row level security;


comment on table public.umpan_balik_puan is
  'Umpan balik anonim atas jawaban Puan AI: 1 = membantu, -1 = belum membantu. Tanpa isi pertanyaan atau jawaban.';