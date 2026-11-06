import type { ReactNode } from "react";

const GAYA = {
  danger: "bg-red-50 border-red-200 text-red-900",
  warn: "bg-amber-50 border-amber-200 text-amber-900",
  ok: "bg-emerald-50 border-emerald-200 text-emerald-900",
  info: "bg-sky-50 border-sky-200 text-sky-900",
};

type Props = {
  jenis: keyof typeof GAYA;
  children: ReactNode;
};

export default function Alert({ jenis, children }: Props) {
  return <div className={`rounded-xl border p-4 text-sm leading-relaxed ${GAYA[jenis]}`}>{children}</div>;
}