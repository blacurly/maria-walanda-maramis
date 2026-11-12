-- =====================================================================
-- 06_seed_crud.sql
-- Data awal untuk tabel di 05_tabel_crud.sql.
-- DIBUAT OTOMATIS dari web/src/data/artikel.ts dan web/src/data/kontakDarurat.ts
-- (6 artikel, 3 kategori, 4 situasi darurat).
--
-- Aman dijalankan ulang: setiap insert memakai "on conflict ... do nothing",
-- jadi data yang sudah ada TIDAK digandakan dan TIDAK ditimpa.
-- Jalankan SETELAH 05_tabel_crud.sql.
-- =====================================================================

begin;

-- 1. Kategori artikel -------------------------------------------------
insert into public.kategori_artikel (kode, label, urutan) values
  ('pinjaman', 'Pinjaman', 1),
  ('hak-hukum', 'Hak & Hukum', 2),
  ('penagihan', 'Penagihan', 3)
on conflict (kode) do nothing;

-- 2. Artikel (semua langsung terbit) ---------------------------------
insert into public.artikel
  (slug, judul, ringkasan, kategori_id, bentuk, menit_baca, gambar_url, isi,
   catatan, fitur_label, fitur_tautan, diterbitkan_pada)
select 'pinjol-legal-vs-ilegal',
       'Pinjol legal vs ilegal: cara membedakannya',
       'Banyak pinjol ilegal meniru nama dan tampilan pinjol berizin. Ini ciri-ciri yang bisa kamu cek sendiri sebelum mengunduh aplikasi.',
       k.id, 'panduan', 4,
       'https://images.unsplash.com/photo-1604594849809-dfedbc827105?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&w=800&q=80',
       '[{"judul":"Kenapa ini penting","paragraf":["Pinjol berizin diawasi OJK: ada batas biaya, aturan penagihan, dan kanal pengaduan. Pinjol ilegal tidak diawasi siapa pun, jadi saat kamu dirugikan, tidak ada lembaga yang bisa memerintahkannya berhenti."]},{"judul":"Ciri pinjol berizin","daftar":["Namanya ada di daftar penyelenggara pinjaman daring berizin di situs OJK.","Nama perusahaan (PT) dan alamatnya jelas, dan sama dengan yang tertulis di aplikasi.","Hanya boleh mengakses kamera, mikrofon, dan lokasi di HP-mu, bukan kontak atau galeri.","Bunga, biaya, dan denda dijelaskan sebelum kamu menyetujui pinjaman.","Punya layanan pengaduan resmi."]},{"judul":"Tanda bahaya pinjol ilegal","daftar":["Menawarkan pinjaman lewat SMS, WhatsApp, atau telepon padahal kamu tidak pernah meminta.","Meminta akses ke kontak atau galeri foto.","Aplikasinya diunduh dari link (file APK), bukan dari Play Store atau App Store.","Menjanjikan dana cair sangat cepat tanpa pemeriksaan data.","Biaya tidak jelas, dan dana yang cair dipotong besar.","Namanya mirip pinjol berizin, tetapi nama perusahaannya berbeda."]},{"judul":"Cara memastikan","daftar":["Ketik namanya di fitur Cek Legalitas EduPuan.","Cocokkan nama PT di aplikasi dengan daftar resmi OJK.","Tanyakan ke WhatsApp OJK 081 157 157 157.","Kalau tetap ragu, jangan dilanjutkan."]}]'::jsonb,
       'Nama yang mirip belum tentu aplikasi yang sama. Selalu cocokkan nama perusahaannya.',
       'Cek legalitas pinjol', '/mau-pinjam/cek-legalitas',
       now()
from public.kategori_artikel k where k.kode = 'pinjaman'
on conflict (slug) do nothing;

insert into public.artikel
  (slug, judul, ringkasan, kategori_id, bentuk, menit_baca, gambar_url, isi,
   catatan, fitur_label, fitur_tautan, diterbitkan_pada)
select 'hitung-biaya-pinjol',
       'Bunga pinjol: cara menghitung biaya sebenarnya sebelum meminjam',
       'Bunga bukan satu-satunya biaya. Kenali batas biaya dari OJK dan cara menghitung total yang harus kamu kembalikan.',
       k.id, 'panduan', 5,
       'https://images.unsplash.com/photo-1554224155-6726b3ff858f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&w=800&q=80',
       '[{"judul":"Bunga bukan satu-satunya biaya","paragraf":["OJK memakai istilah manfaat ekonomi: gabungan bunga, biaya administrasi atau layanan, dan biaya lain di luar denda. Karena itu, bandingkan total yang harus dikembalikan, bukan hanya angka bunganya."]},{"judul":"Batas biaya dari OJK (berlaku sejak 2026)","daftar":["Pinjaman konsumtif: manfaat ekonomi paling tinggi 0,1% per hari.","Pinjaman produktif (untuk usaha): paling tinggi 0,067% per hari.","Total manfaat ekonomi ditambah denda tidak boleh lebih dari 100% nilai pinjaman di perjanjian."]},{"judul":"Contoh hitungan","paragraf":["Kamu meminjam Rp1.000.000 untuk kebutuhan pribadi selama 30 hari. Biaya paling tinggi: 0,1% × 30 hari = 3%, atau Rp30.000. Jadi kalau membayar tepat waktu, total yang kamu kembalikan paling banyak sekitar Rp1.030.000. Kalau sebuah penawaran meminta jauh lebih besar, ada yang tidak beres.","Kalau terlambat, denda mulai berjalan. Tetapi seluruh bunga, biaya, dan denda tetap tidak boleh melebihi Rp1.000.000 (100% dari pokok pinjaman)."]},{"judul":"Cek juga sebelum setuju","daftar":["Apakah dana yang cair sama dengan angka di perjanjian? Potongan di awal membuat biaya sebenarnya lebih tinggi.","Berapa cicilan per bulan dibanding penghasilanmu? Sebagai panduan umum, usahakan total cicilan semua utang tidak lebih dari 30% penghasilan bulanan.","Kapan jatuh tempo, dan berapa denda per hari kalau terlambat?"]}]'::jsonb,
       'Batas ini hanya berlaku untuk pinjol berizin. Pinjol ilegal tidak mengikuti aturan apa pun.',
       'Hitung penawaranmu di Cek Penawaran', '/mau-pinjam/cek-penawaran',
       now()
from public.kategori_artikel k where k.kode = 'pinjaman'
on conflict (slug) do nothing;

insert into public.artikel
  (slug, judul, ringkasan, kategori_id, bentuk, menit_baca, gambar_url, isi,
   catatan, fitur_label, fitur_tautan, diterbitkan_pada)
select 'alternatif-selain-pinjol',
       'Sebelum meminjam: pilihan yang tidak menambah utang',
       'Utang baru bukan satu-satunya jalan. Ini langkah-langkah tanpa pinjaman yang bisa kamu coba lebih dulu.',
       k.id, 'artikel', 4,
       'https://images.unsplash.com/photo-1521791055366-0d553872125f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&w=800&q=80',
       '[{"judul":"Mulai dari pertanyaan: butuh untuk apa?","paragraf":["Biaya sekolah atau kuliah, biaya kesehatan, tagihan rumah, dan kebutuhan sehari-hari punya jalan keluar yang berbeda. Menjawab pertanyaan ini lebih dulu membantumu menemukan pilihan yang tidak menambah beban utang."]},{"judul":"Minta keringanan langsung ke pihak yang ditagih","daftar":["Sekolah atau kampus: tanyakan cicilan, penundaan, atau keringanan biaya pendidikan.","Rumah sakit atau klinik: tanyakan program keringanan dan apakah biayanya bisa ditanggung jaminan kesehatan.","Pemilik kos atau kontrakan: minta perpanjangan waktu pembayaran secara tertulis."]},{"judul":"Cek bantuan yang mungkin menjadi hakmu","daftar":["Program bantuan sosial pemerintah: kamu bisa mengecek kepesertaanmu di cekbansos.kemensos.go.id.","Beasiswa dan bantuan biaya pendidikan dari pemerintah, kampus, atau lembaga lain.","Bantuan dari lembaga sosial atau komunitas di daerahmu."]},{"judul":"Atur ulang yang sudah ada","daftar":["Catat semua pengeluaran sebulan terakhir dan tunda yang tidak mendesak.","Jual barang yang sudah tidak terpakai.","Cari penghasilan tambahan sementara sesuai kemampuanmu."]},{"judul":"Kalau kamu masih mempertimbangkan pinjaman","paragraf":["Pahami dulu biaya sebenarnya dan risikonya sebelum memutuskan apa pun. Keputusan yang diambil saat panik sering berujung pada utang yang lebih berat."]}]'::jsonb,
       null,
       'Cari alternatif yang sesuai kebutuhanmu', '/mau-pinjam/cari-alternatif',
       now()
from public.kategori_artikel k where k.kode = 'pinjaman'
on conflict (slug) do nothing;

insert into public.artikel
  (slug, judul, ringkasan, kategori_id, bentuk, menit_baca, gambar_url, isi,
   catatan, fitur_label, fitur_tautan, diterbitkan_pada)
select 'aturan-penagihan-pojk-22-2023',
       'Aturan penagihan dalam POJK 22/2023 yang wajib kamu ketahui',
       'Utang tetap kewajiban, tetapi cara menagihnya diatur. Ini batas-batas yang tidak boleh dilanggar penagih.',
       k.id, 'panduan', 5,
       'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&w=800&q=80',
       '[{"judul":"Penagih boleh menagih, tetapi ada batasnya","paragraf":["Utang tetap harus dibayar. Tetapi cara menagihnya diatur dalam POJK 22/2023 tentang Pelindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan, yang berlaku untuk lembaga jasa keuangan berizin, termasuk pinjol berizin."]},{"judul":"Yang dilarang saat menagih","daftar":["Ancaman, kekerasan, atau tindakan yang mempermalukan, termasuk menyebarkan informasi tunggakan ke kontak di HP-mu.","Tekanan fisik maupun verbal.","Menagih kepada pihak selain kamu sebagai peminjam, misalnya keluarga, teman, atau atasan.","Menagih terus-menerus sampai mengganggu.","Menagih di tempat selain alamat atau domisilimu."]},{"judul":"Kapan penagihan boleh dilakukan","paragraf":["Senin sampai Sabtu di luar hari libur nasional, pukul 08.00 sampai 20.00 waktu setempat. Penagihan di luar waktu atau tempat itu hanya boleh kalau sudah ada persetujuan atau perjanjian sebelumnya denganmu."]},{"judul":"Kalau yang menagih pihak ketiga (debt collector)","paragraf":["Perusahaan boleh memakai jasa penagihan pihak lain, asalkan berbentuk badan hukum, punya izin dari instansi berwenang, dan petugasnya bersertifikat di bidang penagihan. Semua akibat dari kerja sama itu tetap menjadi tanggung jawab perusahaan pinjolnya."]},{"judul":"Yang bisa kamu lakukan","daftar":["Simpan bukti: tangkapan layar, riwayat panggilan, rekaman.","Jangan membalas dengan emosi atau menjanjikan sesuatu di bawah tekanan.","Adukan ke layanan pengaduan pinjolnya, lalu ke OJK 157 kalau tidak selesai."]}]'::jsonb,
       'Pinjol ilegal tidak diawasi OJK, tetapi ancaman, pemerasan, dan penyebaran data yang dilakukannya tetap bisa dilaporkan ke polisi.',
       'Lihat semua hakmu saat ditagih', '/sudah-terjerat/hak-saat-ditagih',
       now()
from public.kategori_artikel k where k.kode = 'hak-hukum'
on conflict (slug) do nothing;

insert into public.artikel
  (slug, judul, ringkasan, kategori_id, bentuk, menit_baca, gambar_url, isi,
   catatan, fitur_label, fitur_tautan, diterbitkan_pada)
select 'cara-lapor-pinjol',
       'Cara melapor pinjol: ke mana dan apa yang perlu disiapkan',
       'Lembaga tujuan laporan berbeda tergantung status pinjolnya dan jenis pelanggarannya. Ini panduan singkatnya.',
       k.id, 'panduan', 4,
       'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&w=800&q=80',
       '[{"judul":"Siapkan bukti lebih dulu","daftar":["Tangkapan layar chat lengkap dengan nomor pengirim dan waktunya.","Riwayat panggilan dan rekaman telepon kalau ada.","Bukti transfer dan perjanjian pinjaman.","Kronologi tertulis: tanggal, jam, dan apa yang terjadi."]},{"judul":"Kalau pinjolnya berizin OJK","daftar":["Adukan dulu ke layanan pengaduan di aplikasi pinjolnya, lalu simpan nomor tiketnya.","Kalau tidak ditanggapi atau tidak selesai, adukan ke OJK: telepon 157, WhatsApp 081 157 157 157, atau portal kontak157.ojk.go.id."]},{"judul":"Kalau pinjolnya ilegal","paragraf":["Laporkan ke Satgas PASTI (Satuan Tugas Pemberantasan Aktivitas Keuangan Ilegal) lewat portal sipasti.ojk.go.id. Laporanmu membantu pemblokiran aplikasinya."]},{"judul":"Kalau ada ancaman, pemerasan, atau penyebaran data","paragraf":["Ini tindak pidana, baik pelakunya pinjol berizin maupun ilegal. Laporkan ke kepolisian lewat SPKT Polres terdekat atau patrolisiber.id. Kalau kamu dalam bahaya saat ini, hubungi 110."]},{"judul":"Kalau ada pelecehan atau ancaman sebar foto pribadi","paragraf":["Hubungi SAPA 129 (telepon 129 atau WhatsApp 08111 129 129) untuk mendapat pendampingan dan rujukan layanan di daerahmu."]}]'::jsonb,
       'Jangan hapus chat atau rekaman, meskipun sudah dilaporkan. Bukti asli mungkin diminta lagi.',
       'Susun laporan kronologimu', '/sudah-terjerat/dokumentasi-lapor',
       now()
from public.kategori_artikel k where k.kode = 'hak-hukum'
on conflict (slug) do nothing;

insert into public.artikel
  (slug, judul, ringkasan, kategori_id, bentuk, menit_baca, gambar_url, isi,
   catatan, fitur_label, fitur_tautan, diterbitkan_pada)
select 'ancaman-sebar-data',
       'Diancam data atau fotomu disebar? Ini langkah hukumnya',
       'Menyebarkan data pribadi untuk menekan pembayaran itu melanggar hukum. Kenali aturannya dan apa yang bisa kamu lakukan sekarang.',
       k.id, 'artikel', 5,
       'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&w=800&q=80',
       '[{"judul":"Ini bukan cara menagih yang sah","paragraf":["Mengancam menyebarkan, atau benar-benar menyebarkan, data pribadi dan foto untuk memaksa pembayaran dilarang, baik oleh pinjol berizin maupun ilegal. Utangmu tidak membuat penagih berhak mempermalukanmu."]},{"judul":"Aturan yang dilanggar","daftar":["POJK 22/2023: penagih dilarang mempermalukan konsumen dan menagih kepada pihak lain.","UU 27/2022 tentang Pelindungan Data Pribadi: mengungkapkan data pribadi milik orang lain secara melawan hukum diancam pidana (Pasal 65 jo. Pasal 67).","UU 1/2024 tentang perubahan kedua UU ITE: pengancaman dan pemerasan lewat sistem elektronik (Pasal 27B).","Kalau yang disebar atau diancam disebar adalah foto atau konten intim: UU 12/2022 tentang Tindak Pidana Kekerasan Seksual mengatur kekerasan seksual berbasis elektronik (Pasal 14)."]},{"judul":"Yang bisa kamu lakukan sekarang","daftar":["Jangan panik, dan jangan mentransfer uang di luar tagihan resmi untuk menghentikan ancaman.","Tangkap layar semua ancaman, lengkap dengan nomor dan waktunya.","Kabari orang terdekat lebih dulu, sebelum mereka dihubungi penagih.","Laporkan ke polisi, dan ke OJK atau Satgas PASTI sesuai status pinjolnya.","Minta penurunan konten yang sudah tersebar lewat aduankonten.id."]},{"judul":"Kalau kamu merasa tidak aman","paragraf":["Hubungi 110 kalau ada ancaman kekerasan atau penagih datang ke rumah. Untuk pendampingan, hubungi SAPA 129. Kamu juga bisa membuka Halaman Darurat EduPuan."]}]'::jsonb,
       null,
       'Analisis pesan penagih yang kamu terima', '/sudah-terjerat/analisis-pesan',
       now()
from public.kategori_artikel k where k.kode = 'penagihan'
on conflict (slug) do nothing;

-- 3. Rujukan artikel (dasar hukum & sumber) --------------------------
-- Hanya diisi kalau artikel itu BELUM punya rujukan (supaya tidak dobel saat dijalankan ulang).
insert into public.rujukan_artikel (artikel_id, jenis, teks, tautan, urutan)
select a.id, v.jenis, v.teks, v.tautan, v.urutan
from public.artikel a
cross join (values
  ('dasar_hukum', 'POJK 40/2024 tentang Layanan Pendanaan Bersama Berbasis Teknologi Informasi (LPBBTI)', null, 1),
  ('sumber', 'OJK – Daftar penyelenggara pinjaman daring berizin', 'https://www.ojk.go.id/id/kanal/iknb/financial-technology/Pages/Penyelenggara-Fintech-Lending-Berizin-dan-Terdaftar-di-OJK.aspx', 1),
  ('sumber', 'OJK – POJK 40/2024 tentang LPBBTI', 'https://ojk.go.id/id/regulasi/Pages/POJK-40-Tahun-2024-Layanan-Pendanaan-Bersama-Berbasis-Teknologi-Informasi.aspx', 2)
) as v(jenis, teks, tautan, urutan)
where a.slug = 'pinjol-legal-vs-ilegal'
  and not exists (select 1 from public.rujukan_artikel r where r.artikel_id = a.id);

insert into public.rujukan_artikel (artikel_id, jenis, teks, tautan, urutan)
select a.id, v.jenis, v.teks, v.tautan, v.urutan
from public.artikel a
cross join (values
  ('dasar_hukum', 'SEOJK 19/SEOJK.06/2023 tentang Penyelenggaraan LPBBTI', null, 1),
  ('dasar_hukum', 'POJK 40/2024 tentang LPBBTI', null, 2),
  ('sumber', 'detikFinance – Bunga pinjol turun bertahap hingga 0,1% per hari', 'https://finance.detik.com/fintech/d-7030676/bunga-pinjol-bakal-turun-bertahap-hingga-jadi-0-1-hari', 1),
  ('sumber', 'Investortrust – Aturan baru pinjol: bunga, denda, dan simulasinya', 'https://investortrust.id/financial/23551/ojk-terbitkan-aturan-baru-pinjol-segini-besaran-bunga-denda-dan-simulasinya', 2)
) as v(jenis, teks, tautan, urutan)
where a.slug = 'hitung-biaya-pinjol'
  and not exists (select 1 from public.rujukan_artikel r where r.artikel_id = a.id);

insert into public.rujukan_artikel (artikel_id, jenis, teks, tautan, urutan)
select a.id, v.jenis, v.teks, v.tautan, v.urutan
from public.artikel a
cross join (values
  ('dasar_hukum', 'POJK 22/2023 tentang Pelindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan, Pasal 62', null, 1),
  ('sumber', 'Bisnis.com – Aturan baru OJK soal penagihan kredit', 'https://finansial.bisnis.com/read/20240109/90/1730590/aturan-baru-ojk-soal-penagihan-kredit-maksimal-jam-8-malam-dilarang-pakai-ancaman', 1),
  ('sumber', 'Hukumonline – Aturan penagihan utang oleh debt collector', 'https://www.hukumonline.com/klinik/a/aturan-penagihan-utang-debt-collector-cl5802/', 2)
) as v(jenis, teks, tautan, urutan)
where a.slug = 'aturan-penagihan-pojk-22-2023'
  and not exists (select 1 from public.rujukan_artikel r where r.artikel_id = a.id);

insert into public.rujukan_artikel (artikel_id, jenis, teks, tautan, urutan)
select a.id, v.jenis, v.teks, v.tautan, v.urutan
from public.artikel a
cross join (values
  ('dasar_hukum', 'POJK 22/2023 tentang Pelindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan', null, 1),
  ('sumber', 'OJK – Kanal pengaduan Satgas PASTI berpindah ke SIPASTI', 'https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Pages/Kanal-Pengaduan-Satgas-PASTI-Berpindah-ke-SIPASTI.aspx', 1)
) as v(jenis, teks, tautan, urutan)
where a.slug = 'cara-lapor-pinjol'
  and not exists (select 1 from public.rujukan_artikel r where r.artikel_id = a.id);

insert into public.rujukan_artikel (artikel_id, jenis, teks, tautan, urutan)
select a.id, v.jenis, v.teks, v.tautan, v.urutan
from public.artikel a
cross join (values
  ('dasar_hukum', 'POJK 22/2023, Pasal 62', null, 1),
  ('dasar_hukum', 'UU 27/2022 tentang Pelindungan Data Pribadi, Pasal 65 dan 67', null, 2),
  ('dasar_hukum', 'UU 1/2024 tentang Perubahan Kedua atas UU ITE, Pasal 27B', null, 3),
  ('dasar_hukum', 'UU 12/2022 tentang Tindak Pidana Kekerasan Seksual, Pasal 14', null, 4),
  ('sumber', 'Hukumonline – Hukumnya debt collector mengancam', 'https://www.hukumonline.com/klinik/a/hukum-debt-collector-mengancam-lt672220762faf4', 1)
) as v(jenis, teks, tautan, urutan)
where a.slug = 'ancaman-sebar-data'
  and not exists (select 1 from public.rujukan_artikel r where r.artikel_id = a.id);

-- 4. Jenis lembaga ----------------------------------------------------
insert into public.jenis_lembaga (kode, label) values
  ('kepolisian', 'Kepolisian'),
  ('layanan-perempuan', 'Layanan Perlindungan Perempuan & Anak'),
  ('kesehatan-jiwa', 'Layanan Kesehatan Jiwa'),
  ('darurat', 'Layanan Darurat')
on conflict (kode) do nothing;

-- 5. Lembaga bantuan (satu baris = satu cara menghubungi) ------------
insert into public.lembaga (nama, penyelenggara, jenis_lembaga_id, kanal, nomor, tautan)
select v.nama, v.penyelenggara, j.id, v.kanal, v.nomor, v.tautan
from (values
  ('Polisi 110', 'Kepolisian Negara Republik Indonesia', 'kepolisian', 'telepon', '110', 'tel:110'),
  ('SAPA 129 — WA', 'Kementerian PPPA', 'layanan-perempuan', 'whatsapp', '08111-129-129', 'https://wa.me/628111129129'),
  ('SAPA 129 — Telepon', 'Kementerian PPPA', 'layanan-perempuan', 'telepon', '129', 'tel:129'),
  ('Healing119 — 119 ext 8', 'Kementerian Kesehatan', 'kesehatan-jiwa', 'telepon', '119', 'tel:119'),
  ('Healing119.id — Chat', 'Kementerian Kesehatan', 'kesehatan-jiwa', 'situs', 'healing119.id', 'https://healing119.id'),
  ('Darurat 112', null, 'darurat', 'telepon', '112', 'tel:112')
) as v(nama, penyelenggara, jenis, kanal, nomor, tautan)
join public.jenis_lembaga j on j.kode = v.jenis
on conflict (nama) do nothing;

-- 6. Situasi darurat --------------------------------------------------
insert into public.situasi_darurat (kode, ikon, pilihan, judul, info, urutan) values
  ('ancaman', '⚠️', 'Ancaman atau kekerasan dari penagih', 'Ancaman atau kekerasan dari penagih', 'Simpan semua bukti ancaman sebelum memblokir nomor penagih. Screenshot pesan + catat tanggal & waktu.', 1),
  ('kbgo', '📵', 'Ancaman sebar foto atau pelecehan online (KBGO)', 'Ancaman sebar foto / pelecehan online', 'Jangan hapus pesan atau foto sebagai bukti. Minta pendampingan sebelum membuat laporan.', 2),
  ('kdrt', '🏠', 'Kekerasan dalam rumah tangga', 'Kekerasan dalam rumah tangga', 'Kalau belum aman untuk bicara, kirim pesan WA ke SAPA 129 — tidak harus berbicara.', 3),
  ('tekanan', '💙', 'Tekanan berat, merasa tidak sanggup lagi', 'Tekanan berat atau keinginan menyakiti diri', 'Kamu tidak harus menjelaskan semua sekaligus. Cukup mulai dengan "saya butuh bantuan".', 4)
on conflict (kode) do nothing;

-- 7. Penghubung situasi <-> lembaga ---------------------------------
insert into public.lembaga_situasi (situasi_id, lembaga_id, urutan, label_khusus)
select s.id, l.id, v.urutan, v.label_khusus
from (values
  ('ancaman', 'Polisi 110', 1, null),
  ('ancaman', 'SAPA 129 — WA', 2, null),
  ('kbgo', 'SAPA 129 — Telepon', 1, null),
  ('kbgo', 'SAPA 129 — WA', 2, null),
  ('kbgo', 'Polisi 110', 3, 'Polisi Unit Siber'),
  ('kdrt', 'SAPA 129 — Telepon', 1, null),
  ('kdrt', 'SAPA 129 — WA', 2, null),
  ('kdrt', 'Polisi 110', 3, null),
  ('tekanan', 'Healing119 — 119 ext 8', 1, null),
  ('tekanan', 'Healing119.id — Chat', 2, null),
  ('tekanan', 'Darurat 112', 3, null)
) as v(situasi, lembaga, urutan, label_khusus)
join public.situasi_darurat s on s.kode = v.situasi
join public.lembaga l on l.nama = v.lembaga
on conflict (situasi_id, lembaga_id) do nothing;

commit;