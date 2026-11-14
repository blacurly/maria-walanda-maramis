// Logika bisnis & akses data LEMBAGA BANTUAN dan SITUASI DARURAT.
// - MEMBACA : klien publik (RLS: publik hanya melihat lembaga & situasi yang AKTIF)
// - MENULIS : klien server (kunci secret), dipanggil SETELAH izin admin dicek di route
// - CADANGAN: kalau database tidak bisa dihubungi, halaman Darurat tetap tampil dari data/kontakDarurat.ts
import { supabase } from "@/lib/supabase/publik";
import { supabaseServer } from "@/lib/supabase/server";
import { GalatLayanan, kataAman, teks, terjemahkanDb } from "@/lib/api/layanan";
import { SITUASI as CADANGAN, type IdSituasi, type Kontak } from "@/data/kontakDarurat";

export type Kanal = "telepon" | "whatsapp" | "situs";

export type DataLembaga = {
  id: number;
  nama: string;
  penyelenggara: string | null;
  jenis: { kode: string; label: string };
  kanal: Kanal;
  nomor: string;
  tautan: string;
  aktif: boolean;
  situasi: { kode: string; urutan: number; label_khusus: string | null }[];
};

export type SituasiDarurat = {
  id: IdSituasi;
  ikon: string;
  pilihan: string;
  judul: string;
  info: string;
  kontak: Kontak[];
};

// Warna tombol adalah urusan TAMPILAN, jadi tidak disimpan di database.
// Ditentukan dari jenis lembaga + kanal (sama dengan warna di desain lama).
function warna(jenis: string, kanal: Kanal): string {
  if (kanal === "whatsapp") return "bg-green-600";
  if (jenis === "kepolisian") return "bg-red-600";
  if (jenis === "darurat") return "bg-orange-600";
  if (jenis === "layanan-perempuan") return "bg-purple-600";
  if (jenis === "kesehatan-jiwa") return kanal === "situs" ? "bg-sky-600" : "bg-blue-600";
  return "bg-gray-700";
}

// ─────────────────────────── MEMBACA (halaman Darurat) ───────────────────────────

type BarisSituasi = {
  kode: string;
  ikon: string | null;
  pilihan: string;
  judul: string;
  info: string;
  lembaga_situasi: {
    urutan: number;
    label_khusus: string | null;
    lembaga: { nama: string; kanal: Kanal; nomor: string; tautan: string; jenis_lembaga: { kode: string } | null } | null;
  }[];
};

// Situasi darurat beserta kontaknya, sudah urut. Lembaga nonaktif tidak ikut (disaring RLS).
export async function daftarSituasiDarurat(): Promise<{ situasi: SituasiDarurat[]; dariDatabase: boolean }> {
  try {
    const { data, error } = await supabase
      .from("situasi_darurat")
      .select("kode, ikon, pilihan, judul, info, urutan, lembaga_situasi(urutan, label_khusus, lembaga(nama, kanal, nomor, tautan, jenis_lembaga(kode)))")
      .order("urutan");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Tabel situasi_darurat kosong");

    const situasi = (data as unknown as BarisSituasi[]).map((s) => ({
      id: s.kode as IdSituasi,
      ikon: s.ikon ?? "",
      pilihan: s.pilihan,
      judul: s.judul,
      info: s.info,
      kontak: [...s.lembaga_situasi]
        .filter((h) => h.lembaga)
        .sort((a, b) => a.urutan - b.urutan)
        .map((h) => ({
          label: h.label_khusus ?? h.lembaga!.nama,
          nomor: h.lembaga!.nomor,
          href: h.lembaga!.tautan,
          warna: warna(h.lembaga!.jenis_lembaga?.kode ?? "", h.lembaga!.kanal),
        })),
    }));
    return { situasi, dariDatabase: true };
  } catch (e) {
    console.error("Situasi darurat gagal dibaca dari database, memakai data cadangan:", e);
    return { situasi: CADANGAN, dariDatabase: false };
  }
}

// ─────────────────────────── MEMBACA (API lembaga) ───────────────────────────

const KOLOM =
  "id, nama, penyelenggara, kanal, nomor, tautan, aktif, jenis_lembaga(kode, label), lembaga_situasi(urutan, label_khusus, situasi_darurat(kode))";

type BarisLembaga = Omit<DataLembaga, "jenis" | "situasi"> & {
  jenis_lembaga: { kode: string; label: string } | null;
  lembaga_situasi: { urutan: number; label_khusus: string | null; situasi_darurat: { kode: string } | null }[];
};

function rapikan(b: BarisLembaga): DataLembaga {
  const { jenis_lembaga, lembaga_situasi, ...sisa } = b;
  return {
    ...sisa,
    jenis: jenis_lembaga ?? { kode: "", label: "" },
    situasi: lembaga_situasi
      .filter((h) => h.situasi_darurat)
      .map((h) => ({ kode: h.situasi_darurat!.kode, urutan: h.urutan, label_khusus: h.label_khusus })),
  };
}

export const BATAS = { nama: 100, penyelenggara: 150, nomor: 40, tautan: 300, label: 100, cari: 100 };
const POLA_KODE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type ParameterDaftarLembaga = { jenis: string | null; q: string; halaman: number; perHalaman: number };

export function periksaParameterDaftar(cari: URLSearchParams, halaman: { halaman: number; perHalaman: number }) {
  const jenis = cari.get("jenis");
  if (jenis !== null && !POLA_KODE.test(jenis)) return "Jenis lembaga tidak valid.";
  const q = (cari.get("q") ?? "").trim();
  if (q.length > BATAS.cari) return `Kata pencarian maksimal ${BATAS.cari} huruf.`;
  return { jenis, q, ...halaman };
}

// Daftar lembaga aktif dengan FILTER jenis, PENCARIAN, dan PAGINATION di server.
export async function daftarLembaga(p: ParameterDaftarLembaga) {
  const dari = (p.halaman - 1) * p.perHalaman;
  const kolom = p.jenis ? KOLOM.replace("jenis_lembaga(", "jenis_lembaga!inner(") : KOLOM;

  let kueri = supabase
    .from("lembaga")
    .select(kolom, { count: "exact" })
    .order("id")
    .range(dari, dari + p.perHalaman - 1);
  if (p.jenis) kueri = kueri.eq("jenis_lembaga.kode", p.jenis);
  const aman = kataAman(p.q);
  if (aman) kueri = kueri.or(`nama.ilike."%${aman}%",penyelenggara.ilike."%${aman}%"`);

  const { data, error, count } = await kueri;
  if (error) throw terjemahkanDb(error, "daftarLembaga");
  const total = count ?? 0;
  return {
    data: (data as unknown as BarisLembaga[]).map(rapikan),
    halaman: p.halaman,
    per_halaman: p.perHalaman,
    total,
    total_halaman: Math.max(1, Math.ceil(total / p.perHalaman)),
  };
}

export async function ambilLembaga(id: number): Promise<DataLembaga> {
  const { data, error } = await supabase.from("lembaga").select(KOLOM).eq("id", id).maybeSingle();
  if (error) throw terjemahkanDb(error, "ambilLembaga");
  if (!data) throw new GalatLayanan("TIDAK_DITEMUKAN", "Lembaga tidak ditemukan.");
  return rapikan(data as unknown as BarisLembaga);
}

// ─────────────────────────── VALIDASI ───────────────────────────

export function periksaId(teksId: string): number | null {
  const id = Number(teksId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type DataTulisLembaga = {
  nama?: string;
  penyelenggara?: string | null;
  jenis?: string;
  kanal?: Kanal;
  nomor?: string;
  tautan?: string;
  aktif?: boolean;
  situasi?: { kode: string; urutan: number; label_khusus: string | null }[];
};

export function periksaDataLembaga(isi: Record<string, unknown>, wajib: boolean): DataTulisLembaga | string {
  const izin = ["nama", "penyelenggara", "jenis", "kanal", "nomor", "tautan", "aktif", "situasi"];
  const asing = Object.keys(isi).filter((k) => !izin.includes(k));
  if (asing.length) return `Kolom tidak dikenal: ${asing.join(", ")}.`;

  const d: DataTulisLembaga = {};

  for (const [kolom, batas] of [["nama", BATAS.nama], ["nomor", BATAS.nomor]] as const) {
    if (!(kolom in isi) && !wajib) continue;
    const t = teks(isi[kolom]);
    if (!t) return `${kolom} wajib diisi.`;
    if (t.length > batas) return `${kolom} maksimal ${batas} huruf.`;
    d[kolom] = t;
  }

  if ("penyelenggara" in isi) {
    if (isi.penyelenggara === null || isi.penyelenggara === "") d.penyelenggara = null;
    else {
      const t = teks(isi.penyelenggara);
      if (!t || t.length > BATAS.penyelenggara) return `penyelenggara maksimal ${BATAS.penyelenggara} huruf.`;
      d.penyelenggara = t;
    }
  }

  if ("jenis" in isi || wajib) {
    const j = teks(isi.jenis);
    if (!j || !POLA_KODE.test(j)) return "jenis wajib berupa kode jenis lembaga (mis. layanan-perempuan).";
    d.jenis = j;
  }

  if ("kanal" in isi || wajib) {
    if (isi.kanal !== "telepon" && isi.kanal !== "whatsapp" && isi.kanal !== "situs")
      return 'kanal harus "telepon", "whatsapp", atau "situs".';
    d.kanal = isi.kanal;
  }

  if ("tautan" in isi || wajib) {
    const t = teks(isi.tautan);
    if (!t || !/^(tel:\+?[0-9]+|https:\/\/\S+)$/.test(t) || t.length > BATAS.tautan)
      return 'tautan harus "tel:<angka>" atau "https://...".';
    d.tautan = t;
  }

  // Kanal dan tautan harus cocok: telepon → tel:, whatsapp/situs → https://
  const kanal = d.kanal;
  if (kanal && d.tautan) {
    if (kanal === "telepon" && !d.tautan.startsWith("tel:")) return 'Kanal telepon harus memakai tautan "tel:...".';
    if (kanal !== "telepon" && !d.tautan.startsWith("https://")) return `Kanal ${kanal} harus memakai tautan "https://...".`;
  }

  if ("aktif" in isi) {
    if (typeof isi.aktif !== "boolean") return "aktif harus true atau false.";
    d.aktif = isi.aktif;
  }

  if ("situasi" in isi) {
    if (!Array.isArray(isi.situasi)) return "situasi harus berupa daftar.";
    const daftar: NonNullable<DataTulisLembaga["situasi"]> = [];
    for (const [i, s] of isi.situasi.entries()) {
      const o = (s ?? {}) as Record<string, unknown>;
      const kode = teks(o.kode);
      if (!kode || !POLA_KODE.test(kode)) return `situasi[${i}].kode wajib berupa kode situasi (mis. kbgo).`;
      const urutan = o.urutan ?? i + 1;
      if (typeof urutan !== "number" || !Number.isInteger(urutan) || urutan < 0) return `situasi[${i}].urutan harus bilangan bulat.`;
      const label = o.label_khusus === undefined || o.label_khusus === null ? null : teks(o.label_khusus);
      if (label !== null && (!label || label.length > BATAS.label)) return `situasi[${i}].label_khusus maksimal ${BATAS.label} huruf.`;
      if (daftar.some((x) => x.kode === kode)) return `Situasi "${kode}" ditulis dua kali.`;
      daftar.push({ kode, urutan, label_khusus: label });
    }
    d.situasi = daftar;
  }

  if (!wajib && Object.keys(d).length === 0) return "Tidak ada data yang diubah.";
  return d;
}

// ─────────────────────────── MENULIS ───────────────────────────

function klienTulis() {
  const k = supabaseServer();
  if (!k) throw new GalatLayanan("LAYANAN_BELUM_SIAP", "Pengaturan database server belum lengkap.");
  return k;
}

const DUPLIKAT = "Nama lembaga sudah ada.";

async function idJenis(kode: string): Promise<number> {
  const { data, error } = await klienTulis().from("jenis_lembaga").select("id").eq("kode", kode).maybeSingle();
  if (error) throw terjemahkanDb(error, "idJenis");
  if (!data) throw new GalatLayanan("DATA_TIDAK_VALID", `Jenis lembaga "${kode}" tidak ada.`);
  return data.id;
}

async function simpanSituasi(lembagaId: number, daftar: NonNullable<DataTulisLembaga["situasi"]>) {
  const db = klienTulis();
  let baris: { situasi_id: number; lembaga_id: number; urutan: number; label_khusus: string | null }[] = [];
  if (daftar.length) {
    const { data, error } = await db.from("situasi_darurat").select("id, kode").in("kode", daftar.map((s) => s.kode));
    if (error) throw terjemahkanDb(error, "cariSituasi");
    const peta = new Map((data ?? []).map((s) => [s.kode, s.id]));
    const hilang = daftar.filter((s) => !peta.has(s.kode)).map((s) => s.kode);
    if (hilang.length) throw new GalatLayanan("DATA_TIDAK_VALID", `Situasi tidak ada: ${hilang.join(", ")}.`);
    baris = daftar.map((s) => ({ situasi_id: peta.get(s.kode)!, lembaga_id: lembagaId, urutan: s.urutan, label_khusus: s.label_khusus }));
  }
  const hapus = await db.from("lembaga_situasi").delete().eq("lembaga_id", lembagaId);
  if (hapus.error) throw terjemahkanDb(hapus.error, "hapusPasangan");
  if (baris.length) {
    const tambah = await db.from("lembaga_situasi").insert(baris);
    if (tambah.error) throw terjemahkanDb(tambah.error, "tambahPasangan");
  }
}

async function keKolom(d: DataTulisLembaga): Promise<Record<string, unknown>> {
  const k: Record<string, unknown> = {};
  if (d.nama !== undefined) k.nama = d.nama;
  if (d.penyelenggara !== undefined) k.penyelenggara = d.penyelenggara;
  if (d.jenis !== undefined) k.jenis_lembaga_id = await idJenis(d.jenis);
  if (d.kanal !== undefined) k.kanal = d.kanal;
  if (d.nomor !== undefined) k.nomor = d.nomor;
  if (d.tautan !== undefined) k.tautan = d.tautan;
  if (d.aktif !== undefined) k.aktif = d.aktif;
  return k;
}

// Dibaca ulang dengan kunci server, supaya lembaga NONAKTIF pun bisa dikembalikan ke admin.
async function bacaUlang(id: number): Promise<DataLembaga> {
  const { data, error } = await klienTulis().from("lembaga").select(KOLOM).eq("id", id).single();
  if (error) throw terjemahkanDb(error, "bacaUlang");
  return rapikan(data as unknown as BarisLembaga);
}

export async function tambahLembaga(d: DataTulisLembaga): Promise<DataLembaga> {
  const { data, error } = await klienTulis().from("lembaga").insert(await keKolom(d)).select("id").single();
  if (error) throw terjemahkanDb(error, "tambahLembaga", DUPLIKAT);
  if (d.situasi) {
    try {
      await simpanSituasi(data.id, d.situasi);
    } catch (e) {
      await klienTulis().from("lembaga").delete().eq("id", data.id); // batalkan supaya tidak tersimpan setengah
      throw e;
    }
  }
  return bacaUlang(data.id);
}

export async function ubahLembaga(id: number, d: DataTulisLembaga): Promise<DataLembaga> {
  const db = klienTulis();
  const sekarang = await db.from("lembaga").select("kanal, tautan").eq("id", id).maybeSingle();
  if (sekarang.error) throw terjemahkanDb(sekarang.error, "ubahLembaga");
  if (!sekarang.data) throw new GalatLayanan("TIDAK_DITEMUKAN", "Lembaga tidak ditemukan.");

  // Kalau hanya kanal ATAU tautan yang diubah, tetap cek kecocokannya dengan nilai yang sudah ada.
  const kanal = d.kanal ?? sekarang.data.kanal;
  const tautan = d.tautan ?? sekarang.data.tautan;
  if ((kanal === "telepon") !== tautan.startsWith("tel:"))
    throw new GalatLayanan("DATA_TIDAK_VALID", "Kanal dan tautan tidak cocok (telepon → tel:, lainnya → https://).");

  const kolom = await keKolom(d);
  if (Object.keys(kolom).length) {
    const { error } = await db.from("lembaga").update(kolom).eq("id", id);
    if (error) throw terjemahkanDb(error, "ubahLembaga", DUPLIKAT);
  }
  if (d.situasi) await simpanSituasi(id, d.situasi);
  return bacaUlang(id);
}

// Pasangan situasi ikut terhapus otomatis (ON DELETE CASCADE).
export async function hapusLembaga(id: number): Promise<void> {
  const { data, error } = await klienTulis().from("lembaga").delete().eq("id", id).select("id");
  if (error) throw terjemahkanDb(error, "hapusLembaga");
  if (!data || data.length === 0) throw new GalatLayanan("TIDAK_DITEMUKAN", "Lembaga tidak ditemukan.");
}
