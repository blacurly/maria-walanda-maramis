// Pencarian pasal (retrieval) gaya parent-child di VECTOR DATABASE Supabase pgvector.
// Sama dengan puan-ai/puan_rag/retrieval.py, tetapi langkah 2–4 dikerjakan oleh fungsi SQL cari_pasal_puan
// (web/supabase/08_pengetahuan_puan.sql), supaya cukup SATU kali bolak-balik ke database.
//
//   1. pertanyaan → vektor 768 angka (embedding.ts, gemini-embedding-001)
//   2. 8 potongan paling mirip, yang skornya ≥ ambang → pasal induknya (maks. 3)        → peran 'utama'
//   3. pasal yang dirujuk/terkait dari pasal utama, dinilai dari kemiripannya (maks. 2)  → peran 'rujukan'
//   4. teks pasal-pasal itu disusun jadi BAHAN BACAAN berlabel sumber untuk Gemini
//
// Membaca memakai kunci PUBLISHABLE: isi peraturan adalah data publik dan tabelnya hanya boleh DIBACA (RLS).
import { embedKueri } from "./embedding";
import { PENGATURAN } from "./pengaturan";

export type PasalDitemukan = {
  pasal_id: string;
  peran: "utama" | "rujukan";
  skor: number;
  label: string;
  lokasi: string;
  teks: string;
  penjelasan: string;
};

const BATAS_WAKTU_MS = 8_000;

// Memanggil fungsi SQL lewat REST API Supabase. Koneksi yang putus (mis. ECONNRESET) dicoba lagi maks. 3 kali;
// aman, karena fungsi ini hanya MEMBACA.
async function panggilRpc(nama: string, isi: Record<string, unknown>): Promise<unknown> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !kunci) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi.");
  const headers: Record<string, string> = { "Content-Type": "application/json", apikey: kunci };
  if (kunci.startsWith("eyJ")) headers.Authorization = `Bearer ${kunci}`; // format kunci lama Supabase

  for (let coba = 1; ; coba++) {
    try {
      const r = await fetch(`${url}/rest/v1/rpc/${nama}`, {
        method: "POST",
        headers,
        body: JSON.stringify(isi),
        signal: AbortSignal.timeout(BATAS_WAKTU_MS),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`Supabase ${nama} membalas status ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return await r.json();
    } catch (e) {
      const putus = e instanceof TypeError; // fetch gagal di jalan (bukan balasan error dari database)
      if (!putus || coba === 3) throw e;
      await new Promise((selesai) => setTimeout(selesai, 500 * coba));
    }
  }
}

// Mengembalikan pasal utama + rujukan. Daftar kosong = tidak ada pasal yang "nyambung" (di bawah ambang).
export async function cariPasal(teks: string, batasAkhir: number): Promise<PasalDitemukan[]> {
  const vektor = await embedKueri(teks, batasAkhir);
  const hasil = await panggilRpc("cari_pasal_puan", {
    kueri: JSON.stringify(vektor),
    ambang: PENGATURAN.ambang,
    k_child: PENGATURAN.kChild,
    maks_utama: PENGATURAN.maksUtama,
    maks_tambah: PENGATURAN.maksTambah,
  });
  return Array.isArray(hasil) ? (hasil as PasalDitemukan[]) : [];
}

// Gabungkan teks pasal jadi satu bahan bacaan berlabel sumber (format sama dengan versi Python).
export function susunBahan(pasal: PasalDitemukan[]): string {
  return pasal
    .map((p) => {
      let teks = `[SUMBER: ${p.label} | ${p.lokasi}]\n${p.teks}`;
      if (p.penjelasan) teks += `\nPenjelasan resmi: ${p.penjelasan}`;
      return teks;
    })
    .join("\n\n---\n\n");
}

export function daftarSumber(pasal: PasalDitemukan[]) {
  return pasal.map((p) => ({ id: p.pasal_id, label: p.label, peran: p.peran }));
}
