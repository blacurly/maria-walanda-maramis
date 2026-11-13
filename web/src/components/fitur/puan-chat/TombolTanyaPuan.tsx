"use client";

// Tombol "Tanya Puan AI" yang bisa dipasang di halaman mana pun.
// Saat diklik, jendela chat Puan terbuka (lewat PuanContext) dan, kalau diberi `pertanyaan`,
// kolom ketik langsung terisi pertanyaan itu. Pengguna tetap yang menekan kirim.
//
// Contoh:
//   <TombolTanyaPuan pertanyaan="Apa hakku saat ditagih?" className="btn b3">Tanya Puan AI</TombolTanyaPuan>
import type { CSSProperties, ReactNode } from "react";
import { usePuan } from "./PuanContext";

type Props = {
  children: ReactNode;
  /** Pertanyaan awal yang diisikan ke kolom ketik (opsional) */
  pertanyaan?: string;
  className?: string;
  style?: CSSProperties;
};

export default function TombolTanyaPuan({ children, pertanyaan, className, style }: Props) {
  const { bukaPuan } = usePuan();
  return (
    <button type="button" onClick={() => bukaPuan(pertanyaan)} className={className} style={style}>
      {children}
    </button>
  );
}
