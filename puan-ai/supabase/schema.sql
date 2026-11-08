-- =====================================================================================
-- OPSIONAL: menyimpan knowledge base Puan AI di Supabase (PostgreSQL + pgvector)
-- =====================================================================================
-- Kapan perlu? Untuk 248 pasal / ~700 child, indeks file (output/indeks_*) yang dimuat ke memori FastAPI
-- sudah cukup cepat (pencarian < 1 milidetik) dan inilah yang dipakai sistem saat ini.
-- Pindah ke Supabase berguna kalau: tim ingin mengedit pasal lewat dashboard, data bertambah jauh lebih besar,
-- atau server FastAPI tidak boleh menyimpan file. Skema ini BELUM dihubungkan ke kode dan belum diuji
-- ke Supabase sungguhan — diskusikan dulu dengan tim (Jelita: database) sebelum dipakai.
--
-- Dimensi vektor: gemini-embedding-001 = 768, multilingual-e5-small = 384. Sesuaikan "vector(768)".
-- Jalankan di Supabase: SQL Editor > New query > tempel > Run.

create extension if not exists vector;

create table if not exists puan_parent (
  id          text primary key,              -- contoh: 'POJK22:62', 'SEOJK19:VIII.1'
  dokumen     text not null,                 -- 'POJK 22/2023'
  label       text not null,                 -- 'POJK 22/2023 Pasal 62' (untuk ditampilkan ke user)
  lokasi      text not null,                 -- 'POJK 22/2023 › BAB II ... › Paragraf 2 Penagihan ...'
  teks        text not null,                 -- isi pasal utuh (bahan bacaan Gemini)
  penjelasan  text not null default '',
  rujukan     text[] not null default '{}',  -- pasal lain di dokumen yang sama
  terkait     text[] not null default '{}'   -- pasal di dokumen lain (TERKAIT di puan_rag/kurasi.py)
);

create table if not exists puan_child (
  id          text primary key,              -- contoh: 'POJK22:62.2'
  parent_id   text not null references puan_parent(id) on delete cascade,
  jenis       text not null,                 -- 'isi' | 'definisi' | 'contoh_perhitungan'  (ayat sanksi tidak disimpan)
  header      text not null,
  teks        text not null,
  penjelasan  text not null default '',
  model       text not null,                 -- 'gemini' | 'e5'
  embedding   vector(768) not null
);

create index if not exists puan_child_parent_idx on puan_child (parent_id);

-- Cari child paling mirip. Vektor sudah dinormalisasi, jadi inner product (<#>) setara cosine.
create or replace function cari_child(kueri vector(768), jumlah int default 8, nama_model text default 'gemini')
returns table (id text, parent_id text, skor float)
language sql stable as $$
  select c.id, c.parent_id, -(c.embedding <#> kueri) as skor
  from puan_child c
  where c.model = nama_model
  order by c.embedding <#> kueri
  limit jumlah;
$$;
