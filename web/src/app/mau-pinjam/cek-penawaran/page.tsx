import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import CekPenawaran from "@/components/fitur/cek-penawaran/CekPenawaran";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "Cek Penawaran – EduPuan",
  description:
    "Periksa biaya penawaran pinjaman terhadap batas OJK dan kemampuan bayarmu sebelum memutuskan meminjam.",
};

export default async function CekPenawaranPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;

  return (
    <div className={`${sora.variable} ${jakarta.variable}`}>
      <CekPenawaran modeDemo={demo === "1"} />
    </div>
  );
}