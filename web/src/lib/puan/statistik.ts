// Rekap ANONIM ke Supabase: topik pertanyaan (statistik_puan) dan umpan balik suka/tidak suka (umpan_balik_puan).
// Sama dengan puan-ai/puan_rag/statistik.py.
//
// Yang dicatat HANYA: topik, situasi, status, krisis, durasi_ms (waktu dicatat otomatis oleh database).
// TIDAK PERNAH mencatat isi pesan, nama, nomor HP, alamat IP, atau ID pengguna.
//
// Pencatatan hanya aktif jika ketiganya ada: PUAN_CATAT_STATISTIK=1, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY.
// Kalau pencatatan gagal (internet putus, kunci salah), jawaban Puan TETAP terkirim ke pengguna.

// Daftar label yang disetujui (8 Nov 2026). Topik → situasi yang boleh dipilih.
export const LABEL: Record<string, string[]> = {
  penagihan: [
    "ditagih_terus_menerus",
    "menghubungi_orang_lain",
    "ancaman_kata_kasar",
    "data_foto_disebar",
    "tanya_aturan_penagihan",
    "lainnya",
  ],
  biaya: ["tagihan_membengkak", "bingung_hitungan", "biaya_tidak_transparan", "lainnya"],
  legalitas: ["cek_sebelum_pinjam", "terlanjur_pinjol_ilegal", "lainnya"],
  tidak_sanggup_bayar: ["minta_keringanan", "gali_lubang", "bingung_mulai", "lainnya"],
  data_pribadi: ["akses_data_hp", "pinjaman_atas_nama_orang", "minta_hapus_data", "lainnya"],
  pengaduan: ["cara_melapor", "laporan_tidak_ditanggapi", "lainnya"],
  keluarga: ["takut_cerita_keluarga", "lainnya"],
  lainnya: ["lainnya"],
};

const TOPIK_KHUSUS = ["butuh_dana", "di_luar_topik"]; // jalur khusus: topik = situasi
export const STATUS_SAH = ["pasal", "butuh_dana", "di_luar_topik", "tidak_ada_pasal"] as const;
export type Status = (typeof STATUS_SAH)[number];

const CARI_LABEL = /^\s*LABEL\s*:\s*([A-Za-z_]+)\s*\/\s*([A-Za-z_]+)/m;
const BARIS_LABEL = /^\s*LABEL\s*:.*$/gim;

// Daftar label untuk ditempel di akhir instruksi tulis ulang.
export function teksDaftarLabel(): string {
  const baris = Object.entries(LABEL).map(([topik, situasi]) => `- ${topik}: ${situasi.join(", ")}`);
  return "\n\nDAFTAR LABEL (topik: situasi yang boleh dipilih):\n" + baris.join("\n") + "\n";
}

// Memisahkan hasil tulis ulang menjadi kueri + label. Label yang tidak ada di daftar diganti 'lainnya'.
export function pisahkanLabel(keluaran: string): { kueri: string; topik: string; situasi: string } {
  const cocok = CARI_LABEL.exec(keluaran ?? "");
  const kueri = (keluaran ?? "").replace(BARIS_LABEL, "").trim();
  let topik = "lainnya";
  let situasi = "lainnya";
  if (cocok) {
    const t = cocok[1].toLowerCase();
    const s = cocok[2].toLowerCase();
    if (LABEL[t]) {
      topik = t;
      situasi = LABEL[t].includes(s) ? s : "lainnya";
    }
  }
  return { kueri, topik, situasi };
}

// Memastikan pasangan topik/situasi ada di daftar. Yang tidak dikenal diganti 'lainnya'.
export function labelSah(topik: string, situasi: string): [string, string] {
  if (TOPIK_KHUSUS.includes(topik) && situasi === topik) return [topik, situasi];
  if (LABEL[topik]) return [topik, LABEL[topik].includes(situasi) ? situasi : "lainnya"];
  return ["lainnya", "lainnya"];
}

function aktif(): boolean {
  return (
    process.env.PUAN_CATAT_STATISTIK === "1" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SECRET_KEY)
  );
}

// Menulis 1 baris ke tabel Supabase lewat REST API (kunci secret, hanya di server). Tidak pernah melempar error.
async function kirim(tabel: string, data: Record<string, unknown>, batasWaktuMs = 2_000): Promise<boolean> {
  if (!aktif()) return false;
  const kunci = process.env.SUPABASE_SECRET_KEY!;
  const headers: Record<string, string> = {
    apikey: kunci,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (kunci.startsWith("eyJ")) headers.Authorization = `Bearer ${kunci}`; // format kunci lama Supabase
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${tabel}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(batasWaktuMs),
      cache: "no-store",
    });
    if (!r.ok) console.warn(`statistik: gagal mencatat ke ${tabel} (status ${r.status})`);
    return r.ok;
  } catch (e) {
    console.warn(`statistik: gagal mencatat ke ${tabel}:`, e instanceof Error ? e.message : e);
    return false;
  }
}

export function catat(topik: string, situasi: string, status: Status, krisis: boolean, durasiMs: number) {
  return kirim("statistik_puan", {
    topik,
    situasi,
    status,
    krisis,
    durasi_ms: Math.max(0, Math.round(durasiMs)),
  });
}

// 1 = membantu, -1 = belum membantu. Tanpa isi pertanyaan atau jawaban.
export function catatUmpanBalik(nilai: 1 | -1, topik: string, situasi: string, status: string) {
  if ((nilai !== 1 && nilai !== -1) || !(STATUS_SAH as readonly string[]).includes(status)) {
    return Promise.resolve(false);
  }
  const [t, s] = labelSah(topik, situasi);
  return kirim("umpan_balik_puan", { nilai, topik: t, situasi: s, status });
}
