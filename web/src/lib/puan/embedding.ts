// Mengubah pertanyaan menjadi vektor (768 angka) dengan gemini-embedding-001.
//
// Kenapa Gemini, bukan model open source multilingual-e5-small? Keduanya diuji dengan 50 soal yang SAMA
// (13 Nov 2026): Gemini Kena 90%, e5-small 55% (curhat santai hanya 25%). Target ≥ 85%.
// Rinciannya di puan-ai/docs/03_keputusan_dan_hasil_uji.md.
//
// Vektor dokumen (833 potongan pasal) sudah tersimpan di pgvector; di sini hanya PERTANYAAN yang di-embed,
// lewat API Gemini (±0,3 detik), tanpa model yang perlu dimuat di server.
import { embedGemini } from "./gemini";

export function embedKueri(teks: string, batasAkhir: number): Promise<number[]> {
  return embedGemini(teks, { batasAkhir });
}
