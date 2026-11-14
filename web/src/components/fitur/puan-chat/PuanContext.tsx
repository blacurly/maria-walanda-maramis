"use client";

// REACT CONTEXT Puan AI: "papan pengumuman" bersama untuk jendela chat Puan.
// Isinya: apakah jendela chat sedang terbuka, dan teks di kolom ketik.
//
// Kenapa Context? Jendela chat (PuanFab) dipasang sekali di layout.tsx, sedangkan tombol "Tanya Puan AI"
// ada di banyak halaman (Tentang, Cek Penawaran, dan halaman lain nanti). Tanpa Context, perintah "buka chat"
// harus dioper lewat props dari layout ke setiap halaman dan komponen di bawahnya (prop drilling).
// Dengan Context, komponen mana pun cukup memanggil usePuan().bukaPuan("pertanyaan awal").
//
// Dipakai oleh: PuanFab.tsx (jendela chat) dan TombolTanyaPuan.tsx (tombol pembuka di halaman mana pun).
// Provider dipasang di app/layout.tsx.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type NilaiPuan = {
  /** true = jendela chat sedang terbuka */
  buka: boolean;
  /** Buka jendela chat. Kalau ada pertanyaan, kolom ketik diisi dulu (pengguna tetap yang menekan kirim). */
  bukaPuan: (pertanyaan?: string) => void;
  tutupPuan: () => void;
  /** Buka kalau tertutup, tutup kalau terbuka (tombol melayang di pojok kanan bawah) */
  alihkanPuan: () => void;
  /** Teks di kolom ketik chat */
  ketikan: string;
  setKetikan: (teks: string) => void;
};

const PuanContext = createContext<NilaiPuan | null>(null);

export function PuanProvider({ children }: { children: ReactNode }) {
  const [buka, setBuka] = useState(false);
  const [ketikan, setKetikan] = useState("");

  const bukaPuan = useCallback((pertanyaan?: string) => {
    if (pertanyaan) setKetikan(pertanyaan);
    setBuka(true);
  }, []);
  const tutupPuan = useCallback(() => setBuka(false), []);
  const alihkanPuan = useCallback(() => setBuka((b) => !b), []);

  // useMemo: nilai baru hanya dibuat saat isinya berubah, supaya komponen pemakai tidak ikut menggambar ulang tanpa perlu
  const nilai = useMemo(
    () => ({ buka, bukaPuan, tutupPuan, alihkanPuan, ketikan, setKetikan }),
    [buka, bukaPuan, tutupPuan, alihkanPuan, ketikan],
  );

  return <PuanContext.Provider value={nilai}>{children}</PuanContext.Provider>;
}

/** Custom hook untuk membaca dan mengendalikan jendela chat Puan dari komponen mana pun. */
export function usePuan(): NilaiPuan {
  const nilai = useContext(PuanContext);
  if (!nilai) throw new Error("usePuan() harus dipakai di dalam <PuanProvider> (lihat app/layout.tsx).");
  return nilai;
}
