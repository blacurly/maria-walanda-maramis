// =====================================================================
// buat-indeks-puan.mjs
// Mengisi VECTOR DATABASE Puan AI (Supabase pgvector) dari knowledge base hukum.
//
//   knowledge_base_pecah.json  ──►  dokumen_hukum, pasal, pasal_tautan, potongan_pasal (+ embedding)
//
// Jalankan dari folder web:   node scripts/buat-indeks-puan.mjs
//
// - Embedding: multilingual-e5-small (384 angka), teks diberi awalan "passage: ".
// - Hemat: potongan yang teksnya TIDAK berubah (sidik sama) tidak di-embed ulang.
// - Sinkron: pasal/potongan/tautan yang sudah tidak ada di knowledge base ikut DIHAPUS.
// - Butuh kunci SECRET Supabase (dibaca dari .env.local). Skrip ini hanya untuk laptop,
//   tidak pernah dijalankan di browser dan tidak ikut ke Vercel.
// =====================================================================
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { pipeline, env } from "@huggingface/transformers";

const FOLDER_WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE_KB = path.resolve(FOLDER_WEB, "../puan-ai/output/knowledge_base_pecah.json");
const MODEL_HF = "Xenova/multilingual-e5-small";
const NAMA_MODEL = "multilingual-e5-small"; // sama dengan nilai bawaan kolom potongan_pasal.model
env.cacheDir = path.join(os.tmpdir(), "edupuan-model"); // model disimpan di luar proyek (tidak ikut Git)

// ---------- 1. Kunci Supabase dari .env.local ----------
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

// ---------- 2. Baca knowledge base ----------
const kb = JSON.parse(fs.readFileSync(FILE_KB, "utf8"));
const parents = kb.parents;
const children = kb.children.filter((c) => c.jenis !== "sanksi"); // ayat sanksi tidak dicari
const idPasal = new Set(parents.map((p) => p.id));
console.log(`📖 Knowledge base: ${parents.length} pasal, ${children.length} potongan dicari`);

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
  return !r || r.sidik !== sidik(teksUntukEmbed(c)) || r.model !== NAMA_MODEL;
});
console.log(`🧮 ${children.length - perlu.length} potongan tidak berubah, ${perlu.length} perlu di-embed`);

let ekstrak = null;
async function embed(teks) {
  ekstrak ??= await pipeline("feature-extraction", MODEL_HF, { dtype: "q8" });
  // SATU PER SATU: dengan q8, embed sekaligus (batch) sedikit menggeser hasil (keputusan #23)
  const v = (await ekstrak(teks, { pooling: "mean", normalize: true })).tolist()[0];
  if (v.length !== 384) throw new Error(`Dimensi embedding ${v.length}, seharusnya 384`);
  return v;
}

if (perlu.length) {
  const siap = [];
  for (const [i, c] of perlu.entries()) {
    const teks = teksUntukEmbed(c);
    siap.push({
      id: c.id,
      pasal_id: c.parent_id,
      jenis: c.jenis,
      header: c.header,
      teks: c.teks,
      penjelasan: c.penjelasan ?? "",
      sidik: sidik(teks),
      model: NAMA_MODEL,
      embedding: JSON.stringify(await embed("passage: " + teks)),
    });
    if ((i + 1) % 50 === 0 || i + 1 === perlu.length) process.stdout.write(`   embed ${i + 1}/${perlu.length}\r`);
  }
  console.log();
  for (const bagian of potong(siap, 50))
    cek(await db.from("potongan_pasal").upsert(bagian, { onConflict: "id" }), "simpan potongan_pasal");
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
const hitung = async (tabel) =>
  (await db.from(tabel).select("*", { count: "exact", head: true })).count;
console.log(
  `📊 Isi database: ${await hitung("dokumen_hukum")} dokumen, ${await hitung("pasal")} pasal, ` +
    `${await hitung("pasal_tautan")} tautan, ${await hitung("potongan_pasal")} potongan`,
);

// Uji cari: embedding pertanyaan dihitung dulu, baru database dipanggil.
const contoh = "apakah penagih pinjol boleh menghubungi keluarga saya?";
const vKueri = JSON.stringify(await embed("query: " + contoh));
const hasil = cek(await db.rpc("cari_potongan", { kueri: vKueri, jumlah: 8 }), "uji cari_potongan");
console.log(`🔎 Uji cari: "${contoh}"`);
for (const h of hasil) console.log(`   ${h.skor.toFixed(3)}  ${h.id}`);
console.log(`⏱️  Selesai dalam ${((Date.now() - t0) / 1000).toFixed(1)} detik`);
