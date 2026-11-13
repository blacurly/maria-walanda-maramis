// Logika bisnis & akses data PINJOL. Route (app/api/pinjol/...) hanya memanggil fungsi di sini.
// - MEMBACA  : klien publik (tunduk RLS: publik boleh membaca)
// - MENULIS  : klien server (kunci secret), dipanggil SETELAH izin admin dicek di route
import { supabase } from "@/lib/supabase/publik";
import { supabaseServer } from "@/lib/supabase/server";
import type { KodeGalat } from "@/lib/api/galat";
import { cekNama, saranNama, type HasilCek, type Pinjol } from "@/features/cek-legalitas/rules";
import { LEGAL_PINJOL, ILEGAL_PINJOL, SUMBER_LEGAL, SUMBER_ILEGAL } from "@/data/dataPinjol";

export type StatusPinjol = "legal" | "ilegal";

export type DataPinjol = {
  id: number;
  nama: string;
  nama_perusahaan: string | null;
  status: StatusPinjol;
  alamat: string | null;
  diperbarui_pada: string;
  sumber: { id: number; nama: string; penerbit: string };
};

export type HasilDaftar = {
  data: DataPinjol[];
  halaman: number;
  per_halaman: number;
  total: number;
  total_halaman: number;
};

// Error yang sudah "diterjemahkan" ke kode resmi (lib/api/galat.ts). Route tinggal meneruskan.
export class GalatPinjol extends Error {
  constructor(public kode: KodeGalat, pesan: string) {
    super(pesan);
  }
}

// Kolom yang diambil. "sumber_data" = data dari tabel sumber_data lewat foreign key sumber_id.
const KOLOM = "id, nama, nama_perusahaan, status, alamat, diperbarui_pada, sumber_data(id, nama, penerbit)";

type BarisDb = Omit<DataPinjol, "sumber"> & { sumber_data: DataPinjol["sumber"] | null };

function rapikan(b: BarisDb): DataPinjol {
  const { sumber_data, ...sisa } = b;
  return { ...sisa, sumber: sumber_data ?? { id: 0, nama: "", penerbit: "" } };
}

// Menerjemahkan error Supabase/PostgreSQL ke kode resmi.
function terjemahkan(e: { code?: string; message?: string }, konteks: string): GalatPinjol {
  if (e.code === "23505") return new GalatPinjol("DATA_SUDAH_ADA", "Pinjol dengan nama dan status yang sama sudah ada.");
  if (e.code === "23503") return new GalatPinjol("DATA_TIDAK_VALID", "Sumber data yang dipilih tidak ada.");
  if (e.code === "23514" || e.code === "22P02" || e.code === "23502")
    return new GalatPinjol("DATA_TIDAK_VALID", "Isi data pinjol tidak sesuai aturan.");
  console.error(`Supabase error (${konteks}):`, e.code, e.message);
  return new GalatPinjol("GANGGUAN_LAYANAN", "Database sedang bermasalah. Coba lagi sebentar lagi ya.");
}

// ─────────────────────────────── VALIDASI ───────────────────────────────

export const BATAS = { nama: 120, perusahaan: 200, alamat: 300, cari: 100, perHalaman: 100 };

const teks = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);

export type ParameterDaftar = { q: string; status: StatusPinjol | null; halaman: number; perHalaman: number };

// Membaca ?q=&status=&halaman=&per_halaman= dari alamat. Mengembalikan pesan error (string) kalau tidak valid.
export function periksaParameterDaftar(cari: URLSearchParams): ParameterDaftar | string {
  const q = (cari.get("q") ?? "").trim();
  if (q.length > BATAS.cari) return `Kata pencarian maksimal ${BATAS.cari} huruf.`;

  const s = cari.get("status");
  if (s !== null && s !== "legal" && s !== "ilegal") return 'Status harus "legal" atau "ilegal".';

  const halaman = Number(cari.get("halaman") ?? 1);
  const perHalaman = Number(cari.get("per_halaman") ?? 20);
  if (!Number.isInteger(halaman) || halaman < 1) return "Halaman harus bilangan bulat mulai dari 1.";
  if (!Number.isInteger(perHalaman) || perHalaman < 1 || perHalaman > BATAS.perHalaman)
    return `per_halaman harus antara 1 dan ${BATAS.perHalaman}.`;

  return { q, status: s as StatusPinjol | null, halaman, perHalaman };
}

export function periksaId(teksId: string): number | null {
  const id = Number(teksId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type DataTulis = {
  nama?: string;
  nama_perusahaan?: string | null;
  status?: StatusPinjol;
  alamat?: string | null;
  sumber_id?: number;
  diperbarui_pada?: string;
};

// Memeriksa isi kiriman untuk TAMBAH (wajib = true) atau UBAH (wajib = false, boleh sebagian).
// Mengembalikan data bersih, atau pesan error (string).
export function periksaDataTulis(isi: Record<string, unknown>, wajib: boolean): DataTulis | string {
  const izin = ["nama", "nama_perusahaan", "status", "alamat", "sumber_id", "diperbarui_pada"];
  const asing = Object.keys(isi).filter((k) => !izin.includes(k));
  if (asing.length) return `Kolom tidak dikenal: ${asing.join(", ")}.`;

  const d: DataTulis = {};

  if ("nama" in isi || wajib) {
    const nama = teks(isi.nama);
    if (!nama) return "Nama pinjol wajib diisi.";
    if (nama.length > BATAS.nama) return `Nama pinjol maksimal ${BATAS.nama} huruf.`;
    d.nama = nama;
  }

  if ("status" in isi || wajib) {
    if (isi.status !== "legal" && isi.status !== "ilegal") return 'Status harus "legal" atau "ilegal".';
    d.status = isi.status;
  }

  if ("sumber_id" in isi || wajib) {
    const id = isi.sumber_id;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) return "sumber_id wajib berupa angka id sumber data.";
    d.sumber_id = id;
  }

  for (const [kolom, batas] of [["nama_perusahaan", BATAS.perusahaan], ["alamat", BATAS.alamat]] as const) {
    if (!(kolom in isi)) continue;
    if (isi[kolom] === null || isi[kolom] === "") { d[kolom] = null; continue; }
    const t = teks(isi[kolom]);
    if (t === undefined) return `${kolom} harus berupa teks.`;
    if (t.length > batas) return `${kolom} maksimal ${batas} huruf.`;
    d[kolom] = t;
  }

  if ("diperbarui_pada" in isi) {
    const t = teks(isi.diperbarui_pada);
    if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(t)))
      return "diperbarui_pada harus berformat tanggal YYYY-MM-DD.";
    d.diperbarui_pada = t;
  }

  if (!wajib && Object.keys(d).length === 0) return "Tidak ada data yang diubah.";
  return d;
}

// ─────────────────────────────── MEMBACA ───────────────────────────────

// Daftar pinjol dengan PENCARIAN, FILTER status, dan PAGINATION di sisi server.
export async function daftarPinjol(p: ParameterDaftar): Promise<HasilDaftar> {
  const dari = (p.halaman - 1) * p.perHalaman;

  let kueri = supabase
    .from("pinjol")
    .select(KOLOM, { count: "exact" })
    .order("status")
    .order("nama")
    .range(dari, dari + p.perHalaman - 1);

  if (p.status) kueri = kueri.eq("status", p.status);
  if (p.q) {
    // Buang karakter yang punya arti khusus di filter PostgREST, lalu cari di nama ATAU nama perusahaan.
    const aman = p.q.replace(/[%,()"\\*]/g, " ").replace(/\s+/g, " ").trim();
    if (aman) kueri = kueri.or(`nama.ilike."%${aman}%",nama_perusahaan.ilike."%${aman}%"`);
  }

  const { data, error, count } = await kueri;
  if (error) throw terjemahkan(error, "daftarPinjol");

  const total = count ?? 0;
  return {
    data: (data as unknown as BarisDb[]).map(rapikan),
    halaman: p.halaman,
    per_halaman: p.perHalaman,
    total,
    total_halaman: Math.max(1, Math.ceil(total / p.perHalaman)),
  };
}

export async function ambilPinjol(id: number): Promise<DataPinjol> {
  const { data, error } = await supabase.from("pinjol").select(KOLOM).eq("id", id).maybeSingle();
  if (error) throw terjemahkan(error, "ambilPinjol");
  if (!data) throw new GalatPinjol("TIDAK_DITEMUKAN", "Pinjol tidak ditemukan.");
  return rapikan(data as unknown as BarisDb);
}

// ── Cek legalitas di server ──
// Aturan pencocokan (features/cek-legalitas/rules.ts) butuh seluruh daftar, jadi daftar disimpan
// sementara di memori server selama 10 menit supaya tidak membaca 500+ baris di setiap ketikan.
// Kalau database tidak bisa dihubungi, dipakai DATA CADANGAN (data/dataPinjol.ts) — hanya di server,
// sehingga daftar 500+ pinjol tidak pernah dikirim ke browser.
const SIMPAN_MS = 10 * 60 * 1000; //       data dari database disimpan 10 menit
const SIMPAN_CADANGAN_MS = 60 * 1000; //    data cadangan hanya 1 menit, lalu database dicoba lagi
let simpanan: { daftar: Pinjol[]; waktu: number; dariDatabase: boolean } | null = null;

const CADANGAN: Pinjol[] = [
  ...LEGAL_PINJOL.map((p) => ({ nama: p.nama, nama_perusahaan: p.pt, status: "legal" as const, alamat: p.alamat, sumber: SUMBER_LEGAL })),
  ...ILEGAL_PINJOL.map((p) => ({ nama: p.nama, nama_perusahaan: null, status: "ilegal" as const, alamat: p.alamat, sumber: SUMBER_ILEGAL })),
];

async function semuaPinjol(): Promise<{ daftar: Pinjol[]; dariDatabase: boolean }> {
  if (simpanan && Date.now() - simpanan.waktu < (simpanan.dariDatabase ? SIMPAN_MS : SIMPAN_CADANGAN_MS)) {
    return { daftar: simpanan.daftar, dariDatabase: simpanan.dariDatabase };
  }

  try {
    const { data, error } = await supabase
      .from("pinjol")
      .select("nama, nama_perusahaan, status, alamat, sumber_data(nama)")
      .order("status")
      .order("nama")
      .limit(5000);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Tabel pinjol kosong");

    const daftar = (data as unknown as (Omit<Pinjol, "sumber"> & { sumber_data: { nama: string } | null })[]).map(
      ({ sumber_data, ...p }) => ({ ...p, sumber: sumber_data?.nama ?? "" }),
    );
    simpanan = { daftar, waktu: Date.now(), dariDatabase: true };
    return { daftar, dariDatabase: true };
  } catch (e) {
    console.error("Daftar pinjol dari database gagal dibaca, memakai data cadangan:", e);
    simpanan = { daftar: CADANGAN, waktu: Date.now(), dariDatabase: false };
    return { daftar: CADANGAN, dariDatabase: false };
  }
}

export function lupakanSimpanan() {
  simpanan = null;
}

export type HasilCekLegalitas = { hasil: HasilCek; saran: Pinjol[]; dariDatabase: boolean };

export async function cekLegalitas(nama: string): Promise<HasilCekLegalitas> {
  const { daftar, dariDatabase } = await semuaPinjol();
  return { hasil: cekNama(nama, daftar), saran: saranNama(nama, daftar), dariDatabase };
}

// Nama sumber resmi yang dipakai (untuk ditampilkan di halaman Cek Legalitas).
export async function namaSumberResmi(): Promise<{ sumber: string[]; dariDatabase: boolean }> {
  try {
    const { data, error } = await supabase.from("sumber_data").select("nama").order("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Tabel sumber_data kosong");
    return { sumber: data.map((s) => s.nama), dariDatabase: true };
  } catch (e) {
    console.error("Sumber data gagal dibaca, memakai data cadangan:", e);
    return { sumber: [SUMBER_LEGAL, SUMBER_ILEGAL], dariDatabase: false };
  }
}

// ─────────────────────────────── MENULIS ───────────────────────────────

function klienTulis() {
  const k = supabaseServer();
  if (!k) throw new GalatPinjol("LAYANAN_BELUM_SIAP", "Pengaturan database server belum lengkap.");
  return k;
}

// Kolom lama "pinjol.sumber" (teks) masih NOT NULL sampai website production berhenti membacanya.
// Jadi saat menulis sumber_id, teks sumbernya ikut diisi dari tabel sumber_data.
async function namaSumber(id: number): Promise<string> {
  const { data, error } = await klienTulis().from("sumber_data").select("nama").eq("id", id).maybeSingle();
  if (error) throw terjemahkan(error, "namaSumber");
  if (!data) throw new GalatPinjol("DATA_TIDAK_VALID", "Sumber data yang dipilih tidak ada.");
  return data.nama;
}

export async function tambahPinjol(d: DataTulis): Promise<DataPinjol> {
  const sumber = await namaSumber(d.sumber_id!);
  const { data, error } = await klienTulis()
    .from("pinjol")
    .insert({ ...d, sumber })
    .select(KOLOM)
    .single();
  if (error) throw terjemahkan(error, "tambahPinjol");
  lupakanSimpanan();
  return rapikan(data as unknown as BarisDb);
}

export async function ubahPinjol(id: number, d: DataTulis): Promise<DataPinjol> {
  const isi: Record<string, unknown> = { ...d };
  if (d.sumber_id !== undefined) isi.sumber = await namaSumber(d.sumber_id);

  const { data, error } = await klienTulis()
    .from("pinjol")
    .update(isi)
    .eq("id", id)
    .select(KOLOM)
    .maybeSingle();
  if (error) throw terjemahkan(error, "ubahPinjol");
  if (!data) throw new GalatPinjol("TIDAK_DITEMUKAN", "Pinjol tidak ditemukan.");
  lupakanSimpanan();
  return rapikan(data as unknown as BarisDb);
}

export async function hapusPinjol(id: number): Promise<void> {
  const { data, error } = await klienTulis().from("pinjol").delete().eq("id", id).select("id");
  if (error) throw terjemahkan(error, "hapusPinjol");
  if (!data || data.length === 0) throw new GalatPinjol("TIDAK_DITEMUKAN", "Pinjol tidak ditemukan.");
  lupakanSimpanan();
}