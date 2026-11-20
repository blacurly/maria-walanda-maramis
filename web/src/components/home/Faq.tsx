"use client";

import { useState } from "react";
import { FAQ } from "@/data/faq";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Faq() {
  
  const [tampilSemua, setTampilSemua] = useState(false);
  const faqTampil = tampilSemua ? FAQ : FAQ.slice(0, 4);

  function gantiTampilSemua() {
    
    setTampilSemua(!tampilSemua);
  }

  return (
    <section
      id="faq"
      className="scroll-mt-28"
      style={{ background: "#f9fafb", borderTop: "1px solid #a7d8bf", padding: "72px 0" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              fontSize: 16,
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

        <Accordion type="single" collapsible className="gap-3">
  {faqTampil.map((item) => (
    <AccordionItem
      key={item.tanya}
      value={item.tanya}
      className="overflow-hidden rounded-2xl border border-[#a7d8bf] bg-[#e8f5ee] shadow-sm not-last:border-b"
    >
      <AccordionTrigger className="px-6 py-5 text-[15px] font-semibold leading-snug text-gray-900 hover:no-underline">
        {item.tanya}
      </AccordionTrigger>
      <AccordionContent className="border-t border-[#BEE0D0] px-6 pb-5 pt-4 text-sm leading-[1.8] text-gray-600">
        {item.jawab}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>

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