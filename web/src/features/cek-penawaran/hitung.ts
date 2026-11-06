/**
 * EduPuan — Logika Kalkulator "Cek Penawaran"
 * ------------------------------------------------------------------
 * Dasar aturan: SEOJK 19/SEOJK.06/2025 (berlaku 31 Juli 2025)
 *   - Romawi XIV angka 2  : komponen manfaat ekonomi (ME)
 *   - Romawi XIV angka 3  : batas ME per hari
 *   - Romawi XIV angka 4  : batas denda per hari
 *   - Romawi XIV angka 5  : ME + denda maksimal 100% nilai pendanaan
 *   - Romawi XIII angka 2 : cicilan konsumtif maksimal 30% penghasilan (sejak 2026)
 *   - Romawi XI angka 3 k : maksimal 3 penyelenggara
 *   - Romawi IX angka 6 b : penghasilan minimal Rp3.000.000/bulan
 *
 * PENTING: file ini adalah satu-satunya sumber perhitungan.
 * Jangan menulis ulang rumus di komponen tampilan.
 * Semua angka batas ada di konstanta BATAS di bawah agar mudah diperbarui
 * jika OJK mengubah aturan.
 */

/* ======================= KONSTANTA ATURAN ======================= */

export const BATAS = {
  konsumtifPendek: 0.3, // % per hari, tenor <= 6 bulan
  konsumtifPanjang: 0.2, // % per hari, tenor > 6 bulan
  produktifKecilPendek: 0.275, // nilai pendanaan <= Rp50 juta, tenor <= 6 bulan
  produktifKecilPanjang: 0.1, // nilai pendanaan <= Rp50 juta, tenor > 6 bulan
  produktifBesar: 0.1, // nilai pendanaan > Rp50 juta
  batasProduktifKecil: 50_000_000,
  hariPerBulan: 30, // mengikuti contoh hitungan SEOJK (5 bulan = 150 hari)
  tenorPendekBulan: 6,
  rasioCicilanMaks: 30, // % penghasilan, konsumtif (OJK)
  maksAplikasi: 3,
  penghasilanMin: 3_000_000,
  // Rekomendasi EduPuan (bukan aturan OJK)
  ambangMendekatiBatas: 0.75,
  ambangCicilan: 20,
  ambangSisa: 0.1,
  ambangPotongan: 0.05,
  toleransiRincian: 1000,
  exclMinimum: 20_000, // batas wajar meterai/TTE/pajak: max(Rp20.000; 1% x P)
  exclPersen: 0.01,
} as const;

/* ======================= TIPE DATA ======================= */

export type Jenis = 'konsumtif' | 'produktif';
export type Tujuan = 'harian' | 'pendidikan' | 'kesehatan' | 'utang' | 'usaha';
export type SatuanTenor = 'hari' | 'bulan';
export type SatuanDenda = 'pct' | 'rp';
export type Status = 'merah' | 'kuning' | 'ok';
export type Lampu = 'hijau' | 'kuning' | 'risiko' | 'biaya';

export interface InputPenawaran {
  p: number; // jumlah pinjaman di kontrak (nilai pendanaan)
  d: number; // uang yang benar-benar masuk
  t: number; // total yang dikembalikan (tanpa denda)
  ten: number; // lama pinjaman
  unit: SatuanTenor;
  cmax: number; // cicilan terbesar dalam satu bulan (opsional, 0 = rata)
  jenis: Jenis;
  tujuan: Tujuan;
  bunga: number;
  admin: number;
  fee: number;
  lain: number;
  excl: number; // TTE bersertifikat, meterai, pajak
  dUnit: SatuanDenda;
  dendaStr: string; // teks isian denda, mis. "0,1" atau "5.000"
  dendaTagih: number; // denda yang sudah ditagih
  apps: number; // jumlah aplikasi pinjol lain yang aktif (3 = 3 atau lebih)
  skip: boolean; // Langkah 5 dilewati
  inc: number; // penghasilan bersih rata-rata per bulan
  wajib: number; // pengeluaran wajib per bulan
  lainCicil: number; // cicilan lain per bulan
}

export interface Temuan {
  st: Status;
  title: string;
  detail: string;
  dasar: string;
}

export interface Hasil {
  ok: boolean;
  missing: string[];
  errs: string[];
  // angka
  H: number;
  allCost: number;
  rinciSum: number;
  selisih: number;
  rinciOn: boolean;
  rinciLebih: boolean;
  hidden: number;
  ME: number;
  mePct: number;
  meUserPct: number;
  exclCap: number;
  exclOver: number;
  batas: number;
  kategori: string;
  potongan: number;
  C: number;
  Cmax: number;
  allC: number;
  filled: boolean;
  rasio: number;
  sisa: number;
  dendaOn: boolean;
  dendaRate: number;
  dendaIn: number;
  // temuan
  ojk: Temuan[];
  edu: Temuan[];
  data: Temuan[];
  lampu: Lampu;
  eligibilityRed: boolean;
  jumlah: { merah: number; kuning: number; lolos: number };
}

/* ======================= DEFAULT & SKENARIO ======================= */

export const DEFAULT_INPUT: InputPenawaran = {
  p: 0, d: 0, t: 0, ten: 0, unit: 'bulan', cmax: 0,
  jenis: 'konsumtif', tujuan: 'harian',
  bunga: 0, admin: 0, fee: 0, lain: 0, excl: 0,
  dUnit: 'pct', dendaStr: '', dendaTagih: 0,
  apps: 0, skip: false, inc: 0, wajib: 0, lainCicil: 0,
};

const S1: Partial<InputPenawaran> = {
  p: 3_000_000, d: 2_950_000, t: 3_300_000, ten: 6,
  bunga: 300_000, admin: 50_000, dendaStr: '0,1', inc: 6_000_000, wajib: 3_500_000,
};

export interface Skenario {
  id: number;
  lvl: 'hijau' | 'kuning' | 'merah';
  label: string;
  sub: string;
  v: Partial<InputPenawaran>;
}

export const SKENARIO: Skenario[] = [
  { id: 1, lvl: 'hijau', label: '1 · Tidak ditemukan masalah', sub: 'Semua batas OJK & rekomendasi EduPuan lolos', v: S1 },
  { id: 2, lvl: 'kuning', label: '2 · Beberapa peringatan', sub: 'Lolos OJK, tapi ada 3 peringatan EduPuan', v: { p: 5_000_000, d: 4_600_000, t: 5_500_000, ten: 6, bunga: 400_000, admin: 400_000, dendaStr: '0,2', inc: 4_500_000, wajib: 2_500_000, lainCicil: 200_000 } },
  { id: 3, lvl: 'merah', label: '3 · Biaya melebihi batas', sub: 'Manfaat ekonomi 2,86%/hari, batas 0,3%', v: { p: 1_000_000, d: 800_000, t: 1_200_000, ten: 14, unit: 'hari', bunga: 200_000, admin: 200_000, dendaStr: '1', skip: true } },
  { id: 4, lvl: 'merah', label: '4 · Melebihi batas 100%', sub: 'Sudah telat, biaya + denda > pinjaman', v: { p: 2_000_000, d: 1_900_000, t: 2_900_000, ten: 6, bunga: 900_000, admin: 100_000, dendaStr: '0,3', dendaTagih: 1_250_000, inc: 5_000_000, wajib: 3_000_000 } },
  { id: 5, lvl: 'kuning', label: '5 · Data belum lengkap', sub: 'Seperti skenario 1, tanpa data keuangan', v: { ...S1, skip: true } },
  { id: 6, lvl: 'merah', label: '6 · Lolos biaya, tapi berisiko', sub: 'Cicilan 30,6% gaji, uang bulanan minus', v: { p: 5_000_000, d: 4_800_000, t: 5_500_000, ten: 6, bunga: 450_000, admin: 200_000, lain: 30_000, excl: 20_000, dendaStr: '0,1', inc: 3_000_000, wajib: 2_500_000 } },
];

export const inputSkenario = (id: number): InputPenawaran => {
  const sc = SKENARIO.find((s) => s.id === id);
  return { ...DEFAULT_INPUT, ...(sc ? sc.v : {}) };
};

/* ======================= FORMAT ANGKA ======================= */

/** "Rp1.234.567" / "−Rp416.667" */
export const rp = (n: number): string => {
  const r = Math.round(n);
  return (r < 0 ? '−Rp' : 'Rp') + Math.abs(r).toLocaleString('id-ID');
};
/** persen dengan koma desimal: pc(0.0756, 3) -> "0,076%" */
export const pc = (n: number, dg = 2): string => n.toFixed(dg).replace('.', ',') + '%';
/** batas: 0.275 -> "0,275%", 0.3 -> "0,3%" */
export const fb = (b: number): string => (b === 0.275 ? '0,275' : String(b).replace('.', ',')) + '%';
/** ambil angka dari teks isian: "5.000.000" -> 5000000 */
export const num = (x: string | number): number => parseInt(String(x).replace(/\D/g, ''), 10) || 0;
/** tampilkan angka di input: 5000000 -> "5.000.000", 0 -> "" */
export const show = (n: number): string => (n ? n.toLocaleString('id-ID') : '');

const r4 = (x: number) => Math.round(x * 10000) / 10000;

/* ======================= PERHITUNGAN UTAMA ======================= */

export function hitung(s: InputPenawaran): Hasil {
  // ---------- angka dasar ----------
  const P = s.p, D = s.d, T = s.t, ten = s.ten, bulan = s.unit === 'bulan';
  const H = bulan ? ten * BATAS.hariPerBulan : ten;
  const nBulan = Math.max(1, H / BATAS.hariPerBulan);

  const missing: string[] = [];
  if (!P) missing.push('jumlah pinjaman');
  if (!D) missing.push('uang yang masuk');
  if (!T) missing.push('total yang dikembalikan');
  if (!ten) missing.push('lama pinjaman');

  const errs: string[] = [];
  if (P && D && D > P) errs.push('Uang yang masuk lebih besar dari jumlah pinjaman. Biasanya sama atau lebih kecil. Coba cek lagi.');
  if (P && T && T < P) errs.push('Total yang dikembalikan lebih kecil dari jumlah pinjaman. Coba cek lagi.');

  const allCost = T - D;
  const rinciSum = s.bunga + s.admin + s.fee + s.lain + s.excl;
  const rinciOn = rinciSum > 0;
  const selisih = allCost - rinciSum;
  const rinciLebih = !!(rinciOn && P && D && T && selisih < -BATAS.toleransiRincian);
  const hidden = rinciOn && selisih > BATAS.toleransiRincian ? selisih : 0;
  const ok = missing.length === 0 && errs.length === 0;
  const Ps = Math.max(P, 1), Hs = Math.max(H, 1);

  // ---------- batas OJK (Romawi XIV angka 3) ----------
  const produktif = s.jenis === 'produktif';
  const pendek = bulan ? ten <= BATAS.tenorPendekBulan : H <= BATAS.tenorPendekBulan * BATAS.hariPerBulan;
  const kecil = P <= BATAS.batasProduktifKecil;
  const batas = produktif
    ? (kecil ? (pendek ? BATAS.produktifKecilPendek : BATAS.produktifKecilPanjang) : BATAS.produktifBesar)
    : (pendek ? BATAS.konsumtifPendek : BATAS.konsumtifPanjang);
  const kategori = (produktif ? 'Produktif, ' + (kecil ? '≤ Rp50 juta' : '> Rp50 juta') : 'Konsumtif') +
    ', tenor ' + (pendek ? 'sampai 6 bulan' : 'di atas 6 bulan') + ' → batas ' + fb(batas) + '/hari';

  // ---------- manfaat ekonomi (Romawi XIV angka 2) ----------
  const exclCap = Math.max(BATAS.exclMinimum, BATAS.exclPersen * P);
  const exclOver = rinciOn ? Math.max(0, s.excl - exclCap) : 0;
  const ME = rinciLebih
    ? Math.max(0, allCost - Math.min(s.excl, exclCap))
    : (rinciOn ? s.bunga + s.admin + s.fee + s.lain + Math.max(selisih, 0) + exclOver : allCost);
  const MEuser = rinciLebih ? ME : ME - exclOver;
  const meUserPct = r4(MEuser / (Ps * Hs) * 100);
  const mePct = r4(ME / (Ps * Hs) * 100);
  const potongan = P - D;
  const C = T / nBulan;

  // ---------- denda ----------
  const dRp = s.dUnit === 'rp';
  const dendaIn = dRp ? parseInt(String(s.dendaStr).replace(/\D/g, ''), 10) : parseFloat(String(s.dendaStr).replace(',', '.'));
  const dendaRate = dRp ? (P ? r4(dendaIn / P * 100) : NaN) : r4(dendaIn);
  const dendaOn = String(s.dendaStr).trim() !== '' && !isNaN(dendaRate);

  // ---------- kemampuan bayar ----------
  const Cmax = Math.max(C, s.cmax || 0);
  const filled = !s.skip && s.inc > 0;
  const allC = Cmax + s.lainCicil;
  const rasio = filled ? Math.round(allC / s.inc * 10000) / 100 : 0;
  const sisa = filled ? s.inc - s.wajib - s.lainCicil - Cmax : 0;

  // ---------- pemeriksaan ----------
  const OJK: Temuan[] = [], EDU: Temuan[] = [], DAT: Temuan[] = [];
  const add = (arr: Temuan[], st: Status, title: string, detail: string, dasar = '') => arr.push({ st, title, detail, dasar });
  const X14 = 'SEOJK 19/2025 Romawi XIV';

  // O1 manfaat ekonomi per hari
  if (mePct > batas) add(OJK, 'merah', 'Manfaat ekonomi melebihi batas', 'Penawaran: ' + pc(mePct, 3) + '/hari' + (exclOver > 0 ? ' (setelah koreksi meterai/TTE/pajak; jika rincian dari aplikasi benar: ' + pc(meUserPct, 3) + '/hari)' : '') + '. Batas: ' + fb(batas) + '/hari (' + kategori.split(' → ')[0].toLowerCase() + ').', X14 + ' angka 1–3');
  else add(OJK, 'ok', 'Manfaat ekonomi tidak melebihi batas', 'Penawaran: ' + pc(mePct, 3) + '/hari' + (exclOver > 0 ? ' (setelah koreksi meterai/TTE/pajak)' : '') + '. Batas: ' + fb(batas) + '/hari.', X14 + ' angka 1–3');

  // O2 tarif denda
  if (dendaOn) {
    if (dendaRate > batas) add(OJK, 'merah', 'Tarif denda melebihi batas', 'Denda di kontrak: ' + (dRp ? rp(dendaIn) + '/hari = ' : '') + pc(dendaRate, dendaRate < 1 ? 2 : 1) + '/hari. Batas denda: ' + fb(batas) + '/hari dari nilai pendanaan.', X14 + ' angka 4');
    else add(OJK, 'ok', 'Tarif denda tidak melebihi batas', 'Denda di kontrak: ' + pc(dendaRate, 2) + '/hari. Batas: ' + fb(batas) + '/hari.', X14 + ' angka 4');
  } else add(DAT, 'kuning', 'Data denda belum tersedia', 'Isi tarif denda di Langkah 4 supaya bisa dibandingkan dengan batas OJK.');

  // O3 kumulatif 100%
  const kum = ME + s.dendaTagih;
  if (kum > P) add(OJK, 'merah', 'Melebihi batas kumulatif 100%', (s.dendaTagih > 0 ? 'Manfaat ekonomi ' + rp(ME) + ' + denda ditagih ' + rp(s.dendaTagih) + ' = ' + rp(kum) : 'Manfaat ekonomi ' + rp(ME)) + '. Batas: ' + rp(P) + ' (100% nilai pendanaan). Kelebihan ' + rp(kum - P) + ' tidak boleh dikenakan.', X14 + ' angka 5');
  else add(OJK, 'ok', 'Tidak melebihi batas kumulatif 100%', (s.dendaTagih > 0 ? 'Manfaat ekonomi + denda ditagih = ' + rp(kum) : 'Manfaat ekonomi ' + rp(ME)) + ', batas ' + rp(P) + '.', X14 + ' angka 5');

  // O4 rasio cicilan 30% (konsumtif)
  if (filled && !produktif) {
    if (rasio > BATAS.rasioCicilanMaks) add(OJK, 'merah', 'Cicilan melebihi 30% penghasilan', 'Semua cicilan ' + rp(allC) + (Cmax > C ? ' (memakai cicilan terbesar)' : '') + ' = ' + pc(rasio, 1) + ' dari penghasilan. Untuk pinjaman konsumtif, penyelenggara berizin seharusnya menilai rasio ini paling tinggi 30%.', 'SEOJK 19/2025 Romawi XIII angka 2');
    else add(OJK, 'ok', 'Cicilan tidak melebihi 30% penghasilan', 'Semua cicilan = ' + pc(rasio, 1) + ' dari penghasilan.', 'SEOJK 19/2025 Romawi XIII angka 2');
  }

  // O5 maksimal 3 aplikasi
  if (s.apps >= BATAS.maksAplikasi) add(OJK, 'merah', 'Melebihi batas 3 aplikasi', 'Pinjaman ini akan menjadi aplikasi keempat. Penyelenggara wajib memastikan penerima dana tidak menerima pendanaan dari lebih dari 3 penyelenggara.', 'SEOJK 19/2025 Romawi XI angka 3 huruf k');
  else add(OJK, 'ok', 'Tidak melebihi batas 3 aplikasi', 'Pinjaman aktif di aplikasi lain: ' + (s.apps === 0 ? 'tidak ada' : s.apps) + '.', 'SEOJK 19/2025 Romawi XI angka 3 huruf k');

  // O6 penghasilan minimum
  if (filled) {
    if (s.inc < BATAS.penghasilanMin) add(OJK, 'kuning', 'Penghasilan di bawah syarat minimum', 'Penyelenggara berizin hanya boleh mendanai penerima dana berpenghasilan rata-rata minimal Rp3.000.000 per bulan.', 'SEOJK 19/2025 Romawi IX angka 6 huruf b');
    else add(OJK, 'ok', 'Memenuhi syarat penghasilan minimum', 'Penghasilan ' + rp(s.inc) + ' (minimal Rp3.000.000).', 'SEOJK 19/2025 Romawi IX angka 6 huruf b');
  }

  // ---------- Rekomendasi EduPuan (bukan aturan OJK) ----------
  const R = 'Rekomendasi EduPuan';
  if (mePct <= batas && mePct > BATAS.ambangMendekatiBatas * batas) add(EDU, 'kuning', 'Biaya mendekati batas OJK', 'Biaya per hari sudah ' + pc(mePct / batas * 100, 0) + ' dari batas yang diizinkan.', R + ' (ambang 75%)');
  else if (mePct <= batas) add(EDU, 'ok', 'Biaya tidak mendekati batas', pc(mePct / batas * 100, 0) + ' dari batas OJK.', R + ' (ambang 75%)');
  if (filled) {
    if (produktif && rasio > BATAS.rasioCicilanMaks) add(EDU, 'merah', 'Beban cicilan sangat tinggi', 'Semua cicilan = ' + pc(rasio, 1) + ' dari penghasilan.', R + ' (batas 30% OJK berlaku untuk konsumtif)');
    else if (rasio > BATAS.ambangCicilan && rasio <= BATAS.rasioCicilanMaks) add(EDU, 'kuning', 'Beban cicilan cukup besar', 'Semua cicilan = ' + pc(rasio, 1) + ' dari penghasilan. Ruangmu tipis kalau ada pengeluaran mendadak.', R + ' (ambang 20%)');
    else if (rasio <= BATAS.ambangCicilan) add(EDU, 'ok', 'Beban cicilan di bawah 20%', 'Semua cicilan = ' + pc(rasio, 1) + ' dari penghasilan.', R + ' (ambang 20%)');
    if (sisa < 0) add(EDU, 'merah', 'Penghasilan tidak mencukupi', 'Setelah kebutuhan dan cicilan, uangmu kurang ' + rp(-sisa) + ' setiap bulan.', R);
    else if (sisa < BATAS.ambangSisa * s.inc) add(EDU, 'kuning', 'Sisa uang sangat tipis', 'Sisa per bulan hanya ' + rp(sisa) + ', kurang dari 10% penghasilan.', R + ' (ambang 10%)');
    else add(EDU, 'ok', 'Sisa uang bulanan cukup', 'Sisa per bulan ' + rp(sisa) + '.', R);
  } else add(DAT, 'kuning', 'Kemampuan bayar tidak dapat dinilai', 'Isi penghasilan, kebutuhan, dan cicilan lain di Langkah 5.');
  if (potongan / Ps > BATAS.ambangPotongan) add(EDU, 'kuning', 'Potongan di awal besar', 'Dipotong ' + rp(potongan) + ' (' + pc(potongan / Ps * 100, 0) + ') sebelum uang masuk.', R + ' (ambang 5%)');
  else add(EDU, 'ok', 'Potongan di awal wajar', 'Dipotong ' + rp(potongan) + ' (' + pc(potongan / Ps * 100, 1) + ').', R + ' (ambang 5%)');
  if (rinciOn) {
    if (hidden > 0) add(EDU, 'kuning', 'Ada biaya yang tidak dijelaskan', 'Selisih total bayar dan uang diterima ' + rp(allCost) + ', rincian hanya ' + rp(rinciSum) + '. Ada ' + rp(hidden) + ' yang tidak jelas asalnya; kami hitung sebagai manfaat ekonomi.', R);
    else if (rinciLebih) add(EDU, 'kuning', 'Rincian biaya tidak cocok', 'Jumlah rincian ' + rp(rinciSum) + ' lebih besar ' + rp(-selisih) + ' dari biaya yang benar-benar kamu tanggung (total bayar − uang diterima = ' + rp(allCost) + '). Kemungkinan ada biaya yang terhitung dua kali, misalnya meterai sudah termasuk di biaya admin. Kami memakai ' + rp(allCost) + ' sebagai patokan' + (s.excl > 0 ? ', dikurangi meterai/TTE/pajak ' + rp(Math.min(s.excl, exclCap)) : '') + '. Cek lagi rincian di aplikasi.', R);
    else add(EDU, 'ok', 'Rincian biaya cocok', 'Rincian ' + rp(rinciSum) + ' sama dengan selisih total bayar dan uang diterima.', R);
  } else add(DAT, 'kuning', 'Rincian biaya belum diisi', 'Semua selisih (' + rp(allCost) + ') dianggap manfaat ekonomi, dan biaya tersembunyi tidak bisa dideteksi.');
  if (exclOver > 0) add(EDU, 'kuning', 'Biaya meterai/TTE/pajak tidak wajar', 'Kamu mengisi ' + rp(s.excl) + ' sebagai meterai, TTE, atau pajak, padahal bea meterai hanya Rp10.000 per dokumen. Kami hanya mengecualikan ' + rp(exclCap) + '; sisanya ' + rp(exclOver) + ' kami hitung sebagai biaya pinjaman. Tanyakan rinciannya ke aplikasi sebelum tanda tangan.', R + ' (batas wajar maks(Rp20.000; 1% pinjaman))');
  if (!produktif && s.tujuan === 'utang') add(EDU, 'kuning', 'Pinjaman untuk membayar utang lain', 'Pola ini sering membuat total kewajiban bertambah.', R);

  // ---------- lampu: temuan paling berat ----------
  const all = [...OJK, ...EDU, ...DAT];
  const nM = all.filter((c) => c.st === 'merah').length;
  const nK = all.filter((c) => c.st === 'kuning').length;
  const nOk = all.filter((c) => c.st === 'ok').length;
  const costViolation = OJK.some((c) => c.st === 'merah' && /Manfaat ekonomi melebihi|Tarif denda|kumulatif/.test(c.title));
  const eligibilityRed = OJK.some((c) => c.st === 'merah' && /30%|3 aplikasi/.test(c.title));
  const lampu: Lampu = nM ? (costViolation ? 'biaya' : 'risiko') : (nK ? 'kuning' : 'hijau');

  return {
    ok, missing, errs, H, allCost, rinciSum, selisih, rinciOn, rinciLebih, hidden,
    ME, mePct, meUserPct, exclCap, exclOver, batas, kategori, potongan, C, Cmax, allC,
    filled, rasio, sisa, dendaOn, dendaRate, dendaIn,
    ojk: OJK, edu: EDU, data: DAT, lampu, eligibilityRed,
    jumlah: { merah: nM, kuning: nK, lolos: nOk },
  };
}

/* ======================= TEKS VONIS ======================= */

export interface Vonis {
  fg: string; bg: string; bd: string; tag: string; title: string; text: string; ctas: string[];
}

export function teksVonis(h: Hasil): Vonis {
  const TH: Record<Lampu, Vonis> = {
    hijau: { fg: '#0E6B47', bg: '#E6F4EC', bd: '#9FD3B6', tag: 'HIJAU · TIDAK DITEMUKAN MASALAH', title: 'Tidak ditemukan masalah pada parameter yang diperiksa.', text: 'Berdasarkan data yang kamu masukkan, tidak ditemukan pelanggaran batas OJK maupun peringatan EduPuan. Ini bukan rekomendasi untuk meminjam: setiap pinjaman tetap utang yang harus dibayar. Pertimbangkan apakah kebutuhan ini bisa ditunda atau dipenuhi tanpa berutang.', ctas: ['Lihat pilihan selain pinjol', 'Cek legalitas aplikasi'] },
    kuning: { fg: '#7A4E00', bg: '#FFF4D6', bd: '#E9C46A', tag: 'KUNING · PERTIMBANGKAN KEMBALI', title: 'Pertimbangkan kembali sebelum memutuskan.', text: 'Tidak ditemukan pelanggaran batas OJK pada pemeriksaan ini, tetapi ada hal yang perlu diwaspadai atau data yang belum lengkap.', ctas: ['Lihat pilihan selain pinjol', 'Tanya Puan AI'] },
    risiko: { fg: '#B42318', bg: '#FDECEA', bd: '#F2B8B2', tag: 'MERAH · SEBAIKNYA JANGAN DIAMBIL', title: 'Sebaiknya jangan diambil.', text: 'Biaya penawaran tidak melebihi batas OJK, tetapi penawaran ini melewati batas kemampuan bayarmu.' + (h.eligibilityRed ? ' Berdasarkan ketentuan OJK, penyelenggara berizin seharusnya tidak menyetujui pendanaan dengan kondisi ini.' : ''), ctas: ['Lihat pilihan selain pinjol', 'Tanya Puan AI'] },
    biaya: { fg: '#9A1B12', bg: '#FDECEA', bd: '#E58A80', tag: 'MERAH · SEBAIKNYA JANGAN DIAMBIL', title: 'Terindikasi melebihi batas yang diperiksa berdasarkan ketentuan OJK.', text: 'Penyelenggara berizin tidak boleh mengenakan biaya atau denda melebihi batas ini. Hasil kalkulator bukan bukti bahwa aplikasinya ilegal, tetapi alasan kuat untuk mengecek legalitasnya dan membaca ulang kontrak.', ctas: ['Cek legalitas aplikasi', 'Pelajari cara melaporkan', 'Lihat pilihan selain pinjol'] },
  };
  return TH[h.lampu];
}

/* ======================= DETAIL PERHITUNGAN ======================= */

export function langkahHitung(s: InputPenawaran, h: Hasil): { label: string; val: string }[] {
  const bulan = s.unit === 'bulan';
  return [
    { label: '1. Total biaya yang kamu tanggung', val: 'Total dibayar ' + rp(s.t) + ' − uang diterima ' + rp(s.d) + ' = ' + rp(h.allCost) },
    { label: '2. Pisahkan biaya yang dikecualikan', val: h.rinciLebih
      ? 'Rincian tidak cocok, jadi dipakai total biaya ' + rp(h.allCost) + (s.excl > 0 ? ' − meterai/TTE/pajak ' + rp(Math.min(s.excl, h.exclCap)) : '') + ' = ' + rp(h.ME)
      : h.rinciOn
        ? 'Bunga ' + rp(s.bunga) + ' + admin ' + rp(s.admin) + ' + fee ' + rp(s.fee) + ' + lain ' + rp(s.lain) + (h.hidden > 0 ? ' + tidak dijelaskan ' + rp(h.hidden) : '') + (h.exclOver > 0 ? ' + kelebihan meterai/TTE/pajak ' + rp(h.exclOver) : '') + ' = ' + rp(h.ME) + ' (TTE, meterai, pajak ' + rp(s.excl - h.exclOver) + ' tidak dihitung)'
        : 'Rincian belum diisi, jadi semua selisih dianggap manfaat ekonomi: ' + rp(h.ME) },
    { label: '3. Lama pinjaman dalam hari kalender', val: bulan ? s.ten + ' bulan × 30 hari = ' + h.H + ' hari' : h.H + ' hari' },
    { label: '4. Persentase manfaat ekonomi per hari', val: rp(h.ME) + ' ÷ (' + rp(s.p) + ' × ' + h.H + ' hari) × 100% = ' + pc(h.mePct, 3) },
    { label: '5. Bandingkan dengan batas', val: h.kategori + '. ' + pc(h.mePct, 3) + (h.mePct > h.batas ? ' > ' : ' ≤ ') + fb(h.batas) },
  ];
}

/* ======================= SIMULASI TELAT BAYAR ======================= */

export function simulasiTelat(s: InputPenawaran, h: Hasil, hariTelat: number) {
  const rate = h.dendaOn ? Math.min(h.dendaRate, 100) : h.batas;
  const dPerHari = rate / 100 * s.p;
  const room = Math.max(0, s.p - h.ME);
  const dRaw = dPerHari * hariTelat;
  const dCap = Math.min(dRaw, room);
  const capDay = dPerHari > 0 ? Math.ceil(room / dPerHari) : 0;
  return {
    basis: h.dendaOn
      ? 'Memakai tarif denda di kontrakmu: ' + pc(rate, 2) + ' per hari dari nilai pendanaan.'
      : 'Tarif denda belum diisi, jadi memakai batas maksimum OJK: ' + fb(h.batas) + ' per hari dari nilai pendanaan.',
    hari: hariTelat + ' hari',
    denda: '+' + rp(dCap),
    total: rp(s.t + dCap),
    catatan: dRaw > room
      ? 'Tanpa batas, denda mencapai ' + rp(dRaw) + '. Tetapi biaya + denda tidak boleh melebihi 100% nilai pendanaan, jadi denda seharusnya berhenti di ' + rp(room) + ' (sekitar hari ke-' + capDay + ').'
      : 'Denda terus bertambah ' + rp(dPerHari) + ' per hari, dan seharusnya berhenti saat biaya + denda mencapai 100% nilai pendanaan, sekitar hari ke-' + capDay + '.',
  };
}

/* ======================= SIMULASI GALI LUBANG ======================= */

export function simulasiGaliLubang(s: InputPenawaran) {
  const k = s.p / Math.max(s.d, 1), r = s.t / Math.max(s.p, 1);
  let gp = s.p, gt = s.t;
  const rows: { label: string; p: string; t: string }[] = [];
  for (let i = 1; i <= 3; i++) {
    rows.push({ label: i === 1 ? '1 (pinjaman ini)' : String(i), p: rp(gp), t: rp(gt) });
    gp = gt * k;
    gt = gp * r;
  }
  return {
    rows,
    teks: 'Setelah 3 putaran, utang naik dari ' + rows[0].t + ' menjadi ' + rows[2].t + ', padahal uang yang benar-benar dipakai tetap ' + rp(s.d) + '.',
  };
}

