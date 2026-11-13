// Pengaturan Puan AI: semua angka yang memengaruhi perilaku RAG dikumpulkan di sini.
// Sama dengan puan-ai/puan_rag/config.py. Setiap nilai bisa ditimpa lewat environment variable
// (file .env.local di laptop, Environment Variables di Vercel) tanpa mengubah kode.

function angka(nama: string, bawaan: number): number {
  const nilai = Number(process.env[nama]);
  return process.env[nama] && Number.isFinite(nilai) ? nilai : bawaan;
}

export const PENGATURAN = {
  // ---- Embedding (lihat embedding.ts) ----
  modelEmbedding: "gemini-embedding-001",
  dimensiEmbedding: 768, // harus sama dengan kolom potongan_pasal.embedding (vector(768))

  // ---- Pencarian pasal (lihat pencarian.ts dan fungsi SQL cari_pasal_puan) ----
  // Ambang kemiripan minimum agar potongan dianggap "nyambung" dengan pertanyaan.
  // 0,60 = hasil kalibrasi uji 50 soal (teks tak berkaitan ≈ 0,52; resep nasi goreng 0,543 tertolak).
  ambang: angka("PUAN_AMBANG", 0.6),
  kChild: 8, //     berapa potongan teratas yang dilihat
  maksUtama: 3, //  maksimal pasal utama
  maksTambah: 2, // maksimal pasal tambahan dari rujukan/terkait

  // ---- Gemini (lihat gemini.ts) ----
  modelTulisUlang: process.env.PUAN_MODEL_TULIS_ULANG || "gemini-3.1-flash-lite",
  modelJawab: process.env.PUAN_MODEL_JAWAB || "gemini-3.6-flash",
  modelCadangan: ["gemini-3.1-flash-lite"],
  suhuJawab: 0.4,
  // Seberapa lama Gemini "berpikir" sebelum menulis: 'minimal' paling cepat, lalu 'low', 'medium', 'high'.
  berpikirTulisUlang: process.env.PUAN_BERPIKIR_TULIS_ULANG || "minimal",
  berpikirJawab: process.env.PUAN_BERPIKIR_JAWAB || "low",
  percobaanGemini: 2, //   saat Gemini sibuk (429/503): coba 2 kali per model
  jedaGeminiMs: 2_000, //  dengan jeda singkat supaya pengguna tidak menunggu lama
  // Batas waktu. Fungsi /api/chat di Vercel dibatasi 60 detik (maxDuration), jadi SELURUH proses
  // (tulis ulang + cari pasal + jawab, termasuk coba ulang dan model cadangan) harus selesai dalam 50 detik.
  batasTotalMs: 50_000,
  waktuTulisUlangMs: 12_000, // maks. satu panggilan tulis ulang (jawabannya pendek)
  waktuJawabMs: 22_000, //      maks. satu panggilan menyusun jawaban; sisa waktunya (±14 dtk) untuk model cadangan

  // ---- Percakapan ----
  maksRiwayat: 6, // berapa pesan terakhir (user + Puan) yang ikut dikirim ke Gemini
} as const;
