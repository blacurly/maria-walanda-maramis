"use client";

import { useEffect, useRef, useState } from "react";

const BENTUK_KEKERASAN = [
  {
    no: "01",
    judul: "Kekerasan verbal & intimidasi",
    deskripsi: "Ancaman pembunuhan, cacian, dan teror psikis lewat telepon terus-menerus.",
  },
  {
    no: "02",
    judul: "Penyebaran data pribadi",
    deskripsi: "Kontak darurat dan kerabat diteror dengan pesan yang mempermalukan korban.",
  },
  {
    no: "03",
    judul: "Kekerasan berbasis gender online",
    deskripsi: "Ancaman pelecehan seksual atau kiriman konten tidak senonoh dari penagih.",
  },
];

const KARTU_STYLE = { background: "#ffffff", border: "1px solid rgba(16,55,42,0.10)" };
const ANGKA_STYLE = {
  fontWeight: 800,
  fontSize: "clamp(3rem,6vw,4.6rem)",
  color: "#087a55",
  lineHeight: 1,
  letterSpacing: "-0.03em",
  fontVariantNumeric: "tabular-nums" as const,
  display: "inline-block",
};

export default function MengapaEduPuan() {
  const gridRef = useRef<HTMLDivElement>(null);
  const sudahJalan = useRef(false);
  const [progres, setProgres] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el || sudahJalan.current) return;

    const kurangiGerak = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const durasi = kurangiGerak ? 0 : 2000;
    let rafId = 0;

    const mulaiAnimasi = () => {
      if (sudahJalan.current) return;
      sudahJalan.current = true;
      const waktuMulai = performance.now();
      const tick = (sekarang: number) => {
        const berjalan = sekarang - waktuMulai;
        if (berjalan >= durasi) {
          setProgres(1);
          return;
        }
        const t = berjalan / durasi;
        setProgres(1 - Math.pow(1 - t, 3));
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      mulaiAnimasi();
      return () => window.cancelAnimationFrame(rafId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            observer.disconnect();
            mulaiAnimasi();
            break;
          }
        }
      },
      { threshold: [0.4] },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const persenPerempuan =
    progres >= 1 ? "62,14%" : `${(62.14 * progres).toFixed(2).replace(".", ",")}%`;
  const jumlahAduan =
    progres >= 1 ? "1.081" : Math.round(1081 * progres).toLocaleString("id-ID");

  return (
    <section style={{ background: "#f1fbf5" }} className="py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Judul */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#0b8a60",
                marginBottom: 10,
              }}
            >
              Latar belakang
            </p>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.7rem,3.4vw,2.6rem)",
                color: "#10372a",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              Mengapa EduPuan Dibuat
            </h2>
          </div>
          <p className="md:max-w-sm" style={{ fontSize: 15, lineHeight: 1.65, color: "#3f5d50" }}>
            Data menunjukkan perempuan paling banyak terdampak pinjol — dan penagihannya sering
            berujung kekerasan.
          </p>
        </div>

        {/* 2 kartu angka */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div
            className="flex flex-col gap-4 rounded-3xl p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
            style={KARTU_STYLE}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#10372a" }}>
              Mayoritas korban pinjol adalah perempuan
            </h3>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span style={{ ...ANGKA_STYLE, minWidth: "3.7em" }}>{persenPerempuan}</span>
              <span style={{ fontSize: 14, color: "#3f5d50" }}>1.208 dari 1.944 pengaduan</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: "#e1f3e8", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(62.14 * progres).toFixed(2)}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: "#087a55",
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: "#4b6559" }}>
              Sumber: LBH Jakarta 2018–2024, dikutip Kompas.com
            </p>
          </div>

          <div
            className="flex flex-col gap-4 rounded-3xl p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
            style={KARTU_STYLE}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#10372a" }}>
              Pengaduan pinjol ilegal, Jan–Mar 2025
            </h3>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span style={{ ...ANGKA_STYLE, minWidth: "2.55em" }}>{jumlahAduan}</span>
              <span style={{ fontSize: 14, color: "#3f5d50" }}>aduan dalam 3 bulan</span>
            </div>
            <div
              style={{
                display: "flex",
                height: 10,
                borderRadius: 99,
                background: "#e1f3e8",
                overflow: "hidden",
                gap: progres > 0 ? 3 : 0,
              }}
            >
              <div style={{ width: `${(61 * progres).toFixed(2)}%`, height: "100%", background: "#087a55" }} />
              <div style={{ width: `${(39 * progres).toFixed(2)}%`, height: "100%", background: "#e9b949" }} />
            </div>
            <div className="flex justify-between flex-wrap gap-2" style={{ fontSize: 12, color: "#3f5d50" }}>
              <span>Perempuan 657 (±61%)</span>
              <span>Laki-laki 424 (±39%)</span>
            </div>
            <p style={{ fontSize: 12, color: "#4b6559" }}>Sumber: Kompas.com, 2025</p>
          </div>
        </div>

        {/* Kartu lebar: bentuk kekerasan */}
        <div
          className="mt-4 sm:mt-5 rounded-3xl p-6 sm:p-8"
          style={{ background: "#e1f6e9", border: "1px solid rgba(8,122,85,0.12)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-5">
            <h3 style={{ fontSize: 19, fontWeight: 700, color: "#10372a" }}>
              Penagihan bisa menimbulkan berbagai bentuk kekerasan
            </h3>
            <span style={{ fontSize: 12, color: "#4b6559" }}>Sumber: Kompas TV &amp; Kompas.com</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {BENTUK_KEKERASAN.map((item) => (
              <div
                key={item.no}
                className="flex flex-col gap-2 rounded-2xl p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "#ffffff", border: "1px solid rgba(16,55,42,0.08)" }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0b8a60" }}>{item.no}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#10372a" }}>{item.judul}</span>
                <span style={{ fontSize: 13, lineHeight: 1.6, color: "#3f5d50" }}>{item.deskripsi}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}