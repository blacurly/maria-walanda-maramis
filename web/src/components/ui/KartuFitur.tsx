import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TONE, type Tone } from "@/lib/tone";

// Warna judul berbentuk kapsul (dipakai varian "kapsul", mis. halaman Mau Pinjam)
const KAPSUL: Record<Tone, string> = {
  emerald: "bg-[#25865B]",
  sky: "bg-[#397FB8]",
  amber: "bg-[#C05200]",
  rose: "bg-rose-700",
  violet: "bg-violet-700",
};

type Props = {
  href: string;
  judul: string;
  isi: string;
  tone: Tone;
  ikon?: ReactNode;
  varian?: "polos" | "kapsul";
  ajakan?: string;
  className?: string;
};

export default function KartuFitur({ href, judul, isi, tone, ikon, varian = "polos", ajakan, className }: Props) {
  const t = TONE[tone];
  return (
    <Link
      href={href}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          "h-full items-start gap-0 rounded-2xl border-2 p-6 shadow-sm ring-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-[.98]",
          t.kartu,
          className,
        )}
      >
        {ikon && (
          <span
            className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-full text-3xl leading-none", t.ikon)}
            aria-hidden="true"
          >
            {ikon}
          </span>
        )}
        <h2
          className={
            varian === "kapsul"
              ? cn("mb-3 w-fit rounded-full px-4 py-2 text-base font-bold text-white", KAPSUL[tone])
              : "mb-1.5 text-base font-bold text-foreground"
          }
        >
          {judul}
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">{isi}</p>
        {ajakan && (
          <span className={cn("mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors", t.ajakan)}>
            {ajakan}
            <span aria-hidden="true">→</span>
          </span>
        )}
      </Card>
    </Link>
  );
}