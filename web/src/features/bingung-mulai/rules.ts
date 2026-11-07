// Aturan "Ceritakan Situasimu": membaca cerita pengguna lewat kata kunci,
// lalu mengarahkan ke fitur EduPuan dan pihak berwenang yang sesuai.
// Alurnya: normalisasi (rapikan singkatan) → deteksi darurat → cocokkan aturan → keselamatan.
// Deteksi darurat SELALU dijalankan, termasuk nanti kalau lapisan AI ditambahkan.

export type FeatureId =
  | "cek-penawaran" | "cek-legalitas" | "cari-alternatif"
  | "rangkum-utang" | "hak-ditagih" | "analisis-pesan" | "lapor" | "beritahu-keluarga"
  | "darurat";
export type PihakId = "ojk" | "polisi" | "sapa" | "komnas" | "lbh" | "jiwa" | "darurat";
export type JenisDarurat = "kekerasan" | "sebar_data" | "pelecehan" | "menyakiti_diri" | null;

export interface Hasil {
  darurat: boolean;
  jenis_darurat: JenisDarurat;
  tanggapan: string;
  langkah: { aksi: string; alasan: string }[];
  fitur: { id: FeatureId; alasan: string }[];
  pihak: { id: PihakId; alasan: string }[];
  perlu_tanya: { pertanyaan: string; pilihan: string[] } | null;
  mode: "aturan" | "ai";
}

export const FEATURES: Record<FeatureId, { name: string; desc: string; href: string }> = {
  "cek-penawaran":     { name: "Cek Penawaran", desc: "Hitung total yang harus dibayar dari sebuah tawaran pinjaman sebelum memutuskan.", href: "/mau-pinjam/cek-penawaran" },
  "cek-legalitas":     { name: "Cek Legalitas Pinjol", desc: "Cek apakah aplikasi pinjol terdaftar di OJK cukup dari namanya.", href: "/mau-pinjam/cek-legalitas" },
  "cari-alternatif":   { name: "Cari Alternatif", desc: "Pilihan selain berutang untuk kebutuhan mendesak.", href: "/mau-pinjam/cari-alternatif" },
  "rangkum-utang":     { name: "Rangkum Semua Utang", desc: "Kumpulkan semua utang di satu tempat supaya kelihatan total dan jatuh temponya.", href: "/sudah-terjerat/rangkum-utang" },
  "hak-ditagih":       { name: "Hak Saat Ditagih", desc: "Apa yang boleh dan tidak boleh dilakukan penagih, dan cara meresponsnya.", href: "/sudah-terjerat/hak-saat-ditagih" },
  "analisis-pesan":    { name: "Analisis Pesan Penagih", desc: "Tempel pesan dari penagih untuk melihat apakah isinya melanggar aturan.", href: "/sudah-terjerat/analisis-pesan" },
  "lapor":             { name: "Dokumentasi & Lapor", desc: "Susun kronologi jadi laporan, lalu kirim ke pihak berwenang.", href: "/sudah-terjerat/dokumentasi-lapor" },
  "beritahu-keluarga": { name: "Beritahu Keluarga", desc: "Template pesan untuk orang terdekat sebelum atau setelah mereka dihubungi penagih.", href: "/sudah-terjerat/beritahu-keluarga" },
  "darurat":           { name: "Bantuan Darurat", desc: "Kontak resmi dan langkah cepat saat kamu dalam bahaya.", href: "/darurat" },
};

// Kontak resmi. Cek ulang secara berkala.
export const PIHAK: Record<PihakId, { name: string; untuk: string; kontak: [string, string][]; siapkan: string }> = {
  ojk:     { name: "OJK (Kontak 157)", untuk: "Aduan soal pinjol, cara penagihan yang melanggar, dan cek legalitas.",
             kontak: [["Telepon", "157"], ["WhatsApp", "081 157 157 157"], ["Aduan online", "kontak157.ojk.go.id"]],
             siapkan: "Nama aplikasi, tangkapan layar tagihan dan chat penagih, kronologi singkat." },
  polisi:  { name: "Polisi (Patroli Siber)", untuk: "Ancaman, pemerasan, penyebaran data atau foto, penipuan lewat HP.",
             kontak: [["Lapor online", "patrolisiber.id"], ["Darurat polisi", "110"], ["Langsung", "Polsek atau Polres terdekat"]],
             siapkan: "Tangkapan layar ancaman, nomor pengirim, rekaman telepon, kronologi dengan tanggal." },
  sapa:    { name: "SAPA 129 (KemenPPPA)", untuk: "Kekerasan atau pelecehan terhadap perempuan, termasuk KDRT.",
             kontak: [["Telepon", "129"], ["WhatsApp", "08111 129 129"]],
             siapkan: "Ceritakan apa yang terjadi dan apakah kamu aman sekarang." },
  komnas:  { name: "Komnas Perempuan", untuk: "Kekerasan berbasis gender dan rujukan ke lembaga pendamping.",
             kontak: [["Situs", "komnasperempuan.go.id"]], siapkan: "Kronologi dan bukti yang kamu punya." },
  lbh:     { name: "LBH atau Posbakum", untuk: "Bantuan hukum gratis, misalnya saat digugat, ditipu, atau butuh pendamping hukum.",
             kontak: [["Cari", "LBH di kotamu, atau Posbakum di Pengadilan Negeri setempat"]], siapkan: "Semua dokumen dan bukti terkait, KTP." },
  jiwa:    { name: "Layanan kesehatan jiwa", untuk: "Saat kamu merasa sangat berat, putus asa, atau terpikir menyakiti diri.",
             kontak: [["Telepon", "119 ext. 8"], ["Darurat", "112"]], siapkan: "Tidak perlu menyiapkan apa-apa. Cukup ceritakan yang kamu rasakan." },
  darurat: { name: "Layanan darurat", untuk: "Saat kamu dalam bahaya sekarang juga.", kontak: [["Telepon", "112"]], siapkan: "Lokasimu saat ini." },
};

// ─── ① NORMALISASI: singkatan & bahasa chat → bentuk baku ───────────────────
const SINGKATAN: Record<string, string> = {
  // kata ganti
  sy: "saya", aq: "aku", ak: "aku", gw: "saya", gue: "saya", gua: "saya",
  // negasi
  gk: "tidak", ga: "tidak", gak: "tidak", nggak: "tidak", ngga: "tidak", enggak: "tidak", tdk: "tidak", gabisa: "tidak bisa",
  // waktu & keterangan
  udh: "sudah", udah: "sudah", sdh: "sudah", blm: "belum", trs: "terus", terus2: "terus", bsk: "besok", skrg: "sekarang",
  krn: "karena", karna: "karena", bgt: "banget", jg: "juga", sm: "sama", bs: "bisa", tp: "tapi", tpi: "tapi", yg: "yang", dgn: "dengan",
  // utang & pinjol
  hutang: "utang", utg: "utang", htg: "utang", ngutang: "utang", pnjl: "pinjol", pinjol2: "pinjol",
  pinjem: "pinjam", minjem: "pinjam", minjam: "pinjam", pnjm: "pinjam", byr: "bayar", duit: "uang",
  apk: "aplikasi", app: "aplikasi", apl: "aplikasi", aplikasinya: "aplikasi",
  jt: "jatuh", jth: "jatuh", tmpo: "tempo", tempo2: "tempo",
  // penagihan
  dc: "debt collector", nagih: "menagih", dtagih: "ditagih", ditagih2: "ditagih",
  ditelpon: "ditelepon", ditlp: "ditelepon", ditlpn: "ditelepon", ditelfon: "ditelepon", ditelp: "ditelepon",
  nelpon: "menelepon", nelfon: "menelepon", telpon: "telepon", telp: "telepon", tlp: "telepon", tlpn: "telepon",
  wa: "whatsapp", didatengin: "didatangi", dtg: "datang", rmh: "rumah",
  // orang terdekat
  tmn: "teman", temen: "teman", klg: "keluarga", kluarga: "keluarga", ortu: "orang tua", kntr: "kantor", atasanku: "atasan",
};

/** Huruf kecil, huruf berulang dipendekkan, tanda baca jadi spasi, singkatan diganti bentuk baku. */
export function normalisasi(text: string): string {
  const bersih = text
    .toLowerCase()
    .replace(/([a-z])\1{2,}/g, "$1") // "tolonggg" → "tolong"
    .replace(/[^a-z0-9\s]/g, " "); // "tiba-tiba" → "tiba tiba"
  return bersih
    .split(/\s+/)
    .filter(Boolean)
    .map((k) => SINGKATAN[k] ?? k)
    .join(" ");
}

// ─── Deteksi darurat ────────────────────────────────────────────────────────
const DANGER: { type: Exclude<JenisDarurat, null>; re: RegExp }[] = [
  { type: "menyakiti_diri", re: /bunuh diri|ingin mati|pengen mati|mau mati|mati aja|akhiri hidup|mengakhiri hidup|menyakiti diri|lukai diri|(gak|nggak|tidak|ga) kuat (hidup|lagi)|capek hidup|lelah hidup/i },
  { type: "pelecehan", re: /pelecehan|dilecehkan|cabul|mesum|ajak(an)? (tidur|berhubungan)|bayar pakai badan|seksual/i },
  { type: "sebar_data", re: /(sebar|disebar|nyebar|menyebar)\w*.{0,30}(foto|video|data|ktp|wajah)|(foto|video|data|ktp).{0,30}(sebar|disebar|edit)|foto bugil|diedit/i },
  { type: "kekerasan", re: /ancam\w*|dibunuh|dipukul|memukul|ditampar|dianiaya|kdrt|didatangi|dikeroyok|kekerasan/i },
];

/** Dicek pada teks asli DAN teks yang sudah dinormalisasi, supaya tidak ada yang lolos. */
export function cekDarurat(text: string): JenisDarurat {
  const asli = text.toLowerCase();
  const baku = normalisasi(text);
  for (const d of DANGER) if (d.re.test(asli) || d.re.test(baku)) return d.type;
  return null;
}

// ─── ② ATURAN (dicocokkan pada teks yang sudah dinormalisasi) ────────────────
type Aturan = {
  re: RegExp;
  tanggapan?: string;
  langkah?: [string, string];
  fitur?: [FeatureId, string];
  pihak?: [PihakId, string];
};

const RULES: Aturan[] = [
  { re: /penagih|debt collector|ditagih|menagih|diteror|teror|neror|dikejar|ditelepon/,
    tanggapan: "Ditagih terus-menerus itu melelahkan, dan kamu tidak harus menghadapinya sendirian.",
    langkah: ["Jangan panik dan jangan berjanji bayar di luar kemampuanmu", "Penagih punya batasan. Mengancam, memaki, atau menghubungi kontakmu tidak dibenarkan."],
    fitur: ["hak-ditagih", "Kamu menyebut soal penagih. Kenali dulu batas yang tidak boleh mereka langgar."],
    pihak: ["ojk", "Cara penagihan yang melanggar bisa diadukan ke OJK."] },
  { re: /(pesan|chat|sms|whatsapp)\w*.{0,40}(penagih|debt collector|tagih)|(penagih|debt collector).{0,40}(pesan|chat|sms|whatsapp)/,
    fitur: ["analisis-pesan", "Kamu menerima pesan dari penagih. Cek apakah isinya melanggar aturan."] },
  { re: /ancam|sebar|maki|hina|fitnah|peras/,
    tanggapan: "Ancaman dan penyebaran data bukan hal yang harus kamu terima.",
    langkah: ["Simpan semua bukti: tangkapan layar, rekaman, nomor pengirim", "Bukti ini yang membuat laporanmu bisa ditindaklanjuti."],
    fitur: ["lapor", "Bantu menyusun bukti dan kronologi jadi laporan."],
    pihak: ["polisi", "Ancaman dan penyebaran data adalah tindak pidana."] },
  { re: /(hubungi|telepon|chat|whatsapp|kirim)\w*\s+(ke\s+)?(teman|keluarga|kontak|bos|atasan|kantor|saudara|orang tua|suami|ibu|bapak|tetangga)|(teman|keluarga|kontak|atasan|kantor|saudara|orang tua|tetangga)\w*.{0,30}(dihubungi|ditelepon|dichat|dikirimi|whatsapp)/,
    fitur: ["beritahu-keluarga", "Orang terdekatmu ikut dihubungi. Kabari mereka dengan pesan yang tenang dan jelas."] },
  { re: /tiba tiba (ditransfer|transfer|uang masuk|cair)|uang masuk sendiri|tidak pernah (pinjam|mengajukan)/,
    tanggapan: "Uang pinjaman yang masuk tanpa kamu ajukan bisa jadi modus pinjol ilegal.",
    langkah: ["Jangan pakai uangnya dan jangan langsung mentransfer ke rekening yang diminta", "Laporkan dulu ke bank dan OJK supaya kamu tidak terjebak tagihan."],
    pihak: ["ojk", "Laporkan pinjaman yang tidak pernah kamu ajukan."] },
  { re: /(\d+|beberapa|banyak|dua|tiga|empat|lima)\s*(aplikasi|pinjol)|gali lubang|tutup lubang|numpuk|menumpuk|jatuh tempo|telat bayar|tidak bisa bayar|belum bayar|nunggak|menunggak|gagal bayar|galbay|punya utang|utang pinjol|utang saya|utang aku|terjerat|terlilit/,
    tanggapan: "Utang di banyak tempat memang bikin pusing. Langkah pertama adalah melihat semuanya dengan jelas.",
    langkah: ["Jangan ambil pinjaman baru untuk menutup yang lama", "Gali lubang tutup lubang membuat total utang makin besar."],
    fitur: ["rangkum-utang", "Lihat total dan jatuh tempo semua utangmu di satu tempat."] },
  { re: /tawar|ditawari|mau pinjam|ingin pinjam|pengen pinjam|pengin pinjam|berencana pinjam|ambil pinjaman|baru mau pinjam|menimbang|bunga|limit|cair/,
    tanggapan: "Bagus kamu berhenti sejenak sebelum memutuskan.",
    langkah: ["Jangan putuskan hari ini", "Hitung dulu total yang harus dibayar dan cek status aplikasinya."],
    fitur: ["cek-penawaran", "Kamu sedang menimbang pinjaman. Hitung dulu totalnya."] },
  { re: /ilegal|legal|terdaftar|\bojk\b|resmi|cek pinjol|asli atau/,
    fitur: ["cek-legalitas", "Pastikan status aplikasinya di OJK."] },
  { re: /butuh uang|perlu uang|uang cepat|kepepet|darurat uang|kurang uang|tidak punya uang|biaya (sekolah|kuliah|berobat|rumah sakit|anak|kontrakan|kos)|bayar (kos|kontrakan|sekolah|kuliah|rumah sakit)/,
    tanggapan: "Kebutuhan mendesak memang membuat kita ingin cepat-cepat mengambil keputusan.",
    fitur: ["cari-alternatif", "Ada pilihan yang tidak menambah utang."] },
  { re: /suami|pasangan|kdrt|dipukul|ditampar/,
    langkah: ["Pastikan kamu aman lebih dulu", "Kalau kamu dalam bahaya, cari tempat aman atau hubungi orang yang kamu percaya."],
    pihak: ["sapa", "Mereka menangani kekerasan terhadap perempuan, termasuk dalam rumah tangga."] },
  { re: /pelecehan|dilecehkan|cabul|seksual|kekerasan/,
    pihak: ["sapa", "Mereka menangani kekerasan dan pelecehan terhadap perempuan."] },
  { re: /ditipu|penipuan|tertipu|scam|digugat|pengadilan|somasi/,
    langkah: ["Kumpulkan semua bukti transaksi dan percakapan", "Ini dasar untuk laporan atau bantuan hukum."],
    pihak: ["lbh", "Bisa memberi bantuan hukum gratis."] },
];

// ─── ③ PERTANYAAN LANJUTAN untuk cerita yang terlalu singkat ─────────────────
const TANYA_PINJOL = {
  pertanyaan: "Soal pinjolnya, mana yang paling dekat dengan situasimu?",
  pilihan: [
    "Saya baru mau pinjam",
    "Utang saya sudah banyak atau jatuh tempo",
    "Saya diteror penagih",
    "Saya mau cek pinjolnya legal atau tidak",
  ],
};
const TANYA_PERASAAN = {
  pertanyaan: "Terima kasih sudah cerita. Supaya arahannya tepat, mana yang paling dekat dengan yang kamu alami?",
  pilihan: [
    "Saya sedang menimbang mau pinjam",
    "Saya sudah punya utang pinjol",
    "Saya diteror penagih",
    "Saya butuh uang untuk kebutuhan mendesak",
  ],
};
const TANYA_UMUM = {
  pertanyaan: "Situasi mana yang paling dekat dengan kamu sekarang?",
  pilihan: [
    "Saya sedang menimbang mau pinjam",
    "Saya sudah punya utang pinjol",
    "Saya diteror penagih",
    "Saya mengalami kekerasan atau pelecehan",
  ],
};

function pilihPertanyaan(baku: string) {
  if (/pinjol|pinjaman|pinjam|utang|aplikasi|kredit|paylater/.test(baku)) return TANYA_PINJOL;
  if (/bingung|stres|pusing|takut|cemas|panik|malu|sedih|capek/.test(baku)) return TANYA_PERASAAN;
  return TANYA_UMUM;
}

// ─── ④ DETAIL dari cerita untuk tanggapan ────────────────────────────────────
function detailCerita(baku: string): string {
  const bagian: string[] = [];
  const jumlah = baku.match(/(\d+)\s*(aplikasi|pinjol)/);
  if (jumlah) bagian.push(`utang di ${jumlah[1]} aplikasi`);
  const tempo = baku.match(/jatuh tempo\s*(hari ini|besok|lusa|minggu ini|minggu depan|bulan ini)/);
  if (tempo) bagian.push(`jatuh tempo ${tempo[1]}`);
  return bagian.length ? `Kamu menyebut ${bagian.join(" dan ")}. ` : "";
}

/** Analisis cepat dari kata kunci. Hasilnya muncul seketika, tanpa internet. */
export function analisisCerita(text: string): Hasil {
  const baku = normalisasi(text);
  const danger = cekDarurat(text);
  const r: Hasil = {
    darurat: !!danger, jenis_darurat: danger, tanggapan: "",
    langkah: [], fitur: [], pihak: [], perlu_tanya: null, mode: "aturan",
  };
  const sf = new Set<string>();
  const sp = new Set<string>();
  let tanggapanPertama = "";

  for (const rule of RULES) {
    if (!rule.re.test(baku)) continue;
    if (rule.tanggapan && !tanggapanPertama) tanggapanPertama = rule.tanggapan;
    if (rule.langkah) r.langkah.push({ aksi: rule.langkah[0], alasan: rule.langkah[1] });
    if (rule.fitur && !sf.has(rule.fitur[0])) { sf.add(rule.fitur[0]); r.fitur.push({ id: rule.fitur[0], alasan: rule.fitur[1] }); }
    if (rule.pihak && !sp.has(rule.pihak[0])) { sp.add(rule.pihak[0]); r.pihak.push({ id: rule.pihak[0], alasan: rule.pihak[1] }); }
  }

  r.langkah = r.langkah.slice(0, 3);
  r.fitur = r.fitur.slice(0, 3);
  r.pihak = r.pihak.slice(0, 3);

  if (!r.langkah.length && !r.fitur.length && !r.pihak.length && !danger) {
    r.perlu_tanya = pilihPertanyaan(baku);
  } else {
    r.tanggapan =
      (tanggapanPertama ? tanggapanPertama + " " : "Terima kasih sudah cerita. ") +
      detailCerita(baku) +
      "Berikut arahan berdasarkan hal-hal yang kamu ceritakan.";
  }
  return terapkanKeselamatan(r, text);
}

/** Aturan keselamatan selalu menang, termasuk atas jawaban AI nanti. */
export function terapkanKeselamatan(r: Hasil, text: string): Hasil {
  const d = cekDarurat(text);
  if (d && !r.darurat) { r.darurat = true; r.jenis_darurat = d; }
  if (r.jenis_darurat === "menyakiti_diri" && !r.pihak.some((p) => p.id === "jiwa"))
    r.pihak.unshift({ id: "jiwa", alasan: "Kamu tidak harus menanggung ini sendirian." });
  if (r.darurat && r.jenis_darurat !== "menyakiti_diri" && !r.pihak.some((p) => p.id === "polisi" || p.id === "sapa"))
    r.pihak.unshift({ id: "darurat", alasan: "Kalau kamu dalam bahaya sekarang, hubungi layanan darurat." });
  r.pihak = r.pihak.slice(0, 3);
  return r;
}