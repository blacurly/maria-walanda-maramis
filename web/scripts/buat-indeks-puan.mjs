// =====================================================================
// buat-indeks-puan.mjs
// Mengisi VECTOR DATABASE Puan AI (Supabase pgvector) dari knowledge base hukum.
//
//   knowledge_base_pecah.json  ──►  dokumen_hukum, pasal, pasal_tautan, potongan_pasal (+ embedding)
//
// Jalankan dari folder web:   node scripts/buat-indeks-puan.mjs
//
// - Embedding: gemini-embedding-001 (768 angka, RETRIEVAL_DOCUMENT, dinormalisasi). Dipilih lewat uji 50 soal
//   (Gemini Kena 90% vs multilingual-e5-small 55%).
// - Hemat kuota: vektor diambil dulu dari indeks Gemini yang sudah ada di repo
//   (puan-ai/output/indeks_gemini_pecah/vektor.npy + meta.json). Hanya potongan yang teksnya BERUBAH/BARU
//   yang di-embed lewat API Gemini (butuh GEMINI_API_KEY).
// - Hemat waktu: potongan yang sidiknya sama dengan yang sudah ada di database tidak dikirim ulang.
// - Sinkron: pasal/potongan/tautan yang sudah tidak ada di knowledge base ikut DIHAPUS.
// - Butuh kunci SECRET Supabase (dibaca dari .env.local). Skrip ini hanya untuk laptop,
//   tidak pernah dijalankan di browser dan tidak ikut ke Vercel.
// =====================================================================
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const FOLDER_WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOLDER_OUTPUT = path.resolve(FOLDER_WEB, "../puan-ai/output");
const FILE_KB = path.join(FOLDER_OUTPUT, "knowledge_base_pecah.json");
const FOLDER_INDEKS_LAMA = path.join(FOLDER_OUTPUT, "indeks_gemini_pecah");
const MODEL = "gemini-embedding-001"; // sama dengan nilai bawaan kolom potongan_pasal.model
const DIMENSI = 768;

// ---------- 1. Kunci dari .env.local ----------
try {
  process.loadEnvFile(path.join(FOLDER_WEB, ".env.local"));
} catch {
  console.error("❌ File web/.env.local tidak ditemukan atau tidak bisa dibaca.");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunci = process.env.SUPABASE_SECRET_KEY;
if (!url || !kunci) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SECRET_KEY belum diisi di web/.env.local");
  process.exit(1);
}

// Koneksi internet (mis. hotspot HP) kadang memutus sambungan (ECONNRESET).
// Semua operasi skrip ini aman diulang (simpan/hapus/baca), jadi permintaan yang putus dicoba lagi maks. 3x.
async function fetchUlang(input, init) {
  for (let coba = 1; ; coba++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      if (coba === 3) throw e;
      console.log(`   ⚠️ koneksi terputus (${e.cause?.code ?? e.message}), coba lagi ${coba}/2...`);
      await new Promise((selesai) => setTimeout(selesai, 1000 * coba));
    }
  }
}
const db = createClient(url, kunci, { auth: { persistSession: false }, global: { fetch: fetchUlang } });

// ---------- Alat bantu ----------
const cek = ({ data, error }, tempat) => {
  // details/hint berisi penyebab asli (mis. koneksi terputus), supaya error mudah dilacak
  if (error) throw new Error(`${tempat}: ${[error.message, error.details, error.hint].filter(Boolean).join(" | ")}`);
  return data;
};

// Supabase mengembalikan maksimal 1000 baris sekali minta, jadi diambil per halaman.
async function ambilSemua(tabel, kolom) {
  const hasil = [];
  for (let dari = 0; ; dari += 1000) {
    const data = cek(await db.from(tabel).select(kolom).range(dari, dari + 999), `baca ${tabel}`);
    hasil.push(...data);
    if (data.length < 1000) return hasil;
  }
}

const potong = (daftar, ukuran) =>
  Array.from({ length: Math.ceil(daftar.length / ukuran) }, (_, i) => daftar.slice(i * ukuran, (i + 1) * ukuran));

// Sama persis dengan puan-ai/puan_rag/indeks.py → sidik() dan knowledge_base.py → teks_untuk_embed()
const sidik = (teks) => crypto.createHash("sha1").update(teks, "utf8").digest("hex").slice(0, 16);
const teksUntukEmbed = (c) => c.header + "\n" + c.teks + (c.penjelasan ? "\nPenjelasan: " + c.penjelasan : "");

// Sama dengan knowledge_base.py → label_sumber(): "POJK 22/2023 Pasal 62" / "SEOJK 19/2025 angka romawi IV angka 1"
function labelPasal(p) {
  if (Number.isInteger(p.pasal)) return `${p.dokumen.replace(" (PDP)", "")} Pasal ${p.pasal}`;
  const [romawi, angka] = p.id.split(":")[1].split(/\.(.*)/s);
  return `${p.dokumen} angka romawi ${romawi}` + (angka ? ` angka ${angka}` : "");
}

const normalkan = (v) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};

// Membaca file .npy (format matriks NumPy) berisi angka float32: satu baris = satu vektor.
function bacaNpy(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString("latin1", 1, 6) !== "NUMPY") throw new Error(`${file} bukan file .npy`);
  const versi = buf[6];
  const awal = versi === 1 ? 10 : 12;
  const panjangHeader = versi === 1 ? buf.readUInt16LE(8) : buf.readUInt32LE(8);
  const header = buf.toString("latin1", awal, awal + panjangHeader);
  if (!header.includes("'<f4'") || header.includes("'fortran_order': True")) throw new Error("Format .npy tidak didukung");
  const [baris, kolom] = header.match(/'shape': \((\d+), (\d+)\)/).slice(1).map(Number);
  const mulai = awal + panjangHeader;
  const angka = new Float32Array(buf.buffer.slice(buf.byteOffset + mulai, buf.byteOffset + mulai + baris * kolom * 4));
  return Array.from({ length: baris }, (_, i) => Array.from(angka.subarray(i * kolom, (i + 1) * kolom)));
}

// Embedding lewat API Gemini, per kelompok 50 teks. Kuota per menit kadang habis → tunggu 60 detik lalu ulangi.
async function embedGemini(daftarTeks, tugas) {
  const kunciGemini = process.env.GEMINI_API_KEY;
  if (!kunciGemini) throw new Error("GEMINI_API_KEY belum diisi di web/.env.local (dibutuhkan untuk teks yang baru/berubah)");
  const hasil = [];
  for (const kelompok of potong(daftarTeks, 50)) {
    for (let coba = 1; ; coba++) {
      const r = await fetchUlang(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": kunciGemini },
        body: JSON.stringify({
          requests: kelompok.map((text) => ({
            model: `models/${MODEL}`,
            content: { parts: [{ text }] },
            taskType: tugas,
            outputDimensionality: DIMENSI,
          })),
        }),
      });
      if (r.ok) {
        hasil.push(...(await r.json()).embeddings.map((e) => normalkan(e.values)));
        break;
      }
      if (![429, 500, 503].includes(r.status) || coba === 5) {
        throw new Error(`Embedding Gemini gagal (status ${r.status}): ${(await r.text()).slice(0, 200)}`);
      }
      console.log(`   ⏳ Gemini sibuk / kuota per menit habis (status ${r.status}), tunggu 60 detik...`);
      await new Promise((selesai) => setTimeout(selesai, 60_000));
    }
  }
  return hasil;
}

// ---------- 2. Baca knowledge base + indeks Gemini lama ----------
const kb = JSON.parse(fs.readFileSync(FILE_KB, "utf8"));
const parents = kb.parents;
const children = kb.children.filter((c) => c.jenis !== "sanksi"); // ayat sanksi tidak dicari
const idPasal = new Set(parents.map((p) => p.id));
console.log(`📖 Knowledge base: ${parents.length} pasal, ${children.length} potongan dicari`);

const vektorLama = new Map(); // sidik teks → vektor (dari indeks Gemini yang sudah ada di repo)
if (fs.existsSync(path.join(FOLDER_INDEKS_LAMA, "meta.json"))) {
  const meta = JSON.parse(fs.readFileSync(path.join(FOLDER_INDEKS_LAMA, "meta.json"), "utf8"));
  if (meta.model === "gemini" && meta.dimensi === DIMENSI) {
    const matriks = bacaNpy(path.join(FOLDER_INDEKS_LAMA, "vektor.npy"));
    meta.sidik.forEach((s, i) => vektorLama.set(s, matriks[i]));
  }
}
console.log(`📦 Vektor Gemini siap pakai dari indeks lama: ${vektorLama.size}`);

const t0 = Date.now();

// ---------- 3. Dokumen hukum ----------
const dokumen = new Map(); // kode → judul
for (const p of parents) dokumen.set(p.id.split(":")[0], p.dokumen);
cek(
  await db.from("dokumen_hukum").upsert([...dokumen].map(([kode, judul]) => ({ kode, judul })), { onConflict: "kode" }),
  "simpan dokumen_hukum",
);
const idDokumen = new Map((await ambilSemua("dokumen_hukum", "id, kode")).map((d) => [d.kode, d.id]));

// ---------- 4. Pasal (parent) ----------
const barisPasal = parents.map((p) => ({
  id: p.id,
  dokumen_id: idDokumen.get(p.id.split(":")[0]),
  label: labelPasal(p),
  lokasi: p.lokasi,
  teks: p.teks,
  penjelasan: p.penjelasan ?? "",
}));
for (const bagian of potong(barisPasal, 200))
  cek(await db.from("pasal").upsert(bagian, { onConflict: "id" }), "simpan pasal");
console.log(`✅ ${barisPasal.length} pasal disimpan`);

// ---------- 5. Potongan (child) + embedding ----------
const lama = new Map((await ambilSemua("potongan_pasal", "id, sidik, model")).map((r) => [r.id, r]));
const perlu = children.filter((c) => {
  const r = lama.get(c.id);
  return !r || r.sidik !== sidik(teksUntukEmbed(c)) || r.model !== MODEL;
});
const perluApi = perlu.filter((c) => !vektorLama.has(sidik(teksUntukEmbed(c))));
console.log(
  `🧮 ${children.length - perlu.length} potongan tidak berubah, ${perlu.length} perlu disimpan ` +
    `(${perlu.length - perluApi.length} dari indeks lama, ${perluApi.length} di-embed lewat API Gemini)`,
);

if (perlu.length) {
  const dariApi = new Map();
  if (perluApi.length) {
    const vektor = await embedGemini(perluApi.map(teksUntukEmbed), "RETRIEVAL_DOCUMENT");
    perluApi.forEach((c, i) => dariApi.set(c.id, vektor[i]));
  }
  const siap = perlu.map((c) => {
    const teks = teksUntukEmbed(c);
    const v = vektorLama.get(sidik(teks)) ?? dariApi.get(c.id);
    if (!v || v.length !== DIMENSI) throw new Error(`Vektor ${c.id} tidak lengkap`);
    return {
      id: c.id,
      pasal_id: c.parent_id,
      jenis: c.jenis,
      header: c.header,
      teks: c.teks,
      penjelasan: c.penjelasan ?? "",
      sidik: sidik(teks),
      model: MODEL,
      embedding: JSON.stringify(v),
    };
  });
  for (const [i, bagian] of potong(siap, 50).entries()) {
    cek(await db.from("potongan_pasal").upsert(bagian, { onConflict: "id" }), "simpan potongan_pasal");
    process.stdout.write(`   simpan ${Math.min((i + 1) * 50, siap.length)}/${siap.length}\r`);
  }
  console.log();
}
console.log(`✅ potongan_pasal sinkron`);

// ---------- 6. Tautan antar-pasal ----------
const tautanBaru = new Map(); // "asal|tujuan" → jenis
for (const p of parents) {
  for (const t of p.terkait ?? []) tautanBaru.set(`${p.id}|${t}`, "terkait");
  for (const t of p.rujukan ?? []) tautanBaru.set(`${p.id}|${t}`, "rujukan"); // rujukan menang bila dobel
}
for (const kunciTautan of tautanBaru.keys()) {
  const [asal, tujuan] = kunciTautan.split("|");
  if (asal === tujuan || !idPasal.has(tujuan)) tautanBaru.delete(kunciTautan);
}
const tautanLama = await ambilSemua("pasal_tautan", "pasal_id, tujuan_id");
for (const t of tautanLama)
  if (!tautanBaru.has(`${t.pasal_id}|${t.tujuan_id}`))
    cek(await db.from("pasal_tautan").delete().match(t), "hapus tautan lama");
const barisTautan = [...tautanBaru].map(([k, jenis]) => {
  const [pasal_id, tujuan_id] = k.split("|");
  return { pasal_id, tujuan_id, jenis };
});
for (const bagian of potong(barisTautan, 500))
  cek(await db.from("pasal_tautan").upsert(bagian, { onConflict: "pasal_id,tujuan_id" }), "simpan pasal_tautan");
console.log(`✅ ${barisTautan.length} tautan antar-pasal disimpan`);

// ---------- 7. Hapus yang sudah tidak ada di knowledge base ----------
const idPotongan = new Set(children.map((c) => c.id));
const potonganUsang = [...lama.keys()].filter((id) => !idPotongan.has(id));
for (const bagian of potong(potonganUsang, 100))
  cek(await db.from("potongan_pasal").delete().in("id", bagian), "hapus potongan usang");

const pasalUsang = (await ambilSemua("pasal", "id")).map((r) => r.id).filter((id) => !idPasal.has(id));
for (const bagian of potong(pasalUsang, 100))
  cek(await db.from("pasal").delete().in("id", bagian), "hapus pasal usang"); // potongan & tautannya ikut terhapus

const dokumenUsang = [...idDokumen].filter(([kode]) => !dokumen.has(kode)).map(([, id]) => id);
if (dokumenUsang.length) cek(await db.from("dokumen_hukum").delete().in("id", dokumenUsang), "hapus dokumen usang");
console.log(`🧹 dihapus: ${potonganUsang.length} potongan, ${pasalUsang.length} pasal, ${dokumenUsang.length} dokumen`);

// ---------- 8. Periksa hasil ----------
const hitung = async (tabel) => (await db.from(tabel).select("*", { count: "exact", head: true })).count;
console.log(
  `📊 Isi database: ${await hitung("dokumen_hukum")} dokumen, ${await hitung("pasal")} pasal, ` +
    `${await hitung("pasal_tautan")} tautan, ${await hitung("potongan_pasal")} potongan`,
);

// Uji cari (butuh GEMINI_API_KEY untuk meng-embed pertanyaan; dilewati kalau belum diisi)
const contoh = "apakah penagih pinjol boleh menghubungi keluarga saya?";
if (process.env.GEMINI_API_KEY) {
  const [vKueri] = await embedGemini([contoh], "RETRIEVAL_QUERY");
  const hasil = cek(await db.rpc("cari_potongan", { kueri: JSON.stringify(vKueri), jumlah: 8 }), "uji cari_potongan");
  console.log(`🔎 Uji cari: "${contoh}"`);
  for (const h of hasil) console.log(`   ${h.skor.toFixed(3)}  ${h.id}`);
} else {
  console.log("🔎 Uji cari dilewati (GEMINI_API_KEY belum diisi)");
}
console.log(`⏱️  Selesai dalam ${((Date.now() - t0) / 1000).toFixed(1)} detik`);
