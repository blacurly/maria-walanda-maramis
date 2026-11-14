// Layanan API "Cari Alternatif": validasi jawaban + memanggil aturan di features/cari-alternatif/rules.ts.
import { ACTIONS } from "@/features/cari-alternatif/data";
import { CATEGORIES, page, recommend, type Answers, type CategoryKey } from "@/features/cari-alternatif/rules";

const KATEGORI = Object.keys(CATEGORIES) as CategoryKey[];

/** Daftar kategori beserta pertanyaannya, untuk GET /api/alternatif. */
export function daftarPertanyaan() {
  return KATEGORI.map((k) => ({
    kategori: k,
    judul: CATEGORIES[k].title,
    deskripsi: CATEGORIES[k].desc,
    pertanyaan: CATEGORIES[k].questions.map((q) => ({
      kunci: q.key,
      teks: q.text,
      pilihan: q.options.map((o) => ({ nilai: o.v, label: o.label })),
    })),
  }));
}

/** Memeriksa kategori dan SEMUA jawaban: setiap pertanyaan wajib dijawab dengan pilihan yang tersedia. */
export function periksaJawaban(isi: Record<string, unknown>): string | { kategori: CategoryKey; jawaban: Answers; putaran: number } {
  const kategori = isi.kategori;
  if (typeof kategori !== "string" || !(KATEGORI as string[]).includes(kategori)) {
    return `"kategori" harus salah satu dari: ${KATEGORI.join(", ")}.`;
  }
  const kiriman = isi.jawaban;
  if (!kiriman || typeof kiriman !== "object" || Array.isArray(kiriman)) return `"jawaban" harus berupa objek, misalnya {"level": "mhs"}.`;

  const jawaban: Answers = {};
  for (const q of CATEGORIES[kategori as CategoryKey].questions) {
    const nilai = (kiriman as Record<string, unknown>)[q.key];
    const sah = q.options.map((o) => o.v);
    if (typeof nilai !== "string" || !sah.includes(nilai)) {
      return `Jawaban "${q.key}" (${q.text}) harus salah satu dari: ${sah.join(", ")}.`;
    }
    jawaban[q.key] = nilai;
  }

  const putaran = isi.putaran === undefined ? 0 : Number(isi.putaran);
  if (!Number.isInteger(putaran) || putaran < 0 || putaran > 10) return `"putaran" harus bilangan bulat 0 sampai 10.`;
  return { kategori: kategori as CategoryKey, jawaban, putaran };
}

/** Rekomendasi untuk satu putaran (0 = rekomendasi utama; 1, 2, ... = langkah berikutnya bila belum berhasil). */
export function rekomendasiAlternatif(kategori: CategoryKey, jawaban: Answers, putaran: number) {
  const hasil = recommend(kategori, jawaban);
  const halaman = page(hasil, putaran);
  const rinci = (id: string) => {
    const a = ACTIONS[id];
    return {
      id,
      judul: a.title,
      waktu: a.timing, // segera | proses | seleksi
      keterangan_waktu: a.timingText,
      alasan: hasil.reasons[id] ?? a.why,
      langkah: a.steps,
      dokumen: a.docs,
      batasan: a.limit,
    };
  };
  return {
    ringkasan: hasil.summary,
    darurat: hasil.emergency,
    utama: halaman.main.map(rinci),
    berikutnya: halaman.next.map(rinci),
    habis: halaman.exhausted,
    kategori_terkait: hasil.crossLink,
  };
}
