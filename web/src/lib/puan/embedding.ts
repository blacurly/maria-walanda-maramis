// Mengubah pertanyaan menjadi vektor (384 angka) dengan model open source multilingual-e5-small.
// Model berjalan LANGSUNG di server Next.js (tanpa Python, tanpa API berbayar) lewat @huggingface/transformers.
//
// - Pertama kali dipakai, model (±120 MB) diunduh ke folder sementara, lalu disimpan di memori server.
//   Di Vercel ini terjadi setiap server "bangun tidur" (uji 13 Nov: ±6 detik). Permintaan berikutnya ±35 ms.
// - e5 WAJIB diberi awalan "query: " untuk pertanyaan (dokumen diberi "passage: " oleh skrip pembuat indeks).
// - Satu teks per panggilan: dengan q8, embed sekaligus (batch) sedikit menggeser hasil (keputusan #23).
import os from "node:os";
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";
import { PENGATURAN } from "./pengaturan";

// Di Vercel hanya folder sementara (/tmp) yang boleh ditulisi.
env.cacheDir = path.join(os.tmpdir(), "edupuan-model");

const muat = () => pipeline("feature-extraction", PENGATURAN.modelEmbedding, { dtype: "q8" });
type Ekstraktor = Awaited<ReturnType<typeof muat>>;

// Disimpan di globalThis supaya model tidak dimuat ulang setiap kali file berubah saat `npm run dev`.
const simpanan = globalThis as unknown as { __puanEkstraktor?: Promise<Ekstraktor> };

function ambilModel(): Promise<Ekstraktor> {
  simpanan.__puanEkstraktor ??= muat().catch((e) => {
    simpanan.__puanEkstraktor = undefined; // gagal (mis. unduhan putus): boleh dicoba lagi di permintaan berikutnya
    throw e;
  });
  return simpanan.__puanEkstraktor;
}

export async function embedKueri(teks: string): Promise<number[]> {
  const ekstrak = await ambilModel();
  const hasil = await ekstrak("query: " + teks, { pooling: "mean", normalize: true });
  const vektor = (hasil.tolist() as number[][])[0];
  if (vektor.length !== 384) throw new Error(`Dimensi embedding ${vektor.length}, seharusnya 384`);
  return vektor;
}
