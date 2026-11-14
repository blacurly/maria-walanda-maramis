// Puan AI: menyatukan semua tahap menjadi satu fungsi jawab(pesan, riwayat).
// Sama dengan puan-ai/puan_rag/chatbot.py, kini berjalan di dalam Next.js.
//
// pesan user
//   → [1] tulis ulang jadi kueri hukum (Gemini flash-lite + kamus)     → DI_LUAR_TOPIK / BUTUH_DANA? langsung ke [4]
//   → [2] cari pasal parent-child di pgvector (embedding Gemini)       → tidak ada yang nyambung? ke [4]
//   → [3] susun bahan bacaan berlabel sumber
//   → [4] Gemini menjawab dengan system prompt + riwayat + bahan bacaan (+ catatan krisis bila perlu)
//   → [5] catat rekap ANONIM (topik/situasi/status/krisis/durasi) ke Supabase, hanya jika diaktifkan
import kamus from "./kamus_istilah.json";
import { tulisGemini, type IsiGemini } from "./gemini";
import { cariPasal, daftarSumber, susunBahan, type PasalDitemukan } from "./pencarian";
import { PENGATURAN } from "./pengaturan";
import { CATATAN_KRISIS, JAWABAN_DI_LUAR_TOPIK, KATA_KRISIS, LABEL_BAHAN, SYSTEM_PROMPT_PUAN, instruksiTulisUlang } from "./prompt";
import { catat, pisahkanLabel, teksDaftarLabel, type Status } from "./statistik";

export type Pesan = { peran: "user" | "puan"; teks: string };

export type HasilJawaban = {
  jawaban: string;
  status: Status;
  krisis: boolean;
  sumber: { id: string; label: string; peran: string }[];
  topik: string;
  situasi: string;
  kueri: string; //                    untuk evaluasi/debug, tidak dikirim ke browser
  skorTertinggi: number | null; //     untuk evaluasi/debug, tidak dikirim ke browser
};

const TEKS_KAMUS = Object.entries(kamus as Record<string, string>)
  .map(([santai, hukum]) => `- ${santai.replaceAll("|", " / ")} → ${hukum}`)
  .join("\n");
const INSTRUKSI_TULIS_ULANG = instruksiTulisUlang(TEKS_KAMUS) + teksDaftarLabel();

export function adaTandaKrisis(teks: string): boolean {
  const t = teks.toLowerCase();
  return KATA_KRISIS.some((k) => t.includes(k));
}

const teksRiwayat = (riwayat: Pesan[]) =>
  riwayat.map((m) => `${m.peran === "user" ? "User" : "Puan AI"}: ${m.teks}`).join("\n");

// [1] Tulis ulang: cukup 2 pesan user terakhir sebagai konteks.
async function tulisUlang(pesan: string, riwayat: Pesan[], batasAkhir: number): Promise<string> {
  const riwayatUser = riwayat.filter((m) => m.peran === "user").slice(-2);
  const isi = riwayatUser.length
    ? `RIWAYAT PERCAKAPAN:\n${teksRiwayat(riwayatUser)}\n\nPESAN TERBARU:\n${pesan}`
    : pesan;
  return tulisGemini(PENGATURAN.modelTulisUlang, [{ role: "user", parts: [{ text: isi }] }], {
    sistem: INSTRUKSI_TULIS_ULANG,
    suhu: 0,
    berpikir: PENGATURAN.berpikirTulisUlang,
    batasAkhir,
    waktuMaksMs: PENGATURAN.waktuTulisUlangMs,
  });
}

export async function jawab(pesan: string, riwayatMasuk: Pesan[] = []): Promise<HasilJawaban> {
  const riwayat = riwayatMasuk.slice(-PENGATURAN.maksRiwayat);
  const t0 = performance.now();
  const batasAkhir = Date.now() + PENGATURAN.batasTotalMs; // seluruh proses wajib selesai sebelum jam ini

  // [1] tulis ulang + label anonim
  const { kueri, topik: topikLabel, situasi: situasiLabel } = pisahkanLabel(await tulisUlang(pesan, riwayat, batasAkhir));

  // [2] cari pasal (dilewati untuk jalur khusus)
  let status: Status;
  let pasal: PasalDitemukan[] = [];
  let topik = topikLabel;
  let situasi = situasiLabel;
  if (kueri.includes("BUTUH_DANA")) {
    status = "butuh_dana";
    topik = situasi = "butuh_dana";
  } else if (kueri.includes("DI_LUAR_TOPIK")) {
    status = "di_luar_topik";
    topik = situasi = "di_luar_topik";
  } else {
    // pesan asli + kueri hukum dicari bersama: bahasa sehari-hari dan istilah hukum sama-sama terwakili
    pasal = await cariPasal(pesan + "\n" + kueri, batasAkhir);
    status = pasal.length ? "pasal" : "tidak_ada_pasal";
  }
  const t1 = performance.now();

  // [3] bahan bacaan
  const bahan = status === "pasal" ? susunBahan(pasal) : LABEL_BAHAN[status as keyof typeof LABEL_BAHAN];
  const krisis = adaTandaKrisis(pesan);

  // [4] Gemini menjawab. Pengecualian: pesan di luar topik (tanpa tanda krisis) dibalas teks tetap,
  //     tanpa memanggil Gemini, supaya instan dan konsisten.
  let jawaban: string;
  if (status === "di_luar_topik" && !krisis) {
    jawaban = JAWABAN_DI_LUAR_TOPIK;
  } else {
    const isi: IsiGemini = riwayat.map((m) => ({
      role: m.peran === "user" ? "user" : "model",
      parts: [{ text: m.teks }],
    }));
    isi.push({
      role: "user",
      parts: [{ text: `PESAN USER:\n${pesan}\n\nBAHAN BACAAN:\n${bahan}` + (krisis ? CATATAN_KRISIS : "") }],
    });
    jawaban = await tulisGemini(PENGATURAN.modelJawab, isi, {
      sistem: SYSTEM_PROMPT_PUAN,
      suhu: PENGATURAN.suhuJawab,
      berpikir: PENGATURAN.berpikirJawab,
      batasAkhir,
      waktuMaksMs: PENGATURAN.waktuJawabMs,
    });
  }

  const durasi = performance.now() - t0;
  // Hanya angka waktu dan status: isi pesan TIDAK pernah ditulis ke log.
  console.info(
    `Puan: status=${status} | cari ${((t1 - t0) / 1000).toFixed(1)} dtk | jawab ${((durasi - (t1 - t0)) / 1000).toFixed(1)} dtk`,
  );

  // [5] rekap anonim: tanpa isi pesan. catat() tidak pernah melempar error.
  await catat(topik, situasi, status, krisis, durasi);

  return {
    jawaban,
    status,
    krisis,
    sumber: status === "pasal" ? daftarSumber(pasal) : [],
    topik,
    situasi,
    kueri,
    skorTertinggi: pasal.length ? Math.max(...pasal.map((p) => p.skor)) : null,
  };
}
