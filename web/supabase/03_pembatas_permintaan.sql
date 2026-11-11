-- 03_pembatas_permintaan.sql
-- Tabel penghitung untuk pembatas permintaan (rate limit) endpoint API EduPuan.
-- Privasi: kolom "kunci" berisi SIDIK ACAK (hash) dari alamat IP + nama endpoint,
-- bukan alamat IP aslinya. Catatan otomatis dibersihkan setelah 1 hari.

create table if not exists public.pembatas_permintaan (
  kunci          text        not null,             -- hash pengunjung + nama endpoint
  jendela_mulai  timestamptz not null,             -- awal jendela waktu (misal per menit)
  jumlah         integer     not null default 0 check (jumlah >= 0),
  primary key (kunci, jendela_mulai)
);

-- RLS aktif TANPA policy: tertutup total untuk publik.
-- Hanya server EduPuan (kunci rahasia) yang bisa memakainya.
alter table public.pembatas_permintaan enable row level security;

-- Mencatat satu permintaan, lalu menjawab: boleh atau tidak.
create or replace function public.catat_permintaan(
  p_kunci text,
  p_jendela_detik integer,
  p_batas integer
)
returns table (boleh boolean, sisa integer, coba_lagi_detik integer)
language plpgsql
set search_path = public
as $$
declare
  v_mulai  timestamptz := to_timestamp(floor(extract(epoch from now()) / p_jendela_detik) * p_jendela_detik);
  v_jumlah integer;
begin
  insert into public.pembatas_permintaan (kunci, jendela_mulai, jumlah)
  values (p_kunci, v_mulai, 1)
  on conflict (kunci, jendela_mulai)
    do update set jumlah = public.pembatas_permintaan.jumlah + 1
  returning public.pembatas_permintaan.jumlah into v_jumlah;

  -- sesekali (1%) hapus catatan yang lebih tua dari 1 hari
  if random() < 0.01 then
    delete from public.pembatas_permintaan where jendela_mulai < now() - interval '1 day';
  end if;

  return query select
    v_jumlah <= p_batas,
    greatest(p_batas - v_jumlah, 0),
    ceil(extract(epoch from (v_mulai + make_interval(secs => p_jendela_detik) - now())))::integer;
end;
$$;

-- Hanya server (kunci rahasia / service_role) yang boleh menjalankan fungsi ini.
revoke all on function public.catat_permintaan(text, integer, integer) from public, anon, authenticated;
grant execute on function public.catat_permintaan(text, integer, integer) to service_role;