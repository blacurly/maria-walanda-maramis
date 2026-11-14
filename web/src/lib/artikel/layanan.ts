// Logika bisnis & akses data ARTIKEL EDUKASI.
// - MEMBACA : klien publik (RLS: publik hanya melihat artikel yang SUDAH TERBIT)
// - MENULIS : klien server (kunci secret), dipanggil SETELAH izin admin dicek di route
// - CADANGAN: kalau database tidak bisa dihubungi, halaman tetap tampil dari data/artikel.ts
import { supabase } from "@/lib/supabase/publik";
import { supabaseServer } from "@/lib/supabase/server";
import { GalatLayanan, kataAman, teks, terjemahkanDb } from "@/lib/api/layanan";
import { ARTIKEL as CADANGAN, TOPIK, type Artikel, type Bagian, type Topik } from "@/data/artikel";

export type Kategori = { id: Topik; label: string };

export type HasilDaftarArtikel = {
  data: ArtikelRingkas[];
  halaman: number;
  per_halaman: number;
  total: number;
  total_halaman: number;
};

// ─────────────────────────── Mengubah baris database → bentuk Artikel ───────────────────────────

const KOLOM_RINGKAS =
  "slug, judul, ringkasan, bentuk, menit_baca, gambar_url, diubah_pada, kategori_artikel(kode, label)";
const KOLOM_LENGKAP = `${KOLOM_RINGKAS}, isi, catatan, fitur_label, fitur_tautan, rujukan_artikel(jenis, teks, tautan, urutan)`;

type BarisDb = {
  slug: string;
  judul: string;
  ringkasan: string;
  bentuk: "artikel" | "panduan";
  menit_baca: number;
  gambar_url: string | null;
  diubah_pada: string;
  kategori_artikel: { kode: string; label: string } | null;
  isi?: Bagian[];
  catatan?: string | null;
  fitur_label?: string | null;
  fitur_tautan?: string | null;
  rujukan_artikel?: { jenis: "dasar_hukum" | "sumber"; teks: string; tautan: string | null; urutan: number }[];
};

const BULAN = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

function keArtikel(b: BarisDb): Artikel {
  const rujukan = [...(b.rujukan_artikel ?? [])].sort((x, y) => x.urutan - y.urutan);
  return {
    slug: b.slug,
    judul: b.judul,
    ringkasan: b.ringkasan,
    topik: (b.kategori_artikel?.kode ?? "pinjaman") as Topik,
    topikLabel: b.kategori_artikel?.label,
    kategori: b.bentuk === "panduan" ? "Panduan" : "Artikel",
    menit: b.menit_baca,
    gambar: b.gambar_url ?? "",
    diperbarui: BULAN.format(new Date(b.diubah_pada)),
    bagian: b.isi ?? [],
    catatan: b.catatan ?? undefined,
    fitur: b.fitur_label && b.fitur_tautan ? { label: b.fitur_label, href: b.fitur_tautan } : undefined,
    dasarHukum: rujukan.filter((r) => r.jenis === "dasar_hukum").map((r) => r.teks),
    sumber: rujukan.filter((r) => r.jenis === "sumber" && r.tautan).map((r) => ({ label: r.teks, url: r.tautan! })),
  };
}

// Bentuk RINGKAS untuk endpoint daftar: hanya kolom yang memang diambil (KOLOM_RINGKAS).
// Isi lengkap (bagian, catatan, fitur, dasarHukum, sumber) hanya ada di GET /api/artikel/:slug,
// supaya daftar tidak menampilkan kolom kosong yang membingungkan.
export type ArtikelRingkas = Pick<Artikel, "slug" | "judul" | "ringkasan" | "topik" | "topikLabel" | "kategori" | "menit" | "gambar" | "diperbarui">;

function keRingkas(b: BarisDb): ArtikelRingkas {
  const a = keArtikel(b);
  return {
    slug: a.slug,
    judul: a.judul,
    ringkasan: a.ringkasan,
    topik: a.topik,
    topikLabel: a.topikLabel,
    kategori: a.kategori,
    menit: a.menit,
    gambar: a.gambar,
    diperbarui: a.diperbarui,
  };
}

// ─────────────────────────── MEMBACA (untuk halaman website) ───────────────────────────

// Semua artikel terbit, terbaru dulu. Dipakai halaman Edukasi & Beranda.
export async function semuaArtikel(): Promise<{ artikel: Artikel[]; dariDatabase: boolean }> {
  try {
    const { data, error } = await supabase
      .from("artikel")
      .select(KOLOM_RINGKAS)
      .order("diterbitkan_pada", { ascending: false })
      .order("id")
      .limit(100);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Tabel artikel kosong");
    return { artikel: (data as unknown as BarisDb[]).map(keArtikel), dariDatabase: true };
  } catch (e) {
    console.error("Artikel gagal dibaca dari database, memakai data cadangan:", e);
    return { artikel: CADANGAN, dariDatabase: false };
  }
}

export async function daftarKategori(): Promise<Kategori[]> {
  try {
    const { data, error } = await supabase.from("kategori_artikel").select("kode, label").order("urutan");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Tabel kategori_artikel kosong");
    return data.map((k) => ({ id: k.kode as Topik, label: k.label }));
  } catch (e) {
    console.error("Kategori artikel gagal dibaca, memakai data cadangan:", e);
    return TOPIK;
  }
}

// Satu artikel lengkap. null = memang tidak ada / belum terbit.
export async function ambilArtikel(slug: string): Promise<Artikel | null> {
  try {
    const { data, error } = await supabase.from("artikel").select(KOLOM_LENGKAP).eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? keArtikel(data as unknown as BarisDb) : null;
  } catch (e) {
    console.error(`Artikel "${slug}" gagal dibaca dari database, memakai data cadangan:`, e);
    return CADANGAN.find((a) => a.slug === slug) ?? null;
  }
}

// ─────────────────────────── MEMBACA (untuk API) ───────────────────────────

export type ParameterDaftarArtikel = { kategori: string | null; q: string; halaman: number; perHalaman: number };

// Daftar artikel terbit dengan FILTER kategori, PENCARIAN judul/ringkasan, dan PAGINATION di server.
export async function daftarArtikel(p: ParameterDaftarArtikel): Promise<HasilDaftarArtikel> {
  const dari = (p.halaman - 1) * p.perHalaman;
  // "!inner" = hanya artikel yang kategorinya cocok dengan filter
  const kolom = p.kategori ? KOLOM_RINGKAS.replace("kategori_artikel(", "kategori_artikel!inner(") : KOLOM_RINGKAS;

  let kueri = supabase
    .from("artikel")
    .select(kolom, { count: "exact" })
    .order("diterbitkan_pada", { ascending: false })
    .order("id")
    .range(dari, dari + p.perHalaman - 1);

  if (p.kategori) kueri = kueri.eq("kategori_artikel.kode", p.kategori);
  const aman = kataAman(p.q);
  if (aman) kueri = kueri.or(`judul.ilike."%${aman}%",ringkasan.ilike."%${aman}%"`);

  const { data, error, count } = await kueri;
  if (error) throw terjemahkanDb(error, "daftarArtikel");

  const total = count ?? 0;
  return {
    data: (data as unknown as BarisDb[]).map(keRingkas),
    halaman: p.halaman,
    per_halaman: p.perHalaman,
    total,
    total_halaman: Math.max(1, Math.ceil(total / p.perHalaman)),
  };
}

// Versi API: kalau tidak ada → 404 (bukan memakai cadangan).
export async function ambilArtikelApi(slug: string): Promise<Artikel> {
  const { data, error } = await supabase.from("artikel").select(KOLOM_LENGKAP).eq("slug", slug).maybeSingle();
  if (error) throw terjemahkanDb(error, "ambilArtikelApi");
  if (!data) throw new GalatLayanan("TIDAK_DITEMUKAN", "Artikel tidak ditemukan.");
  return keArtikel(data as unknown as BarisDb);
}

// ─────────────────────────── VALIDASI ───────────────────────────

export const BATAS = { slug: 80, judul: 150, ringkasan: 300, catatan: 500, bagian: 20, baris: 1000, rujukan: 20, cari: 100 };
const POLA_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Hanya gambar dari host yang diizinkan next.config.ts (next/image menolak host lain).
const HOST_GAMBAR = ["images.unsplash.com"];

export function periksaParameterDaftar(cari: URLSearchParams, halaman: { halaman: number; perHalaman: number }) {
  const kategori = cari.get("kategori");
  if (kategori !== null && !POLA_SLUG.test(kategori)) return "Kategori tidak valid.";
  const q = (cari.get("q") ?? "").trim();
  if (q.length > BATAS.cari) return `Kata pencarian maksimal ${BATAS.cari} huruf.`;
  return { kategori, q, ...halaman };
}

export function periksaSlug(slug: string) {
  return POLA_SLUG.test(slug) && slug.length <= BATAS.slug;
}

export type DataTulisArtikel = {
  slug?: string;
  judul?: string;
  ringkasan?: string;
  kategori?: string;
  bentuk?: "artikel" | "panduan";
  menit_baca?: number;
  gambar_url?: string;
  isi?: Bagian[];
  catatan?: string | null;
  fitur?: { label: string; tautan: string } | null;
  terbit?: boolean;
  rujukan?: { dasar_hukum: string[]; sumber: { teks: string; tautan: string }[] };
};

function daftarTeks(v: unknown, nama: string): string[] | string | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !x.trim() || x.length > BATAS.baris))
    return `${nama} harus berupa daftar teks (masing-masing maksimal ${BATAS.baris} huruf).`;
  return v.map((x: string) => x.trim());
}

function periksaIsi(v: unknown): Bagian[] | string {
  if (!Array.isArray(v) || v.length === 0 || v.length > BATAS.bagian)
    return `isi harus berupa daftar bagian (1–${BATAS.bagian} bagian).`;
  const hasil: Bagian[] = [];
  for (const [i, b] of v.entries()) {
    if (typeof b !== "object" || b === null) return `isi[${i}] harus berupa objek.`;
    const judul = teks((b as Record<string, unknown>).judul);
    if (!judul) return `isi[${i}].judul wajib diisi.`;
    const paragraf = daftarTeks((b as Record<string, unknown>).paragraf, `isi[${i}].paragraf`);
    const daftar = daftarTeks((b as Record<string, unknown>).daftar, `isi[${i}].daftar`);
    if (typeof paragraf === "string") return paragraf;
    if (typeof daftar === "string") return daftar;
    if (!paragraf?.length && !daftar?.length) return `isi[${i}] harus punya paragraf atau daftar.`;
    hasil.push({ judul, ...(paragraf?.length ? { paragraf } : {}), ...(daftar?.length ? { daftar } : {}) });
  }
  return hasil;
}

// Memeriksa kiriman TAMBAH (wajib = true) atau UBAH (wajib = false, boleh sebagian; slug tidak boleh diubah).
export function periksaDataArtikel(isi: Record<string, unknown>, wajib: boolean): DataTulisArtikel | string {
  const izin = ["judul", "ringkasan", "kategori", "bentuk", "menit_baca", "gambar_url", "isi", "catatan", "fitur", "terbit", "rujukan"];
  if (wajib) izin.push("slug");
  const asing = Object.keys(isi).filter((k) => !izin.includes(k));
  if (asing.length) return `Kolom tidak dikenal: ${asing.join(", ")}.`;

  const d: DataTulisArtikel = {};

  if (wajib) {
    const slug = teks(isi.slug);
    if (!slug || !periksaSlug(slug)) return "slug wajib diisi: huruf kecil, angka, dan tanda hubung (mis. cara-lapor-pinjol).";
    d.slug = slug;
  }

  for (const [kolom, batas] of [["judul", BATAS.judul], ["ringkasan", BATAS.ringkasan]] as const) {
    if (!(kolom in isi) && !wajib) continue;
    const t = teks(isi[kolom]);
    if (!t) return `${kolom} wajib diisi.`;
    if (t.length > batas) return `${kolom} maksimal ${batas} huruf.`;
    d[kolom] = t;
  }

  if ("kategori" in isi || wajib) {
    const k = teks(isi.kategori);
    if (!k || !POLA_SLUG.test(k)) return "kategori wajib berupa kode kategori (mis. penagihan).";
    d.kategori = k;
  }

  if ("bentuk" in isi) {
    if (isi.bentuk !== "artikel" && isi.bentuk !== "panduan") return 'bentuk harus "artikel" atau "panduan".';
    d.bentuk = isi.bentuk;
  }

  if ("menit_baca" in isi || wajib) {
    const m = isi.menit_baca;
    if (typeof m !== "number" || !Number.isInteger(m) || m < 1 || m > 60) return "menit_baca harus bilangan bulat 1–60.";
    d.menit_baca = m;
  }

  // Gambar wajib: kartu artikel di Beranda & Edukasi selalu menampilkan gambar.
  if ("gambar_url" in isi || wajib) {
    const t = teks(isi.gambar_url);
    let host = "";
    try { host = new URL(t ?? "").host; } catch { /* bukan URL */ }
    if (!t?.startsWith("https://") || !HOST_GAMBAR.includes(host))
      return `gambar_url wajib berupa https:// dari ${HOST_GAMBAR.join(", ")}.`;
    d.gambar_url = t;
  }

  if ("isi" in isi || wajib) {
    const b = periksaIsi(isi.isi);
    if (typeof b === "string") return b;
    d.isi = b;
  }

  if ("catatan" in isi) {
    if (isi.catatan === null || isi.catatan === "") d.catatan = null;
    else {
      const t = teks(isi.catatan);
      if (!t || t.length > BATAS.catatan) return `catatan maksimal ${BATAS.catatan} huruf.`;
      d.catatan = t;
    }
  }

  if ("fitur" in isi) {
    if (isi.fitur === null) d.fitur = null;
    else {
      const f = isi.fitur as Record<string, unknown>;
      const label = teks(f?.label);
      const tautan = teks(f?.tautan);
      if (!label || !tautan || !tautan.startsWith("/"))
        return 'fitur harus { "label": "...", "tautan": "/halaman-edupuan" } atau null.';
      d.fitur = { label, tautan };
    }
  }

  if ("terbit" in isi) {
    if (typeof isi.terbit !== "boolean") return "terbit harus true atau false.";
    d.terbit = isi.terbit;
  }

  if ("rujukan" in isi) {
    const r = isi.rujukan as Record<string, unknown>;
    const dasar = daftarTeks(r?.dasar_hukum ?? [], "rujukan.dasar_hukum");
    if (typeof dasar === "string") return dasar;
    const sumberMentah = r?.sumber ?? [];
    if (!Array.isArray(sumberMentah)) return "rujukan.sumber harus berupa daftar.";
    const sumber: { teks: string; tautan: string }[] = [];
    for (const s of sumberMentah) {
      const t = teks((s as Record<string, unknown>)?.teks);
      const u = teks((s as Record<string, unknown>)?.tautan);
      if (!t || !u?.startsWith("https://")) return 'Setiap rujukan.sumber harus { "teks": "...", "tautan": "https://..." }.';
      sumber.push({ teks: t, tautan: u });
    }
    if ((dasar?.length ?? 0) + sumber.length > BATAS.rujukan) return `Rujukan maksimal ${BATAS.rujukan}.`;
    d.rujukan = { dasar_hukum: dasar ?? [], sumber };
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

const DUPLIKAT = "Slug artikel sudah dipakai. Pilih slug lain.";

async function idKategori(kode: string): Promise<number> {
  const { data, error } = await klienTulis().from("kategori_artikel").select("id").eq("kode", kode).maybeSingle();
  if (error) throw terjemahkanDb(error, "idKategori");
  if (!data) throw new GalatLayanan("DATA_TIDAK_VALID", `Kategori "${kode}" tidak ada.`);
  return data.id;
}

// Mengubah data kiriman menjadi kolom tabel artikel.
async function keKolom(d: DataTulisArtikel): Promise<Record<string, unknown>> {
  const k: Record<string, unknown> = {};
  if (d.slug !== undefined) k.slug = d.slug;
  if (d.judul !== undefined) k.judul = d.judul;
  if (d.ringkasan !== undefined) k.ringkasan = d.ringkasan;
  if (d.kategori !== undefined) k.kategori_id = await idKategori(d.kategori);
  if (d.bentuk !== undefined) k.bentuk = d.bentuk;
  if (d.menit_baca !== undefined) k.menit_baca = d.menit_baca;
  if (d.gambar_url !== undefined) k.gambar_url = d.gambar_url;
  if (d.isi !== undefined) k.isi = d.isi;
  if (d.catatan !== undefined) k.catatan = d.catatan;
  if (d.fitur !== undefined) {
    k.fitur_label = d.fitur?.label ?? null;
    k.fitur_tautan = d.fitur?.tautan ?? null;
  }
    // "now" dihitung oleh DATABASE (jam server Supabase), bukan jam komputer yang menjalankan Next.js,
  // supaya artikel tidak tercatat "terbit di masa depan" kalau jam/zona waktu komputer tidak tepat.
  if (d.terbit !== undefined) k.diterbitkan_pada = d.terbit ? "now" : null;
  return k;
}

async function simpanRujukan(artikelId: number, r: NonNullable<DataTulisArtikel["rujukan"]>) {
  const db = klienTulis();
  const hapus = await db.from("rujukan_artikel").delete().eq("artikel_id", artikelId);
  if (hapus.error) throw terjemahkanDb(hapus.error, "hapusRujukan");
  const baris = [
    ...r.dasar_hukum.map((teks, i) => ({ artikel_id: artikelId, jenis: "dasar_hukum", teks, tautan: null, urutan: i + 1 })),
    ...r.sumber.map((s, i) => ({ artikel_id: artikelId, jenis: "sumber", teks: s.teks, tautan: s.tautan, urutan: i + 1 })),
  ];
  if (baris.length === 0) return;
  const tambah = await db.from("rujukan_artikel").insert(baris);
  if (tambah.error) throw terjemahkanDb(tambah.error, "tambahRujukan");
}

// Hasil tulis: artikel lengkap dibaca ulang dengan kunci server (supaya draf juga bisa dikembalikan).
async function bacaUlang(slug: string): Promise<Artikel> {
  const { data, error } = await klienTulis().from("artikel").select(KOLOM_LENGKAP).eq("slug", slug).single();
  if (error) throw terjemahkanDb(error, "bacaUlang");
  return keArtikel(data as unknown as BarisDb);
}

export async function tambahArtikel(d: DataTulisArtikel): Promise<Artikel> {
  const kolom = await keKolom(d);
  const { data, error } = await klienTulis().from("artikel").insert(kolom).select("id").single();
  if (error) throw terjemahkanDb(error, "tambahArtikel", DUPLIKAT);

  if (d.rujukan) {
    try {
      await simpanRujukan(data.id, d.rujukan);
    } catch (e) {
      // Rujukan gagal: batalkan artikel yang baru dibuat supaya tidak tersimpan setengah.
      await klienTulis().from("artikel").delete().eq("id", data.id);
      throw e;
    }
  }
  return bacaUlang(d.slug!);
}

export async function ubahArtikel(slug: string, d: DataTulisArtikel): Promise<Artikel> {
  const kolom = await keKolom(d);
  const db = klienTulis();

  let id: number;
  if (Object.keys(kolom).length > 0) {
    const { data, error } = await db.from("artikel").update(kolom).eq("slug", slug).select("id").maybeSingle();
    if (error) throw terjemahkanDb(error, "ubahArtikel", DUPLIKAT);
    if (!data) throw new GalatLayanan("TIDAK_DITEMUKAN", "Artikel tidak ditemukan.");
    id = data.id;
  } else {
    const { data, error } = await db.from("artikel").select("id").eq("slug", slug).maybeSingle();
    if (error) throw terjemahkanDb(error, "ubahArtikel");
    if (!data) throw new GalatLayanan("TIDAK_DITEMUKAN", "Artikel tidak ditemukan.");
    id = data.id;
  }

  if (d.rujukan) await simpanRujukan(id, d.rujukan);
  return bacaUlang(slug);
}

// Rujukan ikut terhapus otomatis (ON DELETE CASCADE).
export async function hapusArtikel(slug: string): Promise<void> {
  const { data, error } = await klienTulis().from("artikel").delete().eq("slug", slug).select("id");
  if (error) throw terjemahkanDb(error, "hapusArtikel");
  if (!data || data.length === 0) throw new GalatLayanan("TIDAK_DITEMUKAN", "Artikel tidak ditemukan.");
}
