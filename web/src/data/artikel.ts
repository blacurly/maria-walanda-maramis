// Artikel edukasi EduPuan. Satu objek = satu halaman /edukasi/[slug].

export type Topik = "pinjaman" | "hak-hukum" | "penagihan";

export const TOPIK: { id: Topik; label: string }[] = [
  { id: "pinjaman", label: "Pinjaman" },
  { id: "hak-hukum", label: "Hak & Hukum" },
  { id: "penagihan", label: "Penagihan" },
];

export type Bagian = {
  judul: string;
  paragraf?: string[];
  daftar?: string[];
};

export type Artikel = {
  slug: string;
  judul: string;
  ringkasan: string;
  topik: Topik;
  topikLabel?: string; // label kategori dari database (kalau ada)
  kategori: "Panduan" | "Artikel";
  menit: number;
  gambar: string;
  diperbarui: string;
  bagian: Bagian[];
  catatan?: string;
  dasarHukum: string[];
  fitur?: { label: string; href: string }; // tidak wajib: artikel dari database boleh tanpa ajakan fitur
  sumber: { label: string; url: string }[];
};

const img = (id: string) =>
  `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&w=800&q=80`;

export const ARTIKEL: Artikel[] = [
  {
    slug: "pinjol-legal-vs-ilegal",
    judul: "Pinjol legal vs ilegal: cara membedakannya",
    ringkasan:
      "Banyak pinjol ilegal meniru nama dan tampilan pinjol berizin. Ini ciri-ciri yang bisa kamu cek sendiri sebelum mengunduh aplikasi.",
    topik: "pinjaman",
    kategori: "Panduan",
    menit: 4,
    gambar: img("photo-1604594849809-dfedbc827105"),
    diperbarui: "November 2026",
    bagian: [
      {
        judul: "Kenapa ini penting",
        paragraf: [
          "Pinjol berizin diawasi OJK: ada batas biaya, aturan penagihan, dan kanal pengaduan. Pinjol ilegal tidak diawasi siapa pun, jadi saat kamu dirugikan, tidak ada lembaga yang bisa memerintahkannya berhenti.",
        ],
      },
      {
        judul: "Ciri pinjol berizin",
        daftar: [
          "Namanya ada di daftar penyelenggara pinjaman daring berizin di situs OJK.",
          "Nama perusahaan (PT) dan alamatnya jelas, dan sama dengan yang tertulis di aplikasi.",
          "Hanya boleh mengakses kamera, mikrofon, dan lokasi di HP-mu, bukan kontak atau galeri.",
          "Bunga, biaya, dan denda dijelaskan sebelum kamu menyetujui pinjaman.",
          "Punya layanan pengaduan resmi.",
        ],
      },
      {
        judul: "Tanda bahaya pinjol ilegal",
        daftar: [
          "Menawarkan pinjaman lewat SMS, WhatsApp, atau telepon padahal kamu tidak pernah meminta.",
          "Meminta akses ke kontak atau galeri foto.",
          "Aplikasinya diunduh dari link (file APK), bukan dari Play Store atau App Store.",
          "Menjanjikan dana cair sangat cepat tanpa pemeriksaan data.",
          "Biaya tidak jelas, dan dana yang cair dipotong besar.",
          "Namanya mirip pinjol berizin, tetapi nama perusahaannya berbeda.",
        ],
      },
      {
        judul: "Cara memastikan",
        daftar: [
          "Ketik namanya di fitur Cek Legalitas EduPuan.",
          "Cocokkan nama PT di aplikasi dengan daftar resmi OJK.",
          "Tanyakan ke WhatsApp OJK 081 157 157 157.",
          "Kalau tetap ragu, jangan dilanjutkan.",
        ],
      },
    ],
    catatan: "Nama yang mirip belum tentu aplikasi yang sama. Selalu cocokkan nama perusahaannya.",
    dasarHukum: ["POJK 40/2024 tentang Layanan Pendanaan Bersama Berbasis Teknologi Informasi (LPBBTI)"],
    fitur: { label: "Cek legalitas pinjol", href: "/mau-pinjam/cek-legalitas" },
    sumber: [
      {
        label: "OJK – Daftar penyelenggara pinjaman daring berizin",
        url: "https://www.ojk.go.id/id/kanal/iknb/financial-technology/Pages/Penyelenggara-Fintech-Lending-Berizin-dan-Terdaftar-di-OJK.aspx",
      },
      {
        label: "OJK – POJK 40/2024 tentang LPBBTI",
        url: "https://ojk.go.id/id/regulasi/Pages/POJK-40-Tahun-2024-Layanan-Pendanaan-Bersama-Berbasis-Teknologi-Informasi.aspx",
      },
    ],
  },
  {
    slug: "hitung-biaya-pinjol",
    judul: "Bunga pinjol: cara menghitung biaya sebenarnya sebelum meminjam",
    ringkasan:
      "Bunga bukan satu-satunya biaya. Kenali batas biaya dari OJK dan cara menghitung total yang harus kamu kembalikan.",
    topik: "pinjaman",
    kategori: "Panduan",
    menit: 5,
    gambar: img("photo-1554224155-6726b3ff858f"),
    diperbarui: "November 2026",
    bagian: [
      {
        judul: "Bunga bukan satu-satunya biaya",
        paragraf: [
          "OJK memakai istilah manfaat ekonomi: gabungan bunga, biaya administrasi atau layanan, dan biaya lain di luar denda. Karena itu, bandingkan total yang harus dikembalikan, bukan hanya angka bunganya.",
        ],
      },
      {
        judul: "Batas biaya dari OJK (berlaku sejak 2026)",
        daftar: [
          "Pinjaman konsumtif: manfaat ekonomi paling tinggi 0,1% per hari.",
          "Pinjaman produktif (untuk usaha): paling tinggi 0,067% per hari.",
          "Total manfaat ekonomi ditambah denda tidak boleh lebih dari 100% nilai pinjaman di perjanjian.",
        ],
      },
      {
        judul: "Contoh hitungan",
        paragraf: [
          "Kamu meminjam Rp1.000.000 untuk kebutuhan pribadi selama 30 hari. Biaya paling tinggi: 0,1% × 30 hari = 3%, atau Rp30.000. Jadi kalau membayar tepat waktu, total yang kamu kembalikan paling banyak sekitar Rp1.030.000. Kalau sebuah penawaran meminta jauh lebih besar, ada yang tidak beres.",
          "Kalau terlambat, denda mulai berjalan. Tetapi seluruh bunga, biaya, dan denda tetap tidak boleh melebihi Rp1.000.000 (100% dari pokok pinjaman).",
        ],
      },
      {
        judul: "Cek juga sebelum setuju",
        daftar: [
          "Apakah dana yang cair sama dengan angka di perjanjian? Potongan di awal membuat biaya sebenarnya lebih tinggi.",
          "Berapa cicilan per bulan dibanding penghasilanmu? Sebagai panduan umum, usahakan total cicilan semua utang tidak lebih dari 30% penghasilan bulanan.",
          "Kapan jatuh tempo, dan berapa denda per hari kalau terlambat?",
        ],
      },
    ],
    catatan: "Batas ini hanya berlaku untuk pinjol berizin. Pinjol ilegal tidak mengikuti aturan apa pun.",
    dasarHukum: [
      "SEOJK 19/SEOJK.06/2023 tentang Penyelenggaraan LPBBTI",
      "POJK 40/2024 tentang LPBBTI",
    ],
    fitur: { label: "Hitung penawaranmu di Cek Penawaran", href: "/mau-pinjam/cek-penawaran" },
    sumber: [
      {
        label: "detikFinance – Bunga pinjol turun bertahap hingga 0,1% per hari",
        url: "https://finance.detik.com/fintech/d-7030676/bunga-pinjol-bakal-turun-bertahap-hingga-jadi-0-1-hari",
      },
      {
        label: "Investortrust – Aturan baru pinjol: bunga, denda, dan simulasinya",
        url: "https://investortrust.id/financial/23551/ojk-terbitkan-aturan-baru-pinjol-segini-besaran-bunga-denda-dan-simulasinya",
      },
    ],
  },
  {
    slug: "alternatif-selain-pinjol",
    judul: "Sebelum meminjam: pilihan yang tidak menambah utang",
    ringkasan:
      "Utang baru bukan satu-satunya jalan. Ini langkah-langkah tanpa pinjaman yang bisa kamu coba lebih dulu.",
    topik: "pinjaman",
    kategori: "Artikel",
    menit: 4,
    gambar: img("photo-1521791055366-0d553872125f"),
    diperbarui: "November 2026",
    bagian: [
      {
        judul: "Mulai dari pertanyaan: butuh untuk apa?",
        paragraf: [
          "Biaya sekolah atau kuliah, biaya kesehatan, tagihan rumah, dan kebutuhan sehari-hari punya jalan keluar yang berbeda. Menjawab pertanyaan ini lebih dulu membantumu menemukan pilihan yang tidak menambah beban utang.",
        ],
      },
      {
        judul: "Minta keringanan langsung ke pihak yang ditagih",
        daftar: [
          "Sekolah atau kampus: tanyakan cicilan, penundaan, atau keringanan biaya pendidikan.",
          "Rumah sakit atau klinik: tanyakan program keringanan dan apakah biayanya bisa ditanggung jaminan kesehatan.",
          "Pemilik kos atau kontrakan: minta perpanjangan waktu pembayaran secara tertulis.",
        ],
      },
      {
        judul: "Cek bantuan yang mungkin menjadi hakmu",
        daftar: [
          "Program bantuan sosial pemerintah: kamu bisa mengecek kepesertaanmu di cekbansos.kemensos.go.id.",
          "Beasiswa dan bantuan biaya pendidikan dari pemerintah, kampus, atau lembaga lain.",
          "Bantuan dari lembaga sosial atau komunitas di daerahmu.",
        ],
      },
      {
        judul: "Atur ulang yang sudah ada",
        daftar: [
          "Catat semua pengeluaran sebulan terakhir dan tunda yang tidak mendesak.",
          "Jual barang yang sudah tidak terpakai.",
          "Cari penghasilan tambahan sementara sesuai kemampuanmu.",
        ],
      },
      {
        judul: "Kalau kamu masih mempertimbangkan pinjaman",
        paragraf: [
          "Pahami dulu biaya sebenarnya dan risikonya sebelum memutuskan apa pun. Keputusan yang diambil saat panik sering berujung pada utang yang lebih berat.",
        ],
      },
    ],
    dasarHukum: [],
    fitur: { label: "Cari alternatif yang sesuai kebutuhanmu", href: "/mau-pinjam/cari-alternatif" },
    sumber: [],
  },
  {
    slug: "aturan-penagihan-pojk-22-2023",
    judul: "Aturan penagihan dalam POJK 22/2023 yang wajib kamu ketahui",
    ringkasan:
      "Utang tetap kewajiban, tetapi cara menagihnya diatur. Ini batas-batas yang tidak boleh dilanggar penagih.",
    topik: "hak-hukum",
    kategori: "Panduan",
    menit: 5,
    gambar: img("photo-1589829545856-d10d557cf95f"),
    diperbarui: "November 2026",
    bagian: [
      {
        judul: "Penagih boleh menagih, tetapi ada batasnya",
        paragraf: [
          "Utang tetap harus dibayar. Tetapi cara menagihnya diatur dalam POJK 22/2023 tentang Pelindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan, yang berlaku untuk lembaga jasa keuangan berizin, termasuk pinjol berizin.",
        ],
      },
      {
        judul: "Yang dilarang saat menagih",
        daftar: [
          "Ancaman, kekerasan, atau tindakan yang mempermalukan, termasuk menyebarkan informasi tunggakan ke kontak di HP-mu.",
          "Tekanan fisik maupun verbal.",
          "Menagih kepada pihak selain kamu sebagai peminjam, misalnya keluarga, teman, atau atasan.",
          "Menagih terus-menerus sampai mengganggu.",
          "Menagih di tempat selain alamat atau domisilimu.",
        ],
      },
      {
        judul: "Kapan penagihan boleh dilakukan",
        paragraf: [
          "Senin sampai Sabtu di luar hari libur nasional, pukul 08.00 sampai 20.00 waktu setempat. Penagihan di luar waktu atau tempat itu hanya boleh kalau sudah ada persetujuan atau perjanjian sebelumnya denganmu.",
        ],
      },
      {
        judul: "Kalau yang menagih pihak ketiga (debt collector)",
        paragraf: [
          "Perusahaan boleh memakai jasa penagihan pihak lain, asalkan berbentuk badan hukum, punya izin dari instansi berwenang, dan petugasnya bersertifikat di bidang penagihan. Semua akibat dari kerja sama itu tetap menjadi tanggung jawab perusahaan pinjolnya.",
        ],
      },
      {
        judul: "Yang bisa kamu lakukan",
        daftar: [
          "Simpan bukti: tangkapan layar, riwayat panggilan, rekaman.",
          "Jangan membalas dengan emosi atau menjanjikan sesuatu di bawah tekanan.",
          "Adukan ke layanan pengaduan pinjolnya, lalu ke OJK 157 kalau tidak selesai.",
        ],
      },
    ],
    catatan:
      "Pinjol ilegal tidak diawasi OJK, tetapi ancaman, pemerasan, dan penyebaran data yang dilakukannya tetap bisa dilaporkan ke polisi.",
    dasarHukum: ["POJK 22/2023 tentang Pelindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan, Pasal 62"],
    fitur: { label: "Lihat semua hakmu saat ditagih", href: "/sudah-terjerat/hak-saat-ditagih" },
    sumber: [
      {
        label: "Bisnis.com – Aturan baru OJK soal penagihan kredit",
        url: "https://finansial.bisnis.com/read/20240109/90/1730590/aturan-baru-ojk-soal-penagihan-kredit-maksimal-jam-8-malam-dilarang-pakai-ancaman",
      },
      {
        label: "Hukumonline – Aturan penagihan utang oleh debt collector",
        url: "https://www.hukumonline.com/klinik/a/aturan-penagihan-utang-debt-collector-cl5802/",
      },
    ],
  },
  {
    slug: "cara-lapor-pinjol",
    judul: "Cara melapor pinjol: ke mana dan apa yang perlu disiapkan",
    ringkasan:
      "Lembaga tujuan laporan berbeda tergantung status pinjolnya dan jenis pelanggarannya. Ini panduan singkatnya.",
    topik: "hak-hukum",
    kategori: "Panduan",
    menit: 4,
    gambar: img("photo-1589994965851-a8f479c573a9"),
    diperbarui: "November 2026",
    bagian: [
      {
        judul: "Siapkan bukti lebih dulu",
        daftar: [
          "Tangkapan layar chat lengkap dengan nomor pengirim dan waktunya.",
          "Riwayat panggilan dan rekaman telepon kalau ada.",
          "Bukti transfer dan perjanjian pinjaman.",
          "Kronologi tertulis: tanggal, jam, dan apa yang terjadi.",
        ],
      },
      {
        judul: "Kalau pinjolnya berizin OJK",
        daftar: [
          "Adukan dulu ke layanan pengaduan di aplikasi pinjolnya, lalu simpan nomor tiketnya.",
          "Kalau tidak ditanggapi atau tidak selesai, adukan ke OJK: telepon 157, WhatsApp 081 157 157 157, atau portal kontak157.ojk.go.id.",
        ],
      },
      {
        judul: "Kalau pinjolnya ilegal",
        paragraf: [
          "Laporkan ke Satgas PASTI (Satuan Tugas Pemberantasan Aktivitas Keuangan Ilegal) lewat portal sipasti.ojk.go.id. Laporanmu membantu pemblokiran aplikasinya.",
        ],
      },
      {
        judul: "Kalau ada ancaman, pemerasan, atau penyebaran data",
        paragraf: [
          "Ini tindak pidana, baik pelakunya pinjol berizin maupun ilegal. Laporkan ke kepolisian lewat SPKT Polres terdekat atau patrolisiber.id. Kalau kamu dalam bahaya saat ini, hubungi 110.",
        ],
      },
      {
        judul: "Kalau ada pelecehan atau ancaman sebar foto pribadi",
        paragraf: [
          "Hubungi SAPA 129 (telepon 129 atau WhatsApp 08111 129 129) untuk mendapat pendampingan dan rujukan layanan di daerahmu.",
        ],
      },
    ],
    catatan: "Jangan hapus chat atau rekaman, meskipun sudah dilaporkan. Bukti asli mungkin diminta lagi.",
    dasarHukum: ["POJK 22/2023 tentang Pelindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan"],
    fitur: { label: "Susun laporan kronologimu", href: "/sudah-terjerat/dokumentasi-lapor" },
    sumber: [
      {
        label: "OJK – Kanal pengaduan Satgas PASTI berpindah ke SIPASTI",
        url: "https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Pages/Kanal-Pengaduan-Satgas-PASTI-Berpindah-ke-SIPASTI.aspx",
      },
    ],
  },
  {
    slug: "ancaman-sebar-data",
    judul: "Diancam data atau fotomu disebar? Ini langkah hukumnya",
    ringkasan:
      "Menyebarkan data pribadi untuk menekan pembayaran itu melanggar hukum. Kenali aturannya dan apa yang bisa kamu lakukan sekarang.",
    topik: "penagihan",
    kategori: "Artikel",
    menit: 5,
    gambar: img("photo-1524178232363-1fb2b075b655"),
    diperbarui: "November 2026",
    bagian: [
      {
        judul: "Ini bukan cara menagih yang sah",
        paragraf: [
          "Mengancam menyebarkan, atau benar-benar menyebarkan, data pribadi dan foto untuk memaksa pembayaran dilarang, baik oleh pinjol berizin maupun ilegal. Utangmu tidak membuat penagih berhak mempermalukanmu.",
        ],
      },
      {
        judul: "Aturan yang dilanggar",
        daftar: [
          "POJK 22/2023: penagih dilarang mempermalukan konsumen dan menagih kepada pihak lain.",
          "UU 27/2022 tentang Pelindungan Data Pribadi: mengungkapkan data pribadi milik orang lain secara melawan hukum diancam pidana (Pasal 65 jo. Pasal 67).",
          "UU 1/2024 tentang perubahan kedua UU ITE: pengancaman dan pemerasan lewat sistem elektronik (Pasal 27B).",
          "Kalau yang disebar atau diancam disebar adalah foto atau konten intim: UU 12/2022 tentang Tindak Pidana Kekerasan Seksual mengatur kekerasan seksual berbasis elektronik (Pasal 14).",
        ],
      },
      {
        judul: "Yang bisa kamu lakukan sekarang",
        daftar: [
          "Jangan panik, dan jangan mentransfer uang di luar tagihan resmi untuk menghentikan ancaman.",
          "Tangkap layar semua ancaman, lengkap dengan nomor dan waktunya.",
          "Kabari orang terdekat lebih dulu, sebelum mereka dihubungi penagih.",
          "Laporkan ke polisi, dan ke OJK atau Satgas PASTI sesuai status pinjolnya.",
          "Minta penurunan konten yang sudah tersebar lewat aduankonten.id.",
        ],
      },
      {
        judul: "Kalau kamu merasa tidak aman",
        paragraf: [
          "Hubungi 110 kalau ada ancaman kekerasan atau penagih datang ke rumah. Untuk pendampingan, hubungi SAPA 129. Kamu juga bisa membuka Halaman Darurat EduPuan.",
        ],
      },
    ],
    dasarHukum: [
      "POJK 22/2023, Pasal 62",
      "UU 27/2022 tentang Pelindungan Data Pribadi, Pasal 65 dan 67",
      "UU 1/2024 tentang Perubahan Kedua atas UU ITE, Pasal 27B",
      "UU 12/2022 tentang Tindak Pidana Kekerasan Seksual, Pasal 14",
    ],
    fitur: { label: "Analisis pesan penagih yang kamu terima", href: "/sudah-terjerat/analisis-pesan" },
    sumber: [
      {
        label: "Hukumonline – Hukumnya debt collector mengancam",
        url: "https://www.hukumonline.com/klinik/a/hukum-debt-collector-mengancam-lt672220762faf4",
      },
    ],
  },
];

export const labelTopik = (id: Topik) => TOPIK.find((t) => t.id === id)?.label ?? id;
export const cariArtikel = (slug: string) => ARTIKEL.find((a) => a.slug === slug);