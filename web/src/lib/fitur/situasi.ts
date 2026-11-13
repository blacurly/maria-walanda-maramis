// Layanan API "Ceritakan Situasimu": validasi cerita + memanggil aturan di features/bingung-mulai/rules.ts.
// PRIVASI: cerita hanya dibaca untuk menyusun arahan. Tidak disimpan dan tidak ditulis ke log.
import { analisisCerita, FEATURES, PIHAK } from "@/features/bingung-mulai/rules";

export const CERITA_MIN = 15; //   sama dengan batas di halaman (CeritakanSituasimu.tsx)
export const CERITA_MAKS = 2000;

export function periksaCerita(isi: Record<string, unknown>): string | { cerita: string } {
  const cerita = typeof isi.cerita === "string" ? isi.cerita.trim() : "";
  if (!cerita) return "Cerita tidak boleh kosong.";
  if (cerita.length < CERITA_MIN) return `Ceritakan sedikit lagi (minimal ${CERITA_MIN} karakter) supaya arahannya tepat.`;
  if (cerita.length > CERITA_MAKS) return `Ceritamu terlalu panjang. Ringkas jadi maksimal ${CERITA_MAKS} karakter ya.`;
  return { cerita };
}

/** Menyusun arahan, dilengkapi nama dan tautan fitur serta kontak pihak berwenang. */
export function arahkanSituasi(cerita: string) {
  const r = analisisCerita(cerita);
  return {
    darurat: r.darurat,
    jenis_darurat: r.jenis_darurat,
    tanggapan: r.tanggapan,
    langkah: r.langkah,
    fitur: r.fitur.map((f) => ({ ...f, nama: FEATURES[f.id].name, tautan: FEATURES[f.id].href })),
    pihak: r.pihak.map((p) => ({ ...p, nama: PIHAK[p.id].name, kontak: PIHAK[p.id].kontak })),
    perlu_tanya: r.perlu_tanya,
    metode: r.mode, // "aturan" = berbasis kata kunci, BUKAN AI
  };
}
