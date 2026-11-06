"use client";

import { useState } from "react";
import { FAQ } from "@/data/faq";

export default function Faq() {
  const [terbuka, setTerbuka] = useState<number | null>(null);
  const [tampilSemua, setTampilSemua] = useState(false);
  const faqTampil = tampilSemua ? FAQ : FAQ.slice(0, 4);

  function gantiTampilSemua() {
    if (tampilSemua && terbuka !== null && terbuka >= 4) setTerbuka(null);
    setTampilSemua(!tampilSemua);
  }

  return (
    <section
      id="faq"
      className="scroll-mt-28"
      style={{ background: "#f9fafb", borderTop: "1px solid #f3f4f6", padding: "72px 0" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#0d6e4b",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            FAQ
          </p>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem,2.5vw,2rem)",
              color: "#111827",
              lineHeight: 1.25,
            }}
          >
            Pertanyaan yang paling sering ditanyakan
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 12, lineHeight: 1.7 }}>
            Jawaban langsung untuk pertanyaan yang paling sering muncul seputar pinjaman online.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqTampil.map((item, i) => {
            const buka = terbuka === i;
            return (
              <div
                key={item.tanya}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                }}
              >
                <button
                  onClick={() => setTerbuka(buka ? null : i)}
                  aria-expanded={buka}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15, color: "#111827", lineHeight: 1.45, flex: 1 }}>
                    {item.tanya}
                  </span>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: buka ? "#0d6e4b" : "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background .2s",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={buka ? "#fff" : "#6b7280"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        width: 14,
                        height: 14,
                        transition: "transform .2s",
                        transform: buka ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {buka && (
                  <div style={{ padding: "0 24px 20px", borderTop: "1px solid #f3f4f6" }}>
                    <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8, marginTop: 16 }}>
                      {item.jawab}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={gantiTampilSemua}
            aria-expanded={tampilSemua}
            className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {tampilSemua ? "Tampilkan lebih sedikit" : "Selengkapnya"}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform ${tampilSemua ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}