// =====================================================================
// evaluasi-puan.mjs
// Mengukur kualitas PENCARIAN pasal Puan AI (embedding Gemini + pgvector) dengan 50 soal uji.
//
// Jalankan dari folder web:   node scripts/evaluasi-puan.mjs
//
// Perbandingan ADIL: kueri tulis ulang (puan-ai/output/cache_kueri.json) dan vektor pertanyaan
// (puan-ai/output/cache_vektor_soal_gemini.json) diambil dari uji 8 Nov 2026, jadi yang diuji di sini adalah
// vector database pgvector + fungsi SQL cari_pasal_puan. Hasil uji 8 Nov (file numpy): Kena 90%.
// Tidak memakai kuota Gemini, kecuali ada teks yang belum ada di cache (butuh GEMINI_API_KEY).
//
// Metrik utama (sama dengan puan-ai/scripts/evaluasi.py):
//   Kena  : % soal yang minimal satu pasal kuncinya ikut terambil (target ≥ 85%)
//   MRR   : rata-rata 1/posisi pasal kunci pertama (1,00 = selalu urutan pertama)
//   Lintas: % soal lintas dokumen yang mendapat pasal dari SETIAP dokumen kuncinya
// Hanya MEMBACA database (kunci publishable). Hasil lengkap ditulis ke puan-ai/output/hasil_evaluasi_pgvector.json
// Hasil uji e5-small (13 Nov, Kena 55%) dibaca dari puan-ai/output/hasil_evaluasi_e5.json sebagai pembanding.
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FOLDER_WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOLDER_PUAN = path.resolve(FOLDER_WEB, "../puan-ai");
const FILE_SOAL = path.join(FOLDER_PUAN, "data/referensi/soal_uji_puan_ai.json");
const FILE_KUERI = path.join(FOLDER_PUAN, "output/cache_kueri.json");
const FILE_VEKTOR = path.join(FOLDER_PUAN, "output/cache_vektor_soal_gemini.json");
const FILE_HASIL = path.join(FOLDER_PUAN, "output/hasil_evaluasi_pgvector.json");
const FILE_E5 = path.join(FOLDER_PUAN, "output/hasil_evaluasi_e5.json");

// Pengaturan yang diuji (sama dengan web/src/lib/puan/pengaturan.ts). Ambang bisa dicoba lewat argumen:
//   node scripts/evaluasi-puan.mjs 0.82
const AMBANG = Number(process.argv[2] ?? 0.6);
const K_CHILD = 8;
const MAKS_UTAMA = 3;
const MAKS_TAMBAH = 2;

// Hasil versi embedding Gemini + pecah huruf dengan indeks FILE numpy (uji 8 Nov 2026)
const PEMBANDING_GEMINI = { kena: 90.0, mrr: 0.79, lintasSatu: 70, lintasSemua: 40 };
const e5 = fs.existsSync(FILE_E5) ? JSON.parse(fs.readFileSync(FILE_E5, "utf8")).ringkasan : null;

// ---------- Kunci & koneksi (hanya baca) ----------
process.loadEnvFile(path.join(FOLDER_WEB, ".env.local"));
const URL_DB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KUNCI = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!URL_DB || !KUNCI) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi di .env.local");

async function rpc(nama, isi) {
  const headers = { "Content-Type": "application/json", apikey: KUNCI };
  if (KUNCI.startsWith("eyJ")) headers.Authorization = `Bearer ${KUNCI}`;
  for (let coba = 1; ; coba++) {
    try {
      const r = await fetch(`${URL_DB}/rest/v1/rpc/${nama}`, { method: "POST", headers, body: JSON.stringify(isi) });
      if (!r.ok) throw new Error(`${nama}: status ${r.status} ${(await r.text()).slice(0, 150)}`);
      return await r.json();
    } catch (e) {
      if (!(e instanceof TypeError) || coba === 4) throw e; // TypeError = koneksi putus di jalan → coba lagi
      await new Promise((s) => setTimeout(s, 700 * coba));
    }
  }
}

// Vektor pertanyaan: dari cache uji 8 Nov; kalau belum ada, di-embed lewat API Gemini (RETRIEVAL_QUERY, 768).
const cacheVektor = fs.existsSync(FILE_VEKTOR) ? JSON.parse(fs.readFileSync(FILE_VEKTOR, "utf8")) : {};
let dariApi = 0;
async function embed(teks) {
  if (cacheVektor[teks]) return cacheVektor[teks];
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) throw new Error(`Teks belum ada di cache vektor dan GEMINI_API_KEY kosong: ${teks.slice(0, 60)}`);
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text: teks }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 768,
    }),
  });
  if (!r.ok) throw new Error(`Embedding Gemini gagal: status ${r.status}`);
  const v = (await r.json()).embedding.values;
  const n = Math.hypot(...v);
  dariApi++;
  return (cacheVektor[teks] = v.map((x) => x / n));
}

// ---------- Data ----------
const soal = JSON.parse(fs.readFileSync(FILE_SOAL, "utf8")).soal;
if (!fs.existsSync(FILE_KUERI)) throw new Error(`Tidak ada ${FILE_KUERI}. File ini dibuat oleh puan-ai/scripts/evaluasi.py.`);
const cacheKueri = JSON.parse(fs.readFileSync(FILE_KUERI, "utf8"));
const tanpaKueri = soal.filter((s) => !(s.pertanyaan in cacheKueri));
if (tanpaKueri.length) throw new Error(`${tanpaKueri.length} soal belum punya kueri di cache_kueri.json`);
console.log(`📋 ${soal.length} soal (${soal.filter((s) => s.kunci.length).length} berkunci) | ambang ${AMBANG}\n`);

// ---------- Jalankan ----------
const baris = [];
for (const [i, s] of soal.entries()) {
  // Kueri dipakai APA ADANYA seperti uji 8 Nov (puan-ai/scripts/evaluasi.py), supaya cocok dengan cache vektornya.
  const kueri = String(cacheKueri[s.pertanyaan] ?? "");
  const jalurKhusus = kueri.includes("DI_LUAR_TOPIK") ? "di_luar_topik" : kueri.includes("BUTUH_DANA") ? "butuh_dana" : null;

  let terambil = [];
  let peringkatMurni = []; // tanpa ambang: untuk memisahkan masalah "urutan" dari masalah "ambang"
  if (!jalurKhusus) {
    const v = JSON.stringify(await embed(s.pertanyaan + "\n" + kueri));
    const isi = { kueri: v, k_child: K_CHILD, maks_utama: MAKS_UTAMA, maks_tambah: MAKS_TAMBAH };
    terambil = (await rpc("cari_pasal_puan", { ...isi, ambang: AMBANG })).map((p) => p.pasal_id);
    peringkatMurni = (await rpc("cari_pasal_puan", { ...isi, ambang: -1 })).map((p) => p.pasal_id);
  }
  // Skor teratas untuk pesan SAJA (tanpa tulis ulang): bahan kalibrasi ambang, sama seperti evaluasi.py
  const [teratas] = await rpc("cari_potongan", { kueri: JSON.stringify(await embed(s.pertanyaan)), jumlah: 1 });

  const posisi = terambil.findIndex((id) => s.kunci.includes(id)) + 1 || null;
  const posisiMurni = peringkatMurni.findIndex((id) => s.kunci.includes(id)) + 1 || null;
  const dokKunci = new Set(s.kunci.map((k) => k.split(":")[0]));
  const dokKena = new Set(terambil.filter((id) => s.kunci.includes(id)).map((id) => id.split(":")[0]));
  baris.push({
    no: s.no,
    jenis: s.jenis,
    kunci: s.kunci.join("; ") || "-",
    jalur: jalurKhusus ?? "cari",
    terambil: terambil.join("; "),
    posisi,
    posisiTanpaAmbang: posisiMurni,
    semuaDokumenKena: s.kunci.length ? [...dokKunci].every((d) => dokKena.has(d)) : null,
    skorPesanSaja: teratas ? Number(teratas.skor.toFixed(3)) : null,
    status: s.kunci.length
      ? posisi
        ? "KENA"
        : "MELESET"
      : jalurKhusus
        ? `DITOLAK (${jalurKhusus})`
        : terambil.length
          ? "ADA PASAL — cek jawabannya"
          : "TIDAK ADA PASAL",
  });
  process.stdout.write(`   soal ${i + 1}/${soal.length}\r`);
}

// ---------- Ringkasan ----------
const berkunci = baris.filter((b) => b.kunci !== "-");
const persen = (arr, f) => (arr.length ? Math.round((arr.filter(f).length / arr.length) * 1000) / 10 : null);
const mrr = (arr, kol) => Math.round((arr.reduce((t, b) => t + (b[kol] ? 1 / b[kol] : 0), 0) / arr.length) * 100) / 100;
const lintas = berkunci.filter((b) => b.jenis === "Lintas dokumen");
const luar = baris.filter((b) => b.kunci === "-");
const ringkasan = {
  ambang: AMBANG,
  kena: persen(berkunci, (b) => b.posisi),
  mrr: mrr(berkunci, "posisi"),
  lintasSatu: persen(lintas, (b) => b.posisi),
  lintasSemua: persen(lintas, (b) => b.semuaDokumenKena),
  kenaTanpaAmbang: persen(berkunci, (b) => b.posisiTanpaAmbang),
  diLuarCakupanDitolakAtauKosong: `${luar.filter((b) => b.status.startsWith("DITOLAK") || b.status === "TIDAK ADA PASAL").length}/${luar.length}`,
  kenaPerJenis: Object.fromEntries(
    [...new Set(berkunci.map((b) => b.jenis))].map((j) => [j, persen(berkunci.filter((b) => b.jenis === j), (b) => b.posisi)]),
  ),
};

// Kalibrasi: skor pesan-saja soal relevan vs soal di luar cakupan (cara yang sama dengan evaluasi.py)
const urut = (a) => [...a].sort((x, y) => x - y);
const skorDalam = urut(berkunci.map((b) => b.skorPesanSaja));
const skorLuar = urut(luar.map((b) => b.skorPesanSaja));
const p5 = skorDalam[Math.floor(0.05 * (skorDalam.length - 1))];
const maksLuar = skorLuar.at(-1);
const kalibrasi = {
  "5% terendah soal relevan": p5,
  "tertinggi soal di luar cakupan": maksLuar,
  "usulan ambang": p5 > maksLuar ? Math.round(((p5 + maksLuar) / 2) * 100) / 100 : "tidak bisa dipisahkan dengan ambang saja",
};

console.log("\n================ HASIL EVALUASI PENCARIAN ================");
const tabel = {
  "Gemini + pgvector (SEKARANG)": {
    Kena: ringkasan.kena,
    MRR: ringkasan.mrr,
    "Lintas ≥1": ringkasan.lintasSatu,
    "Lintas semua dok": ringkasan.lintasSemua,
  },
  "Gemini + file numpy (8 Nov)": {
    Kena: PEMBANDING_GEMINI.kena,
    MRR: PEMBANDING_GEMINI.mrr,
    "Lintas ≥1": PEMBANDING_GEMINI.lintasSatu,
    "Lintas semua dok": PEMBANDING_GEMINI.lintasSemua,
  },
};
if (e5) tabel["e5-small + pgvector (13 Nov)"] = { Kena: e5.kena, MRR: e5.mrr, "Lintas ≥1": e5.lintasSatu, "Lintas semua dok": e5.lintasSemua };
console.table(tabel);
if (dariApi) console.log(`(${dariApi} teks di-embed lewat API karena belum ada di cache)`);
console.log(`Kena per jenis soal:`, ringkasan.kenaPerJenis);
console.log(`Kena kalau TANPA ambang (urutan saja): ${ringkasan.kenaTanpaAmbang}%`);
console.log(`Soal di luar cakupan yang ditolak/kosong: ${ringkasan.diLuarCakupanDitolakAtauKosong}`);
console.log(`Kalibrasi ambang:`, kalibrasi);
console.log(`\nSoal yang MELESET:`);
for (const b of berkunci.filter((b) => !b.posisi)) console.log(`   no ${b.no} (${b.jenis}) kunci ${b.kunci} | terambil: ${b.terambil || "-"}`);

fs.writeFileSync(
  FILE_HASIL,
  JSON.stringify({ tanggal: new Date().toISOString(), model: "gemini-embedding-001 (768) + pgvector", ringkasan, kalibrasi, detail: baris }, null, 1),
);
console.log(`\n💾 Hasil lengkap: puan-ai/output/hasil_evaluasi_pgvector.json`);
