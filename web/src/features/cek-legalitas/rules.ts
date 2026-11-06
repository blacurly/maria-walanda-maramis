// Logika pencocokan nama pinjol dan penilaian kuis 6 tanda ilegal
import { LEGAL_PINJOL, ILEGAL_NAMES } from "@/data/dataPinjol";

export type HasilCek =
  | { status: "legal"; nama: string; pt: string }
  | { status: "mirip"; nama: string; pt: string }
  | { status: "ilegal"; nama: string }
  | { status: "tidak-ditemukan" };

// "PT. Kredit Pintar " → "kreditpintar" (huruf kecil, tanpa PT, spasi, dan tanda baca)
export const normal = (s: string) =>
  s.toLowerCase().replace(/^pt\.?\s+/, "").replace(/[^a-z0-9]/g, "");

export function cekNama(input: string): HasilCek {
  const q = normal(input);
  if (q.length < 2) return { status: "tidak-ditemukan" };

  // 1. Cocok persis dengan pinjol berizin → legal
  const legal = LEGAL_PINJOL.find((x) => normal(x.nama) === q || (x.pt && normal(x.pt) === q));
  if (legal) return { status: "legal", nama: legal.nama, pt: legal.pt };

  // 2. Cocok persis dengan daftar ilegal → ilegal
  const ilegal = ILEGAL_NAMES.find((x) => normal(x) === q);
  if (ilegal) return { status: "ilegal", nama: ilegal };

  // 3. Yang diketik memuat nama ilegal (misalnya "KreditKilat APK") → ilegal
  const ilegalDidalam = ILEGAL_NAMES.find((x) => normal(x).length >= 4 && q.includes(normal(x)));
  if (ilegalDidalam) return { status: "ilegal", nama: ilegalDidalam };

  // 4. Hanya mirip nama berizin → JANGAN langsung dianggap legal
  const mirip = LEGAL_PINJOL.find((x) => normal(x.nama).includes(q) || q.includes(normal(x.nama)));
  if (mirip) return { status: "mirip", nama: mirip.nama, pt: mirip.pt };

  return { status: "tidak-ditemukan" };
}

export function saranNama(input: string) {
  const q = normal(input);
  if (q.length < 2) return [];
  const legal = LEGAL_PINJOL.filter((x) => normal(x.nama).includes(q))
    .slice(0, 5)
    .map((x) => ({ nama: x.nama, pt: x.pt, status: "legal" as const }));
  const ilegal = ILEGAL_NAMES.filter((x) => normal(x).includes(q))
    .slice(0, 3)
    .map((x) => ({ nama: x, pt: "", status: "ilegal" as const }));
  return [...legal, ...ilegal];
}