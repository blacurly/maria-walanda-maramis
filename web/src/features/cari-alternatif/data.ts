/*
 * EduPuan — Cek Alternatif Lain
 * DATA: template pesan, katalog tindakan (rekomendasi), dan direktori bantuan resmi.
 * Ubah file ini saja untuk memperbarui isi. Tidak ada pinjaman dalam bentuk apa pun.
 * Terakhir diverifikasi manual: 9 Oktober 2026.
 */

export const VERIFIED = "9 Okt 2026";

/* ---------- TEMPLATE PESAN ---------- */
export type TemplateKey = "kampus" | "kampusHidup" | "calon" | "sekolah" | "tagihan" | "rs";

export const TEMPLATES: Record<TemplateKey, string> = {
  kampus: `Selamat pagi/siang, Bapak/Ibu. Saya mahasiswa [program studi] dan saat ini mengalami kendala keuangan yang memengaruhi kemampuan saya membayar UKT.

Saya ingin menanyakan apakah kampus menyediakan program bantuan pendidikan, peninjauan UKT, keringanan, atau mekanisme penundaan pembayaran bagi mahasiswa yang mengalami kesulitan ekonomi.

Mohon informasi mengenai persyaratan, dokumen yang diperlukan, dan prosedur pengajuannya. Terima kasih.`,
  kampusHidup: `Selamat pagi/siang, Bapak/Ibu. Saya mahasiswa [program studi] angkatan [tahun]. Saat ini saya mengalami kendala keuangan untuk memenuhi [biaya hidup / perlengkapan kuliah].

Saya ingin menanyakan apakah bagian kemahasiswaan memiliki bantuan bagi mahasiswa yang sedang kesulitan ekonomi, atau dapat mengarahkan saya ke beasiswa atau bantuan yayasan yang sesuai.

Mohon informasi mengenai persyaratan dan prosedurnya. Terima kasih.`,
  calon: `Selamat pagi/siang, Bapak/Ibu. Saya calon mahasiswa yang diterima di program studi [nama prodi] melalui jalur [jalur seleksi]. Saat ini saya mengalami kendala biaya untuk [daftar ulang / UKT pertama].

Saya ingin menanyakan apakah kampus menyediakan penundaan pembayaran, penetapan UKT sesuai kemampuan ekonomi, atau ketentuan khusus bagi calon penerima KIP Kuliah.

Mohon informasi mengenai persyaratan, dokumen, dan batas waktunya. Terima kasih.`,
  sekolah: `Selamat pagi/siang, Bapak/Ibu [nama wali kelas / guru BK]. Saya [nama], [siswa / orang tua dari siswa] kelas [kelas].

Saat ini keluarga kami sedang mengalami kendala keuangan untuk [membayar SPP / membeli perlengkapan sekolah]. Saya ingin menanyakan apakah sekolah memiliki bantuan, keringanan, atau penundaan pembayaran, dan apakah [saya / anak saya] dapat diusulkan sebagai penerima PIP.

Mohon informasi persyaratan dan langkahnya. Terima kasih.`,
  tagihan: `Selamat pagi/siang. Saya pelanggan dengan nomor [nomor pelanggan / nomor tagihan].

Saat ini saya mengalami kendala keuangan sehingga belum dapat melunasi tagihan [jenis tagihan] yang jatuh tempo pada [tanggal]. Saya ingin menanyakan apakah tersedia perpanjangan waktu, keringanan, atau pembayaran bertahap secara resmi. Saya dapat membayar [jumlah] pada [tanggal].

Mohon informasi prosedurnya. Terima kasih.`,
  rs: `Selamat pagi/siang. Saya keluarga dari pasien [nama pasien] yang dirawat di [ruang / poli].

Kami sedang kesulitan biaya. Kami ingin menanyakan apakah pasien bisa dilayani dengan BPJS Kesehatan atau dibantu pengurusan BPJS PBI, dan apakah ada keringanan atau pembayaran bertahap untuk biaya yang tidak ditanggung.

Mohon informasi petugas yang bisa kami temui dan dokumen yang diperlukan. Terima kasih.`,
};

/* ---------- KATALOG TINDAKAN ----------
 * timing: "segera"  = bisa dilakukan hari ini (hasil tidak dijamin)
 *         "proses"  = butuh beberapa hari sampai minggu
 *         "seleksi" = ada seleksi dan jadwal, bukan solusi cepat
 */
export type Timing = "segera" | "proses" | "seleksi";

export interface Action {
  title: string;
  timing: Timing;
  timingText: string;
  why: string;
  steps: string[];
  docs: string;
  limit: string;
  template?: TemplateKey;
  sources?: string[];
}

export const ACTIONS: Record<string, Action> = {
  kampusKeuangan: {
    title: "Hubungi bagian keuangan kampus",
    timing: "segera", timingText: "Bisa dihubungi hari ini. Keputusan bergantung kebijakan kampus.",
    why: "Bagian keuangan yang bisa menjelaskan kebijakan pembayaran UKT, termasuk keringanan, peninjauan, atau penundaan.",
    steps: ["Siapkan bukti tagihan UKT.", "Hubungi bagian keuangan atau kemahasiswaan (datang langsung, email, atau WhatsApp resmi kampus).", "Tanyakan opsi keringanan, peninjauan UKT, atau penundaan jika tersedia.", "Minta jawaban tertulis, termasuk batas waktu pengajuan."],
    docs: "Kartu mahasiswa, bukti tagihan, surat permohonan, dan dokumen pendukung kondisi ekonomi.",
    limit: "Kebijakan dan persetujuan bergantung pada kampus masing-masing.",
    template: "kampus",
  },
  kemahasiswaan: {
    title: "Datangi bagian kemahasiswaan",
    timing: "segera", timingText: "Bisa dihubungi hari ini. Bantuan internal biasanya perlu pengajuan.",
    why: "Bagian kemahasiswaan mengelola beasiswa internal, bantuan yayasan, dan sering tahu bantuan untuk mahasiswa yang sedang kesulitan.",
    steps: ["Jelaskan kebutuhanmu secara singkat dan jujur.", "Tanyakan bantuan internal, beasiswa kampus, atau yayasan mitra yang masih membuka pengajuan.", "Catat syarat, dokumen, dan tenggatnya."],
    docs: "Kartu mahasiswa, transkrip atau KHS, dan dokumen pendukung kondisi ekonomi.",
    limit: "Tidak semua kampus memiliki dana bantuan, dan dananya terbatas.",
    template: "kampusHidup",
  },
  beasiswaInternal: {
    title: "Ajukan beasiswa internal kampus atau yayasan",
    timing: "seleksi", timingText: "Melalui seleksi. Jadwal berbeda di tiap kampus.",
    why: "Beasiswa kampus dan yayasan mitra biasanya lebih sedikit pesaingnya dibanding beasiswa nasional.",
    steps: ["Cek pengumuman beasiswa di laman atau media sosial resmi kampus.", "Tanyakan ke kemahasiswaan beasiswa yayasan yang bermitra dengan kampus.", "Siapkan dokumen sebelum pendaftaran dibuka."],
    docs: "KTM, KHS atau transkrip, surat keterangan tidak mampu, dan surat rekomendasi jika diminta.",
    limit: "Ada seleksi, hasil tidak dijamin, dan dana tidak langsung cair.",
  },
  kampusTujuan: {
    title: "Hubungi bagian keuangan kampus tujuan",
    timing: "segera", timingText: "Bisa dihubungi hari ini. Keputusan bergantung kebijakan kampus.",
    why: "Kampus tujuan yang menentukan apakah daftar ulang atau UKT pertama bisa ditunda atau disesuaikan.",
    steps: ["Siapkan bukti penerimaan dan rincian biaya daftar ulang.", "Hubungi bagian keuangan atau penerimaan mahasiswa baru.", "Tanyakan penundaan, penetapan UKT sesuai kemampuan, dan ketentuan bagi pendaftar KIP Kuliah."],
    docs: "Bukti kelulusan seleksi, KK, KTP, dan dokumen pendukung kondisi ekonomi.",
    limit: "Kebijakan berbeda di setiap kampus.",
    template: "calon",
  },
  kipk: {
    title: "Daftar KIP Kuliah",
    timing: "seleksi", timingText: "Melalui seleksi dan verifikasi. Bukan bantuan untuk hari ini.",
    why: "KIP Kuliah ditujukan bagi lulusan SMA/sederajat yang berprestasi tetapi memiliki keterbatasan ekonomi.",
    steps: ["Buat akun di laman resmi KIP Kuliah memakai NISN, NPSN, NIK, dan email aktif.", "Pastikan NISN sama dengan yang dipakai saat mendaftar seleksi masuk.", "Pantau status di akunmu dan pengumuman resmi."],
    docs: "NISN, NPSN, NIK, email aktif, serta data yang sesuai Dapodik.",
    limit: "Ada kuota dan verifikasi. Kelayakan juga dirujuk dari data DTSEN.",
    sources: ["kipk"],
  },
  walikelas: {
    title: "Bicara dengan wali kelas atau guru BK",
    timing: "segera", timingText: "Bisa dilakukan hari ini.",
    why: "Wali kelas dan guru BK bisa mengusulkan bantuan dan menyampaikan kondisimu ke pihak sekolah.",
    steps: ["Minta waktu bicara berdua dengan wali kelas atau guru BK.", "Jelaskan kebutuhanmu dan tenggatnya.", "Tanyakan apakah kamu bisa diusulkan sebagai penerima PIP atau bantuan sekolah."],
    docs: "Biasanya belum perlu dokumen. Siapkan KK jika diminta.",
    limit: "Guru tidak selalu bisa memutuskan, tapi bisa meneruskan ke pihak yang berwenang.",
    template: "sekolah",
  },
  sekolahAdmin: {
    title: "Tanyakan keringanan ke tata usaha sekolah",
    timing: "segera", timingText: "Bisa ditanyakan hari ini.",
    why: "Tata usaha mengurus pembayaran SPP dan bisa menjelaskan apakah ada penundaan atau keringanan.",
    steps: ["Datang ke tata usaha bersama orang tua atau wali jika memungkinkan.", "Tanyakan penundaan, keringanan, atau pembayaran bertahap.", "Minta kesepakatan tertulis."],
    docs: "Kartu pelajar, bukti tagihan SPP, dan KK.",
    limit: "Kebijakan bergantung pada sekolah dan yayasan pengelolanya.",
    template: "sekolah",
  },
  pip: {
    title: "Minta diusulkan sebagai penerima PIP",
    timing: "proses", timingText: "Diusulkan per periode. Pencairan tidak instan.",
    why: "PIP adalah bantuan untuk peserta didik dari keluarga kurang mampu. Siswa tidak mendaftar sendiri, tetapi diusulkan sekolah.",
    steps: ["Minta sekolah memeriksa datamu di Dapodik dan menandai status Layak PIP jika memenuhi kriteria.", "Kalau keluargamu belum terdaftar di DTSEN, daftar lewat desa/kelurahan atau Dinas Sosial.", "Pantau penetapan dan pencairan di laman resmi PIP."],
    docs: "NISN, KK, serta KIP atau KKS jika ada.",
    limit: "Ada kuota daerah. Penerima tahun lalu tidak otomatis menerima lagi.",
    sources: ["pip"],
  },
  beasiswaDaerah: {
    title: "Tanyakan beasiswa pemerintah daerah atau yayasan",
    timing: "seleksi", timingText: "Melalui seleksi. Jadwal belum terverifikasi.",
    why: "Banyak pemerintah daerah dan yayasan punya bantuan pendidikan sendiri, tetapi jadwalnya berbeda di tiap daerah.",
    steps: ["Tanyakan ke guru BK, kampus, atau Dinas Pendidikan setempat.", "Cek pengumuman di laman resmi pemda atau yayasan.", "Jangan pernah membayar biaya pendaftaran beasiswa kepada perorangan."],
    docs: "Biasanya rapor atau transkrip, KK, dan surat keterangan tidak mampu.",
    limit: "Jadwal belum terverifikasi. Selalu periksa pengumuman resmi.",
  },
  cekStatus: {
    title: "Cek status pengajuanmu di kanal resmi",
    timing: "segera", timingText: "Bisa dicek hari ini.",
    why: "Kamu sudah mengajukan bantuan. Memastikan status lebih dulu bisa mencegah pengajuan dobel dan menunjukkan apakah ada dokumen yang kurang.",
    steps: ["Buka akun atau laman resmi tempat kamu mendaftar.", "Kalau tidak ada informasi, hubungi penyelenggaranya (sekolah, kampus, atau layanan resmi).", "Tanyakan perkiraan waktu pengumuman atau pencairan."],
    docs: "Nomor pendaftaran atau bukti pengajuan.",
    limit: "Status hanya menunjukkan proses, bukan jaminan diterima.",
  },
  sisaKekurangan: {
    title: "Sampaikan sisa kekurangan ke pihak sekolah atau kampus",
    timing: "segera", timingText: "Bisa disampaikan hari ini.",
    why: "Kamu sudah menerima bantuan tetapi masih kurang. Pihak sekolah atau kampus bisa menilai ulang atau menambahkan keringanan.",
    steps: ["Hitung berapa sisa yang belum tertutup.", "Tunjukkan bukti bantuan yang sudah diterima.", "Tanyakan apakah sisanya bisa ditunda atau diringankan."],
    docs: "Bukti bantuan yang sudah diterima dan rincian tagihan.",
    limit: "Tidak semua lembaga bisa memberi tambahan keringanan.",
  },
  kerjaMhs: {
    title: "Kerja paruh waktu atau jual barang yang tidak terpakai",
    timing: "proses", timingText: "Hasil dalam beberapa hari sampai minggu.",
    why: "Menambah dana tanpa berutang. Realistis bila tenggatmu masih beberapa hari lagi.",
    steps: ["Tanyakan lowongan asisten atau kerja paruh waktu di kampus.", "Tawarkan jasa yang kamu kuasai: les, desain, terjemahan, atau titip beli.", "Jual barang yang tidak terpakai lewat marketplace atau grup kampus, utamakan COD."],
    docs: "Tidak ada.",
    limit: "Hasilnya tidak pasti dan butuh waktu. Jangan sampai mengganggu kuliah.",
  },
  jualBarang: {
    title: "Jual barang yang tidak terpakai",
    timing: "proses", timingText: "Hasil dalam 1–7 hari.",
    why: "Menambah dana tanpa berutang dari barang yang tidak dipakai.",
    steps: ["Pilih barang yang tidak dipakai 6 bulan terakhir.", "Foto yang jelas dan pasang di marketplace atau grup jual-beli lokal.", "Utamakan COD untuk menghindari penipuan."],
    docs: "Tidak ada.",
    limit: "Nominal dan waktu laku tidak pasti.",
  },
  igd: {
    title: "Kalau gawat darurat, langsung ke IGD",
    timing: "segera", timingText: "Sekarang juga.",
    why: "Dalam keadaan gawat darurat, rumah sakit pemerintah maupun swasta dilarang menolak pasien atau meminta uang muka (UU No. 17 Tahun 2023 Pasal 174 ayat 2).",
    steps: ["Bawa pasien ke IGD terdekat atau hubungi layanan darurat 119.", "Sampaikan kondisi pasien lebih dulu, urusan biaya belakangan.", "Kalau diminta uang muka sebelum ditangani, sampaikan aturan di atas dan minta bertemu penanggung jawab IGD."],
    docs: "KTP dan kartu BPJS jika ada. Tidak wajib untuk penanganan darurat.",
    limit: "Aturan ini berlaku untuk keadaan gawat darurat. Biaya setelah penanganan tetap perlu diurus.",
  },
  rsAdmin: {
    title: "Temui bagian administrasi atau layanan pasien rumah sakit",
    timing: "segera", timingText: "Bisa dilakukan hari ini.",
    why: "Rumah sakit bisa menjelaskan penjaminan BPJS, pengurusan PBI, dan pembayaran bertahap untuk biaya yang tidak ditanggung.",
    steps: ["Tanyakan apakah pasien bisa dilayani dengan BPJS Kesehatan.", "Kalau BPJS tidak aktif, minta diarahkan ke petugas yang membantu pengurusan PBI lewat Dinas Sosial.", "Tanyakan rincian biaya dan kemungkinan pembayaran bertahap."],
    docs: "KTP, KK, dan kartu BPJS jika ada.",
    limit: "Keringanan bergantung kebijakan rumah sakit.",
    template: "rs",
  },
  bpjs: {
    title: "Aktifkan atau ajukan BPJS Kesehatan PBI",
    timing: "proses", timingText: "Beberapa hari sampai minggu.",
    why: "Peserta PBI tidak membayar iuran karena ditanggung pemerintah. Ditujukan bagi warga miskin dan rentan miskin.",
    steps: ["Datangi Dinas Sosial setempat untuk pendataan atau pengaktifan kembali PBI.", "Kalau belum terdaftar di DTSEN, daftar lewat desa/kelurahan.", "Untuk informasi kepesertaan, hubungi kanal resmi BPJS Kesehatan."],
    docs: "KTP dan KK.",
    limit: "Penetapan peserta PBI melalui verifikasi pemerintah, tidak instan.",
    sources: ["bpjs"],
  },
  hubungiPenyedia: {
    title: "Hubungi penyedia tagihan",
    timing: "segera", timingText: "Bisa dihubungi hari ini.",
    why: "Penyedia tagihan yang berwenang memberi perpanjangan waktu atau pembayaran bertahap resmi.",
    steps: ["Hubungi lewat kantor layanan atau aplikasi resmi penyedia (jangan lewat nomor yang tidak jelas).", "Jelaskan kondisimu dan tawarkan jumlah serta tanggal yang sanggup kamu bayar.", "Minta konfirmasi tertulis."],
    docs: "Nomor pelanggan dan bukti tagihan.",
    limit: "Tidak semua penyedia memberi keringanan.",
    template: "tagihan",
  },
  hubungiPendidikan: {
    title: "Hubungi sekolah atau kampus pemberi tagihan",
    timing: "segera", timingText: "Bisa dihubungi hari ini.",
    why: "Sekolah dan kampus bisa menjelaskan penundaan, keringanan, atau bantuan yang tersedia.",
    steps: ["Siapkan bukti tagihan.", "Hubungi tata usaha (sekolah) atau bagian keuangan (kampus).", "Tanyakan penundaan, keringanan, atau bantuan internal."],
    docs: "Kartu pelajar atau KTM dan bukti tagihan.",
    limit: "Kebijakan bergantung lembaga masing-masing.",
    template: "kampus",
  },
  bayarSebagian: {
    title: "Bayar sebagian, minta sisanya ditunda",
    timing: "segera", timingText: "Bisa dilakukan hari ini.",
    why: "Kamu sudah punya sebagian dana. Membayar sebagian menunjukkan itikad baik dan sering membuat penundaan sisa tagihan lebih mudah disetujui.",
    steps: ["Hitung berapa yang bisa dibayar sekarang tanpa mengorbankan kebutuhan pokok.", "Tawarkan pembayaran itu bersama tanggal pelunasan sisanya.", "Simpan bukti pembayaran dan kesepakatan tertulis."],
    docs: "Bukti tagihan.",
    limit: "Penyedia bisa menolak. Jangan menutup sisa dengan pinjaman baru.",
  },
  desa: {
    title: "Minta bantuan ke RT/RW, desa/kelurahan, atau Dinas Sosial",
    timing: "segera", timingText: "Bisa didatangi hari ini. Bantuan tidak dijamin.",
    why: "Perangkat desa/kelurahan dan Dinas Sosial bisa mengarahkan ke bantuan pangan atau bantuan sosial yang tersedia di wilayahmu.",
    steps: ["Datangi ketua RT/RW atau kantor desa/kelurahan.", "Sampaikan kebutuhan mendesakmu (misalnya makanan untuk keluarga).", "Tanyakan juga cara terdaftar di DTSEN agar bisa diusulkan bansos."],
    docs: "KTP dan KK.",
    limit: "Ketersediaan bantuan berbeda di tiap daerah.",
  },
  lembagaSosial: {
    title: "Ajukan bantuan ke BAZNAS, LAZ, atau lembaga sosial",
    timing: "proses", timingText: "Beberapa hari sampai minggu.",
    why: "Lembaga zakat dan lembaga sosial memberi bantuan, bukan pinjaman, bagi warga yang kesulitan memenuhi kebutuhan pokok.",
    steps: ["Hubungi BAZNAS kabupaten/kota, lembaga amil zakat resmi, atau pengurus rumah ibadah terdekat.", "Jelaskan kebutuhanmu beserta buktinya.", "Ikuti proses verifikasi mereka."],
    docs: "KTP, KK, dan surat keterangan tidak mampu dari kelurahan.",
    limit: "Ada verifikasi dan dana terbatas.",
    sources: ["baznas"],
  },
  bansos: {
    title: "Cek dan daftar bantuan sosial (DTSEN)",
    timing: "proses", timingText: "Pendataan dan penetapan butuh waktu.",
    why: "Bansos ditetapkan berdasarkan data DTSEN. Kalau belum terdata, kamu belum bisa diusulkan.",
    steps: ["Cek status penerima bansos di laman resmi Kemensos.", "Kalau belum terdaftar, ajukan lewat desa/kelurahan atau Dinas Sosial.", "Simpan bukti pengajuan."],
    docs: "KTP dan KK.",
    limit: "Penetapan penerima ditentukan pemerintah, tidak instan.",
    sources: ["cekbansos"],
  },
};

/* ---------- DIREKTORI BANTUAN ----------
 * status: open | closed | waiting | verify | nomination | service
 * "open" hanya dipakai jika jadwal terverifikasi dari laman resmi.
 */
export type DirStatus = "open" | "closed" | "waiting" | "verify" | "nomination" | "service";
export type DirCategory = "pendidikan" | "kesehatan" | "sosial";

export const STATUS_LABEL: Record<DirStatus, string> = {
  open: "Pendaftaran dibuka",
  closed: "Pendaftaran ditutup",
  waiting: "Menunggu pengumuman berikutnya",
  verify: "Informasi perlu diverifikasi",
  nomination: "Tidak ada pendaftaran mandiri",
  service: "Layanan tersedia",
};

export interface DirectoryItem {
  id: string;
  name: string;
  category: DirCategory;
  target: string;
  levels: string[];
  requirements: string;
  docs: string;
  how: string;
  url: string | null;
  url2?: [string, string];
  verified: string;
  status: DirStatus;
  schedule: string;
}

export const DIRECTORY: DirectoryItem[] = [
  { id: "pip", name: "Program Indonesia Pintar (PIP)", category: "pendidikan",
    target: "Peserta didik dari keluarga kurang mampu", levels: ["smp_sma"],
    requirements: "Diusulkan sekolah lewat Dapodik (status Layak PIP) dan/atau terdata di DTSEN.",
    docs: "NISN, KK, KIP/KKS jika ada.",
    how: "Tidak mendaftar sendiri. Minta sekolah mengusulkan, lalu pantau di laman resmi. Pengaduan: ULT Kemendikdasmen 177.",
    url: "https://pip.kemendikdasmen.go.id/home_v1",
    url2: ["Mekanisme pendaftaran PIP", "https://pusatinformasi.ult.kemendikdasmen.go.id/hc/id/articles/57675686263705-Mekanisme-Pendaftaran-PIP"],
    verified: VERIFIED, status: "nomination", schedule: "Pengusulan dan penetapan per periode tahun berjalan." },
  { id: "kipk", name: "KIP Kuliah", category: "pendidikan",
    target: "Lulusan SMA/sederajat berprestasi dengan keterbatasan ekonomi", levels: ["calon"],
    requirements: "NISN, NPSN, NIK, email aktif yang sesuai Dapodik. Kelayakan dirujuk melalui DTSEN.",
    docs: "NISN, NPSN, NIK, email aktif.",
    how: "Buat akun siswa di laman resmi, lalu ikuti seleksi masuk perguruan tinggi.",
    url: "https://kip-kuliah.kemdiktisaintek.go.id/",
    verified: VERIFIED, status: "open", schedule: "Pendaftaran akun siswa 3 Feb – 31 Okt 2026 (jadwal dapat berubah)." },
  { id: "bu", name: "Beasiswa Unggulan", category: "pendidikan",
    target: "Masyarakat berprestasi (S1, S2, S3) dan kategori lain", levels: ["calon", "mhs"],
    requirements: "Berbeda per kategori. Lihat laman resmi.",
    docs: "Lihat laman resmi.",
    how: "Daftar online di laman resmi saat periode dibuka.",
    url: "https://beasiswaunggulan.kemendikdasmen.go.id/",
    verified: VERIFIED, status: "closed", schedule: "Pendaftaran 2026 berlangsung 20–24 Agustus 2026. Periode berikutnya belum diumumkan." },
  { id: "lpdp", name: "Beasiswa LPDP", category: "pendidikan",
    target: "Pendidikan lanjutan (S2/S3), tidak untuk S1", levels: ["s2s3"],
    requirements: "Lihat halaman prasyarat resmi.",
    docs: "Lihat halaman prasyarat resmi.",
    how: "Daftar online saat periode dibuka.",
    url: "https://lpdp.kemenkeu.go.id/beasiswa/pendaftaran-beasiswa/",
    verified: VERIFIED, status: "closed", schedule: "Pendaftaran 2026 Tahap 2: 30 Jun – 31 Jul 2026." },
  { id: "bpjs", name: "BPJS Kesehatan (PBI)", category: "kesehatan",
    target: "Warga miskin dan rentan miskin", levels: [],
    requirements: "Terdata dan diusulkan lewat Dinas Sosial.",
    docs: "KTP dan KK.",
    how: "Datangi Dinas Sosial untuk pendataan atau pengaktifan kembali PBI. Info peserta mandiri: WhatsApp Pandawa 0811-8165-165.",
    url: "https://www.bpjs-kesehatan.go.id",
    verified: VERIFIED, status: "nomination", schedule: "Tidak ada periode pendaftaran. Diusulkan lewat Dinas Sosial." },
  { id: "cekbansos", name: "Cek Bansos Kemensos", category: "sosial",
    target: "Warga yang ingin memeriksa status penerima bansos", levels: [],
    requirements: "Data wilayah dan nama sesuai KTP.",
    docs: "KTP.",
    how: "Cek di laman resmi. Pendaftaran DTSEN lewat desa/kelurahan atau Dinas Sosial.",
    url: "https://cekbansos.kemensos.go.id",
    verified: VERIFIED, status: "verify", schedule: "Laman tidak dapat diuji otomatis. Pastikan alamatnya persis cekbansos.kemensos.go.id." },
  { id: "baznas", name: "BAZNAS", category: "sosial",
    target: "Warga yang kesulitan memenuhi kebutuhan pokok (mustahik)", levels: [],
    requirements: "Berbeda per program. Lihat menu Layanan Mustahik.",
    docs: "Biasanya KTP, KK, dan surat keterangan tidak mampu.",
    how: "Ajukan lewat BAZNAS kabupaten/kota atau menu Layanan Mustahik di laman resmi.",
    url: "https://baznas.go.id",
    verified: VERIFIED, status: "service", schedule: "Prosedur pengajuan perlu dicek di menu Layanan Mustahik." },
  { id: "sos119", name: "Layanan gawat darurat 119", category: "kesehatan",
    target: "Siapa pun dalam keadaan gawat darurat medis", levels: [],
    requirements: "Tidak ada.", docs: "Tidak ada.",
    how: "Hubungi 119 atau datang langsung ke IGD terdekat.",
    url: null, verified: VERIFIED, status: "service", schedule: "24 jam." },
];
