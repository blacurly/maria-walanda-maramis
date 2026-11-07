-- Tabel pinjol: daftar pinjol berizin (legal) dan ilegal.
-- Dipakai fitur Cek Legalitas, Rangkum Semua Utang, dan Dokumentasi & Lapor.

create table if not exists public.pinjol (
  id bigint generated always as identity primary key,
  nama text not null,
  nama_perusahaan text,
  status text not null check (status in ('legal', 'ilegal')),
  alamat text,                 -- situs resmi (legal) / alamat tempat aplikasi ilegal ditemukan
  sumber text not null,        -- dokumen resmi asal data ini
  diperbarui_pada date not null default current_date
);

-- Satu nama hanya boleh muncul sekali untuk setiap status (huruf besar/kecil dianggap sama)
create unique index if not exists pinjol_nama_status_unik
  on public.pinjol (lower(nama), status);

-- Keamanan: aktifkan Row Level Security
alter table public.pinjol enable row level security;

-- Siapa pun boleh MEMBACA daftar pinjol, karena ini data publik
drop policy if exists "Daftar pinjol bisa dibaca publik" on public.pinjol;
create policy "Daftar pinjol bisa dibaca publik"
  on public.pinjol for select
  to anon, authenticated
  using (true);

-- Sengaja TIDAK ada policy insert/update/delete:
-- pengunjung web tidak bisa menambah, mengubah, atau menghapus data.
