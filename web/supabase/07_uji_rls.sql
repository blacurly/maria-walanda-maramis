-- =====================================================================
-- 07_uji_rls.sql
-- UJI KEAMANAN: berpura-pura menjadi pengunjung ANONIM (role "anon",
-- sama seperti browser yang memakai kunci publishable), lalu mencoba
-- MEMBACA, MENAMBAH, MENGUBAH, dan MENGHAPUS di setiap tabel.
--
-- AMAN: setiap percobaan dibatalkan otomatis, jadi data TIDAK berubah.
-- Jalankan di Supabase SQL Editor. Hasilnya tabel LULUS / GAGAL.
-- Yang diharapkan: SEMUA baris LULUS.
--
-- Bagian:
--   1–4. baca / tambah / ubah / hapus di 16 tabel (12 tabel aplikasi + 4 tabel pengetahuan Puan AI)
--   5.   fungsi pembatas permintaan tidak boleh dipanggil anonim
--   6.   artikel DRAF / TERJADWAL dan lembaga NONAKTIF tidak terlihat anonim
--   7.   fungsi pencarian Puan (cari_potongan, cari_pasal_puan) BOLEH dipanggil anonim (hanya membaca)
-- =====================================================================

drop table if exists pg_temp.hasil_uji_rls;
create temp table hasil_uji_rls (
  no        serial,
  tabel     text,
  uji       text,
  harapan   text,
  hasil     text,
  status    text
);

do $uji$
declare
  -- tabel | kolom untuk uji ubah | boleh dibaca publik?
  daftar text[][] := array[
    ['pinjol',               'nama',       'ya'],
    ['sumber_data',          'nama',       'ya'],
    ['kategori_artikel',     'label',      'ya'],
    ['artikel',              'judul',      'ya'],
    ['rujukan_artikel',      'teks',       'ya'],
    ['jenis_lembaga',        'label',      'ya'],
    ['lembaga',              'nama',       'ya'],
    ['situasi_darurat',      'judul',      'ya'],
    ['lembaga_situasi',      'urutan',     'ya'],
    ['statistik_puan',       'topik',      'tidak'],
    ['umpan_balik_puan',     'topik',      'tidak'],
    ['pembatas_permintaan',  'jumlah',     'tidak'],
    ['dokumen_hukum',        'judul',      'ya'],
    ['pasal',                'label',      'ya'],
    ['pasal_tautan',         'jenis',      'ya'],
    ['potongan_pasal',       'header',     'ya']
  ];
  i       int;
  t       text;
  kol     text;
  publik  boolean;
  n       bigint;
  m       bigint;
  pesan   text;
  kode    text;
  v       extensions.vector;
begin
  for i in 1 .. array_length(daftar, 1) loop
    t      := daftar[i][1];
    kol    := daftar[i][2];
    publik := daftar[i][3] = 'ya';

    -- Tabel belum ada di database ini: lewati
    if to_regclass('public.' || t) is null then
      insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
      values (t, '-', '-', 'tabel belum ada', 'DILEWATI');
      continue;
    end if;

    -- 1. MEMBACA ------------------------------------------------------
    begin
      execute 'set local role anon';
      execute format('select count(*) from public.%I', t) into n;
      raise exception using errcode = 'P0001', message = 'BARIS:' || n;
    exception when others then
      pesan := sqlerrm; kode := sqlstate;
    end;
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values (t, 'baca',
            case when publik then 'terlihat > 0 baris' else 'terlihat 0 baris' end,
            case when kode = 'P0001' then replace(pesan, 'BARIS:', '') || ' baris terlihat'
                 else 'ditolak (' || kode || ')' end,
            case
              when publik and kode = 'P0001' and replace(pesan, 'BARIS:', '')::bigint > 0 then 'LULUS'
              when not publik and (kode = '42501'
                   or (kode = 'P0001' and replace(pesan, 'BARIS:', '')::bigint = 0)) then 'LULUS'
              else 'GAGAL'
            end);

    -- 2. MENAMBAH -----------------------------------------------------
    begin
      execute 'set local role anon';
      execute format('insert into public.%I default values', t);
      get diagnostics n = row_count;
      raise exception using errcode = 'P0001', message = 'BARIS:' || n;
    exception when others then
      pesan := sqlerrm; kode := sqlstate;
    end;
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values (t, 'tambah', 'ditolak',
            case when kode = 'P0001' then replace(pesan, 'BARIS:', '') || ' baris BERHASIL ditambah'
                 else 'ditolak (' || kode || ')' end,
            case when kode = '42501' then 'LULUS' else 'GAGAL' end);

    -- 3. MENGUBAH -----------------------------------------------------
    begin
      execute 'set local role anon';
      execute format('update public.%I set %I = %I', t, kol, kol);
      get diagnostics n = row_count;
      raise exception using errcode = 'P0001', message = 'BARIS:' || n;
    exception when others then
      pesan := sqlerrm; kode := sqlstate;
    end;
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values (t, 'ubah', '0 baris berubah / ditolak',
            case when kode = 'P0001' then replace(pesan, 'BARIS:', '') || ' baris berubah'
                 else 'ditolak (' || kode || ')' end,
            case when kode = '42501'
                   or (kode = 'P0001' and replace(pesan, 'BARIS:', '')::bigint = 0) then 'LULUS'
                 else 'GAGAL' end);

    -- 4. MENGHAPUS ----------------------------------------------------
    begin
      execute 'set local role anon';
      execute format('delete from public.%I', t);
      get diagnostics n = row_count;
      raise exception using errcode = 'P0001', message = 'BARIS:' || n;
    exception when others then
      pesan := sqlerrm; kode := sqlstate;
    end;
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values (t, 'hapus', '0 baris terhapus / ditolak',
            case when kode = 'P0001' then replace(pesan, 'BARIS:', '') || ' baris terhapus'
                 else 'ditolak (' || kode || ')' end,
            case when kode = '42501'
                   or (kode = 'P0001' and replace(pesan, 'BARIS:', '')::bigint = 0) then 'LULUS'
                 else 'GAGAL' end);
  end loop;

  -- 5. Fungsi pembatas permintaan tidak boleh dipanggil anonim --------
  if to_regprocedure('public.catat_permintaan(text,integer,integer)') is null then
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values ('catat_permintaan()', '-', '-', 'fungsi belum ada', 'DILEWATI');
  else
    begin
      execute 'set local role anon';
      execute 'select * from public.catat_permintaan(''uji-rls'', 60, 1)';
      raise exception using errcode = 'P0001', message = 'BERHASIL';
    exception when others then
      pesan := sqlerrm; kode := sqlstate;
    end;
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values ('catat_permintaan()', 'panggil fungsi', 'ditolak',
            case when kode = 'P0001' then 'BERHASIL dipanggil' else 'ditolak (' || kode || ')' end,
            case when kode = '42501' then 'LULUS' else 'GAGAL' end);
  end if;

  -- 6. Artikel draf/terjadwal & lembaga nonaktif tidak boleh terlihat anonim ----------
  --    Data uji dibuat sementara, lalu dibatalkan otomatis (tidak tersimpan).
  if to_regclass('public.artikel') is null or to_regclass('public.lembaga') is null then
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values ('artikel & lembaga', '-', '-', 'tabel belum ada', 'DILEWATI');
  else
    begin
      insert into public.artikel (slug, judul, ringkasan, kategori_id, menit_baca, diterbitkan_pada)
      values ('uji-rls-draf', 'Uji RLS draf', 'Uji', (select id from public.kategori_artikel order by id limit 1), 1, null),
             ('uji-rls-terjadwal', 'Uji RLS terjadwal', 'Uji', (select id from public.kategori_artikel order by id limit 1), 1,
              now() + interval '1 day');
      insert into public.lembaga (nama, jenis_lembaga_id, kanal, nomor, tautan, aktif)
      values ('Uji RLS nonaktif', (select id from public.jenis_lembaga order by id limit 1), 'telepon', '000', 'tel:000', false);
      execute 'set local role anon';
      select count(*) into n from public.artikel where slug in ('uji-rls-draf', 'uji-rls-terjadwal');
      select count(*) into m from public.lembaga where nama = 'Uji RLS nonaktif';
      raise exception using errcode = 'P0001', message = n || ':' || m;
    exception when others then
      pesan := sqlerrm; kode := sqlstate;
    end;
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values ('artikel', 'draf & terjadwal tersembunyi', 'terlihat 0 dari 2',
            case when kode = 'P0001' then 'terlihat ' || split_part(pesan, ':', 1) || ' dari 2'
                 else 'persiapan uji gagal (' || kode || ')' end,
            case when kode = 'P0001' and split_part(pesan, ':', 1) = '0' then 'LULUS' else 'GAGAL' end),
           ('lembaga', 'nonaktif tersembunyi', 'terlihat 0 dari 1',
            case when kode = 'P0001' then 'terlihat ' || split_part(pesan, ':', 2) || ' dari 1'
                 else 'persiapan uji gagal (' || kode || ')' end,
            case when kode = 'P0001' and split_part(pesan, ':', 2) = '0' then 'LULUS' else 'GAGAL' end);
  end if;

  -- 7. Fungsi pencarian Puan boleh dipanggil anonim (isinya data publik, hanya membaca) --
  if to_regprocedure('public.cari_pasal_puan(extensions.vector,real,integer,integer,integer)') is null
     or not exists (select 1 from public.potongan_pasal) then
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values ('cari_pasal_puan()', '-', '-', 'fungsi belum ada / indeks masih kosong', 'DILEWATI');
  else
    select embedding into v from public.potongan_pasal order by id limit 1;
    begin
      execute 'set local role anon';
      execute 'select count(*) from public.cari_potongan($1, 3)' using v into n;
      execute 'select count(*) from public.cari_pasal_puan($1, 0)' using v into m;
      raise exception using errcode = 'P0001', message = n || ':' || m;
    exception when others then
      pesan := sqlerrm; kode := sqlstate;
    end;
    insert into hasil_uji_rls (tabel, uji, harapan, hasil, status)
    values ('cari_potongan()', 'panggil fungsi', 'boleh, ada hasil',
            case when kode = 'P0001' then split_part(pesan, ':', 1) || ' potongan ditemukan' else 'ditolak (' || kode || ')' end,
            case when kode = 'P0001' and split_part(pesan, ':', 1)::int > 0 then 'LULUS' else 'GAGAL' end),
           ('cari_pasal_puan()', 'panggil fungsi', 'boleh, ada hasil',
            case when kode = 'P0001' then split_part(pesan, ':', 2) || ' pasal ditemukan' else 'ditolak (' || kode || ')' end,
            case when kode = 'P0001' and split_part(pesan, ':', 2)::int > 0 then 'LULUS' else 'GAGAL' end);
  end if;
end
$uji$;

-- Ringkasan di baris pertama, lalu rincian per tabel
select 0 as no, 'RINGKASAN' as tabel, 'semua uji' as uji,
       'semua LULUS' as harapan,
       count(*) filter (where status = 'LULUS')  || ' lulus, ' ||
       count(*) filter (where status = 'GAGAL')  || ' gagal, ' ||
       count(*) filter (where status = 'DILEWATI') || ' dilewati' as hasil,
       case when count(*) filter (where status = 'GAGAL') = 0 then 'LULUS' else 'GAGAL' end as status
from hasil_uji_rls
union all
select no, tabel, uji, harapan, hasil, status from hasil_uji_rls
order by no;