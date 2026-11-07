// Logika pencocokan nama pinjol untuk fitur Cek Legalitas.
// Daftar pinjol TIDAK diambil di file ini, melainkan diterima sebagai parameter,
// sehingga bisa berasal dari database (Supabase) maupun dari data cadangan.

export type Pinjol = {
  nama: string;
  nama_perusahaan: string | null;
  status: "legal" | "ilegal";
  alamat: string | null;
  sumber: string;
};

export type HasilCek =
  | { status: "legal"; data: Pinjol; tiruan: Pinjol | null }
  | { status: "mirip"; data: Pinjol }
  | { status: "ilegal"; data: Pinjol }
  | { status: "tidak-ditemukan" };

// "PT. Kredit Pintar " → "kreditpintar" (huruf kecil, tanpa PT, spasi, dan tanda baca)
export const normal = (s: string) =>
  s.toLowerCase().replace(/^pt\.?\s+/, "").replace(/[^a-z0-9]/g, "");

// Nama ilegal sering panjang: "Uang Cepat - Pinjaman Duit Cair". Nama utamanya: "Uang Cepat".
const namaUtama = (nama: string) => nama.split(" - ")[0];

const samaDengan = (p: Pinjol, q: string) =>
  normal(p.nama) === q || normal(namaUtama(p.nama)) === q;

export function cekNama(input: string, daftar: Pinjol[]): HasilCek {
  const q = normal(input);
  if (q.length < 2) return { status: "tidak-ditemukan" };

  const legal = daftar.filter((p) => p.status === "legal");
  const ilegal = daftar.filter((p) => p.status === "ilegal");

  // 1. Cocok persis dengan pinjol berizin → legal (sekalian cek ada tiruannya atau tidak)
  const l = legal.find((p) => normal(p.nama) === q || (p.nama_perusahaan && normal(p.nama_perusahaan) === q));
  if (l) {
    const tiruan = ilegal.find((p) => samaDengan(p, normal(l.nama))) ?? null;
    return { status: "legal", data: l, tiruan };
  }

  // 2. Cocok persis dengan daftar ilegal (nama lengkap atau nama utamanya) → ilegal
  const i = ilegal.find((p) => samaDengan(p, q));
  if (i) return { status: "ilegal", data: i };

  // 3. Yang diketik memuat nama utama aplikasi ilegal (minimal 6 huruf) → ilegal
  const iDalam = ilegal.find((p) => {
    const u = normal(namaUtama(p.nama));
    return u.length >= 6 && q.includes(u);
  });
  if (iDalam) return { status: "ilegal", data: iDalam };

  // 4. Hanya mirip nama berizin → JANGAN langsung dianggap legal
  const m = legal.find((p) => normal(p.nama).includes(q) || q.includes(normal(p.nama)));
  if (m) return { status: "mirip", data: m };

  return { status: "tidak-ditemukan" };
}

export function saranNama(input: string, daftar: Pinjol[]) {
  const q = normal(input);
  if (q.length < 2) return [];
  const legal = daftar.filter((p) => p.status === "legal" && normal(p.nama).includes(q)).slice(0, 5);
  const ilegal = daftar
    .filter((p) => p.status === "ilegal" && normal(namaUtama(p.nama)).includes(q))
    .slice(0, 3);
  return [...legal, ...ilegal];
}

/** "https://www.indodana.asia/#/start" → "indodana.asia" (untuk ditampilkan, BUKAN untuk ditautkan) */
export function namaSitus(alamat: string | null): string {
  if (!alamat) return "";
  try {
    const u = new URL(alamat.startsWith("http") ? alamat : "https://" + alamat);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return alamat;
  }
}