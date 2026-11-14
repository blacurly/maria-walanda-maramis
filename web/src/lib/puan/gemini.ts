// Memanggil Gemini (LLM untuk menulis ulang pertanyaan dan menyusun jawaban) lewat REST API resmi Google.
// Pengamannya sama dengan puan-ai/puan_rag/gemini.py, ditambah BATAS WAKTU TOTAL:
//   - server sibuk / kuota per menit habis (429, 500, 503): tunggu sebentar lalu coba lagi (maks. 2x per model);
//   - jawaban terlalu lama datang (timeout): JANGAN ulangi model yang sama, langsung ke model cadangan;
//   - model menolak pengaturan "berpikir" (400): ulangi tanpa pengaturan itu;
//   - setiap percobaan hanya boleh memakai SISA waktu sampai batasAkhir, supaya tidak melewati batas Vercel.
// GEMINI_API_KEY hanya dibaca di server (tanpa awalan NEXT_PUBLIC_), jadi tidak pernah sampai ke browser.
import { PENGATURAN } from "./pengaturan";

const ALAMAT = "https://generativelanguage.googleapis.com/v1beta/models";
const STATUS_SIBUK = [429, 500, 503];
const SISA_MINIMUM_MS = 3_000; // kurang dari ini, percobaan baru tidak ada gunanya

export type IsiGemini = { role: "user" | "model"; parts: { text: string }[] }[];

// Semua percobaan (termasuk model cadangan) gagal karena Gemini sibuk / kuota habis.
export class GeminiSibuk extends Error {}
// Waktu habis sebelum Gemini sempat menjawab.
export class GeminiWaktuHabis extends Error {}
// Pengaturan server belum lengkap (GEMINI_API_KEY kosong) atau kunci ditolak.
export class GeminiBelumSiap extends Error {}

class GalatHttp extends Error {
  constructor(
    public status: number,
    pesan: string,
  ) {
    super(pesan);
  }
}

const tunggu = (ms: number) => new Promise((selesai) => setTimeout(selesai, ms));
const pesanSingkat = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 80);

async function panggilSekali(
  model: string,
  isi: IsiGemini,
  sistem: string,
  suhu: number,
  berpikir: string | null,
  waktuMs: number,
): Promise<string> {
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) throw new GeminiBelumSiap("GEMINI_API_KEY belum diisi.");

  const generationConfig: Record<string, unknown> = { temperature: suhu };
  if (berpikir) generationConfig.thinkingConfig = { thinkingLevel: berpikir };

  const r = await fetch(`${ALAMAT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sistem }] }, contents: isi, generationConfig }),
    signal: AbortSignal.timeout(waktuMs),
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    error?: { message?: string };
  };
  if (!r.ok) throw new GalatHttp(r.status, data.error?.message ?? `HTTP ${r.status}`);
  // Gabungkan semua potongan teks jawaban (bagian "pikiran" model dilewati).
  const bagian = data.candidates?.[0]?.content?.parts ?? [];
  return bagian
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
    .trim();
}

type Opsi = {
  sistem: string;
  suhu?: number;
  berpikir?: string | null;
  batasAkhir: number; //  jam (Date.now()) saat seluruh proses harus sudah selesai
  waktuMaksMs: number; // batas satu panggilan
};

export async function tulisGemini(model: string, isi: IsiGemini, opsi: Opsi): Promise<string> {
  const { sistem, suhu = 0, batasAkhir, waktuMaksMs } = opsi;
  const daftarModel = [model, ...PENGATURAN.modelCadangan.filter((m) => m !== model)];
  let pernahWaktuHabis = false;

  for (const m of daftarModel) {
    let berpikir = opsi.berpikir ?? null;
    for (let ke = 1; ke <= PENGATURAN.percobaanGemini; ke++) {
      const sisa = batasAkhir - Date.now();
      if (sisa < SISA_MINIMUM_MS) throw new GeminiWaktuHabis("Batas waktu total habis.");
      try {
        const hasil = await panggilSekali(m, isi, sistem, suhu, berpikir, Math.min(waktuMaksMs, sisa));
        if (m !== model) console.warn(`Dijawab oleh model cadangan: ${m}`);
        return hasil;
      } catch (e) {
        if (e instanceof GeminiBelumSiap) throw e;
        if (e instanceof GalatHttp && (e.status === 401 || e.status === 403)) {
          throw new GeminiBelumSiap("GEMINI_API_KEY ditolak oleh Google.");
        }
        // model ini tidak mengenal pengaturan "berpikir": ulangi tanpa pengaturan itu (tidak dihitung percobaan)
        if (e instanceof GalatHttp && e.status === 400 && berpikir) {
          console.warn(`Gemini ${m} menolak pengaturan berpikir=${berpikir}, dicoba tanpa pengaturan itu`);
          berpikir = null;
          ke--;
          continue;
        }
        // terlalu lama: jangan ulangi model yang sama, pindah ke cadangan
        if (e instanceof Error && e.name === "TimeoutError") {
          console.warn(`Gemini ${m} terlalu lama menjawab (waktu habis), pindah ke model berikutnya`);
          pernahWaktuHabis = true;
          break;
        }
        // sibuk / kuota per menit habis: tunggu sebentar lalu coba lagi model yang sama
        if (e instanceof GalatHttp && STATUS_SIBUK.includes(e.status)) {
          console.warn(`Gemini ${m} sibuk (${pesanSingkat(e)}), percobaan ${ke}/${PENGATURAN.percobaanGemini}`);
          if (ke < PENGATURAN.percobaanGemini) await tunggu(PENGATURAN.jedaGeminiMs * ke);
          continue;
        }
        // error lain (mis. 404 nama model salah, koneksi putus): model utama → lempar; cadangan → lewati
        if (m === model) throw e;
        console.warn(`Model cadangan ${m} tidak bisa dipakai, dilewati: ${pesanSingkat(e)}`);
        break;
      }
    }
  }
  if (pernahWaktuHabis) throw new GeminiWaktuHabis("Gemini terlalu lama menjawab.");
  throw new GeminiSibuk("Semua model Gemini sedang sibuk.");
}

// ---------- Embedding (pertanyaan → vektor) ----------
// gemini-embedding-001, 768 angka, taskType RETRIEVAL_QUERY untuk pertanyaan (dokumen memakai RETRIEVAL_DOCUMENT
// saat skrip pembuat indeks berjalan). Hasil dinormalisasi (panjang 1), sama dengan versi Python.
export async function embedGemini(
  teks: string,
  { batasAkhir, waktuMaksMs = 10_000 }: { batasAkhir: number; waktuMaksMs?: number },
): Promise<number[]> {
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) throw new GeminiBelumSiap("GEMINI_API_KEY belum diisi.");
  const model = PENGATURAN.modelEmbedding;

  for (let ke = 1; ke <= PENGATURAN.percobaanGemini; ke++) {
    const sisa = batasAkhir - Date.now();
    if (sisa < SISA_MINIMUM_MS) throw new GeminiWaktuHabis("Batas waktu total habis.");
    try {
      const r = await fetch(`${ALAMAT}/${model}:embedContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text: teks }] },
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: PENGATURAN.dimensiEmbedding,
        }),
        signal: AbortSignal.timeout(Math.min(waktuMaksMs, sisa)),
        cache: "no-store",
      });
      const data = (await r.json().catch(() => ({}))) as { embedding?: { values?: number[] }; error?: { message?: string } };
      if (!r.ok) throw new GalatHttp(r.status, data.error?.message ?? `HTTP ${r.status}`);
      const v = data.embedding?.values ?? [];
      if (v.length !== PENGATURAN.dimensiEmbedding) throw new Error(`Dimensi embedding ${v.length}, seharusnya ${PENGATURAN.dimensiEmbedding}`);
      const panjang = Math.hypot(...v);
      return v.map((x) => x / panjang);
    } catch (e) {
      if (e instanceof GalatHttp && (e.status === 401 || e.status === 403)) {
        throw new GeminiBelumSiap("GEMINI_API_KEY ditolak oleh Google.");
      }
      if (e instanceof Error && e.name === "TimeoutError") throw new GeminiWaktuHabis("Embedding Gemini terlalu lama.");
      if (!(e instanceof GalatHttp) || !STATUS_SIBUK.includes(e.status)) throw e;
      console.warn(`Embedding Gemini sibuk (${pesanSingkat(e)}), percobaan ${ke}/${PENGATURAN.percobaanGemini}`);
      if (ke < PENGATURAN.percobaanGemini) await tunggu(PENGATURAN.jedaGeminiMs * ke);
    }
  }
  throw new GeminiSibuk("Embedding Gemini sedang sibuk.");
}
