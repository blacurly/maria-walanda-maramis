/*
 * EduPuan — Cek Alternatif Lain
 * RULES: definisi pertanyaan + pemetaan jawaban → rekomendasi.
 * recommend() dan page() adalah fungsi murni (tanpa React/DOM) sehingga mudah diuji.
 */
import { ACTIONS } from "./data";

export type CategoryKey = "pendidikan" | "tagihan" | "dasar";
export type Answers = Record<string, string>;

export interface Option { v: string; label: string }
export interface Question { key: string; text: string; options: Option[] }
export interface Category { title: string; desc: string; icon: string; questions: Question[] }

/* ---------- PERTANYAAN PER KATEGORI ---------- */
const DEADLINE: Option[] = [
  { v: "today", label: "Hari ini" },
  { v: "7d", label: "Dalam 7 hari" },
  { v: "later", label: "Lebih dari 7 hari" },
];

export const CATEGORIES: Record<CategoryKey, Category> = {
  pendidikan: {
    title: "Saya siswa atau mahasiswa",
    desc: "Bantuan biaya pendidikan, UKT, SPP, perlengkapan sekolah, atau biaya hidup selama belajar.",
    icon: "🎓",
    questions: [
      { key: "level", text: "Apa status pendidikanmu?", options: [
        { v: "smp_sma", label: "Siswa SMP/SMA/SMK" },
        { v: "mhs", label: "Mahasiswa aktif" },
        { v: "calon", label: "Calon mahasiswa" }] },
      { key: "need", text: "Biaya apa yang kamu butuhkan?", options: [
        { v: "biaya", label: "UKT/SPP" },
        { v: "hidup", label: "Biaya hidup atau kebutuhan harian" },
        { v: "perlengkapan", label: "Buku, seragam, atau perlengkapan belajar" },
        { v: "lain", label: "Biaya pendidikan lainnya" }] },
      { key: "deadline", text: "Kapan dana itu harus ada?", options: DEADLINE },
      { key: "aid", text: "Bagaimana status bantuanmu sekarang?", options: [
        { v: "unknown", label: "Belum tahu bantuan yang tersedia" },
        { v: "applied", label: "Sudah mengajukan bantuan tetapi belum ada hasil" },
        { v: "received", label: "Sudah menerima bantuan tetapi masih kurang" },
        { v: "never", label: "Belum pernah mengajukan bantuan" }] },
    ],
  },
  tagihan: {
    title: "Saya punya tagihan mendesak",
    desc: "Tagihan rumah tangga, biaya kesehatan, atau kewajiban lain yang harus dibayar dalam waktu dekat.",
    icon: "🧾",
    questions: [
      { key: "type", text: "Tagihan apa yang harus dibayar?", options: [
        { v: "rumah", label: "Listrik, air, atau kebutuhan rumah tangga" },
        { v: "pendidikan", label: "Tagihan pendidikan" },
        { v: "obat", label: "Biaya pengobatan" },
        { v: "lain", label: "Tagihan lainnya" }] },
      { key: "deadline", text: "Kapan tenggatnya?", options: DEADLINE },
      { key: "funds", text: "Bagaimana kondisi danamu saat ini?", options: [
        { v: "none", label: "Belum memiliki dana sama sekali" },
        { v: "partial", label: "Memiliki sebagian dana" },
        { v: "short", label: "Memiliki dana tetapi masih kurang" }] },
    ],
  },
  dasar: {
    title: "Saya butuh bantuan kebutuhan dasar",
    desc: "Bantuan pangan, kebutuhan rumah tangga, kesehatan, atau dukungan sosial.",
    icon: "🍚",
    questions: [
      { key: "need", text: "Apa kebutuhan utamamu?", options: [
        { v: "makanan", label: "Makanan" },
        { v: "rt", label: "Kebutuhan rumah tangga" },
        { v: "kesehatan", label: "Kesehatan" },
        { v: "lain", label: "Kebutuhan dasar lainnya" }] },
      { key: "urgency", text: "Seberapa mendesak?", options: [
        { v: "today", label: "Harus dipenuhi hari ini" },
        { v: "days", label: "Dalam beberapa hari" },
        { v: "plan", label: "Masih dapat direncanakan" }] },
    ],
  },
};

const uniq = (arr: (string | null)[]): string[] => [...new Set(arr.filter((x): x is string => !!x))];

/* ---------- RINGKASAN KONDISI ---------- */
const T_DEADLINE: Record<string, string> = { today: "hari ini", "7d": "dalam 7 hari", later: "lebih dari 7 hari lagi" };

function summaryText(cat: CategoryKey, a: Answers): string {
  if (cat === "pendidikan") {
    const who = ({ smp_sma: "siswa SMP/SMA/SMK", mhs: "mahasiswa aktif", calon: "calon mahasiswa" } as Record<string, string>)[a.level];
    const need = ({ biaya: a.level === "smp_sma" ? "SPP" : "UKT", hidup: "biaya hidup", perlengkapan: "perlengkapan belajar", lain: "biaya pendidikan" } as Record<string, string>)[a.need];
    const aid = ({ applied: " Kamu sudah mengajukan bantuan dan masih menunggu hasil.", received: " Kamu sudah menerima bantuan tetapi masih kurang." } as Record<string, string>)[a.aid] || "";
    return `Kamu ${who} yang membutuhkan bantuan ${need} ${T_DEADLINE[a.deadline]}.${aid}`;
  }
  if (cat === "tagihan") {
    const t = ({ rumah: "tagihan rumah tangga", pendidikan: "tagihan pendidikan", obat: "biaya pengobatan", lain: "tagihan" } as Record<string, string>)[a.type];
    const f = ({ none: "belum ada dana sama sekali", partial: "sudah ada sebagian dana", short: "dana masih kurang" } as Record<string, string>)[a.funds];
    return `Kamu harus membayar ${t} ${T_DEADLINE[a.deadline]} dan ${f}.`;
  }
  const n = ({ makanan: "makanan", rt: "kebutuhan rumah tangga", kesehatan: "kebutuhan kesehatan", lain: "kebutuhan dasar" } as Record<string, string>)[a.need];
  const u = ({ today: "yang harus dipenuhi hari ini", days: "dalam beberapa hari", plan: "yang masih bisa direncanakan" } as Record<string, string>)[a.urgency];
  return `Kamu membutuhkan bantuan ${n} ${u}.`;
}

/* ---------- ALASAN YANG MENYESUAIKAN JAWABAN ---------- */
function reasonFor(id: string, cat: CategoryKey, a: Answers): string | null {
  if (id === "pip" && a.need === "perlengkapan") return "PIP membantu biaya pendidikan peserta didik dari keluarga kurang mampu, termasuk kebutuhan seperti buku dan seragam. Siswa diusulkan oleh sekolah.";
  if (id === "bayarSebagian" && a.funds === "short") return "Danamu sudah ada tetapi masih kurang. Membayar yang ada dulu sering membuat penundaan sisa tagihan lebih mudah disetujui.";
  if (id === "cekStatus" && cat === "pendidikan") return "Kamu sudah mengajukan bantuan. Pastikan statusnya dulu agar tahu apakah ada dokumen yang kurang dan kapan pengumumannya.";
  if (id === "kampusKeuangan" && a.aid === "received") return "Bantuan yang kamu terima belum menutup semua tagihan. Bagian keuangan bisa menjelaskan apakah sisanya bisa ditunda atau diringankan.";
  if (id === "lembagaSosial" && a.deadline === "today") return "Lembaga zakat dan lembaga sosial memberi bantuan, bukan pinjaman. Hubungi hari ini meskipun prosesnya bisa butuh beberapa hari.";
  return null;
}

export interface RecommendResult {
  summary: string;
  ranked: string[];
  mainCount: number;
  sources: string[];
  emergency: boolean;
  crossLink: CategoryKey | null;
  reasons: Record<string, string>;
}

/* ---------- ATURAN UTAMA ----------
 * Mengembalikan urutan lengkap (ranked). UI menampilkan maks. 3 teratas sebagai rekomendasi utama,
 * 2 berikutnya sebagai alternatif, dan sisanya saat pengguna memilih "belum berhasil".
 */
export function recommend(cat: CategoryKey, a: Answers): RecommendResult {
  let ranked: (string | null)[] = [];
  let sources: string[] = [];
  let emergency = false;
  let crossLink: CategoryKey | null = null;

  if (cat === "pendidikan") {
    const aidAct = a.aid === "applied" ? "cekStatus" : a.aid === "received" ? "sisaKekurangan" : null;

    if (a.level === "mhs") {
      const primary = (a.need === "biaya" || a.need === "lain") ? "kampusKeuangan" : "kemahasiswaan";
      const other = primary === "kampusKeuangan" ? "kemahasiswaan" : "kampusKeuangan";
      if (a.deadline === "today") ranked = [primary, aidAct, other, "beasiswaInternal", "kerjaMhs"];
      else if (a.deadline === "7d") ranked = [primary, aidAct, other, "kerjaMhs", "beasiswaInternal"];
      else { ranked = [aidAct, "beasiswaInternal", primary, "kerjaMhs", other]; sources = ["bu"]; }
    }

    if (a.level === "smp_sma") {
      const primary = a.need === "biaya" ? "sekolahAdmin" : "walikelas";
      const other = primary === "sekolahAdmin" ? "walikelas" : "sekolahAdmin";
      if (a.deadline === "today") ranked = [primary, aidAct, other, "pip", "jualBarang"];
      else if (a.deadline === "7d") ranked = [primary, aidAct, "pip", other, "jualBarang", "beasiswaDaerah"];
      else ranked = [aidAct, "pip", "walikelas", "beasiswaDaerah", "sekolahAdmin"];
      sources = ["pip"];
    }

    if (a.level === "calon") {
      if (a.deadline === "today") { ranked = ["kampusTujuan", aidAct, "jualBarang", "kipk", "beasiswaDaerah"]; sources = ["kipk"]; }
      else if (a.deadline === "7d") { ranked = ["kampusTujuan", aidAct, "kipk", "jualBarang", "beasiswaDaerah"]; sources = ["kipk"]; }
      else { ranked = [aidAct, "kipk", "beasiswaDaerah", "kampusTujuan"]; sources = ["kipk", "bu"]; }
    }
  }

  if (cat === "tagihan") {
    const partial = a.funds !== "none" ? "bayarSebagian" : null;
    if (a.type === "obat") {
      if (a.deadline === "today") { emergency = true; ranked = ["igd", "rsAdmin", "bpjs", partial, "lembagaSosial", "bansos"]; sources = ["sos119", "bpjs", "baznas"]; }
      else { ranked = ["rsAdmin", "bpjs", partial, "lembagaSosial", "bansos"]; sources = ["bpjs", "baznas"]; }
    } else {
      const contact = a.type === "pendidikan" ? "hubungiPendidikan" : "hubungiPenyedia";
      let extras: string[];
      if (a.deadline === "today") extras = a.type === "rumah" ? ["desa", "lembagaSosial", "jualBarang"] : ["lembagaSosial", "jualBarang"];
      else if (a.deadline === "7d") extras = ["jualBarang", a.type === "rumah" ? "bansos" : "lembagaSosial", "desa"];
      else extras = a.type === "pendidikan" ? ["beasiswaDaerah", "jualBarang", "lembagaSosial"] : ["bansos", "jualBarang", "lembagaSosial"];
      ranked = [contact, partial, ...extras];
      sources = a.type === "rumah" ? ["cekbansos", "baznas"] : a.type === "lain" ? ["baznas"] : [];
      if (a.type === "pendidikan") crossLink = "pendidikan";
    }
  }

  if (cat === "dasar") {
    if (a.need === "kesehatan") {
      if (a.urgency === "today") { emergency = true; ranked = ["igd", "rsAdmin", "bpjs", "lembagaSosial"]; sources = ["sos119", "bpjs"]; }
      else { ranked = ["bpjs", "rsAdmin", "lembagaSosial", "bansos"]; sources = ["bpjs", "baznas"]; }
    } else {
      if (a.urgency === "today") ranked = ["desa", "lembagaSosial", "bansos", "jualBarang"];
      else if (a.urgency === "days") ranked = ["lembagaSosial", "desa", "jualBarang", "bansos"];
      else ranked = ["bansos", "lembagaSosial", "jualBarang", "desa"];
      sources = ["cekbansos", "baznas"];
    }
  }

  let list = uniq(ranked);

  /* Aturan prioritas 1: kalau harus hari ini, solusi lewat seleksi tidak boleh masuk rekomendasi utama */
  let mainCount = 3;
  if ((a.deadline || a.urgency) === "today") {
    const isSel = (id: string) => ACTIONS[id].timing === "seleksi";
    const fast = list.filter(id => !isSel(id));
    const slow = list.filter(isSel);
    list = [...fast.slice(0, 3), ...slow, ...fast.slice(3)];
    mainCount = Math.min(3, fast.length);
  }

  const reasons: Record<string, string> = {};
  list.forEach(id => { const r = reasonFor(id, cat, a); if (r) reasons[id] = r; });

  return { summary: summaryText(cat, a), ranked: list, mainCount, sources, emergency, crossLink, reasons };
}

/* Halaman: round 0 → maks. 3 utama + 2 alternatif; tiap "belum berhasil" menggeser ke langkah berikutnya */
export function page(result: RecommendResult, round: number) {
  const mc = result.mainCount ?? 3;
  const start = round === 0 ? 0 : mc + (round - 1) * 3;
  const size = round === 0 ? mc : 3;
  return {
    main: result.ranked.slice(start, start + size),
    next: result.ranked.slice(start + size, start + size + 2),
    exhausted: start >= result.ranked.length,
  };
}
